import uuid
import json
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from brain_svc.models.schemas import BrainCloneRequest

SEED_TEMPLATES = {
    "STANDARD": {
        "mastery_levels": {"math": 0.0, "ela": 0.0, "science": 0.0, "history": 0.0, "coding": 0.0},
        "active_accommodations": [],
        "active_tutors": ["nova", "sage", "spark", "chrono", "pixel", "echo", "harmony"],
        "functional_curriculum": {},
    },
    "SUPPORTED": {
        "mastery_levels": {"math": 0.0, "ela": 0.0, "science": 0.0, "history": 0.0},
        "active_accommodations": ["extended_time", "text_to_speech", "simplified_language"],
        "active_tutors": ["nova", "sage", "spark", "echo", "harmony"],
        "functional_curriculum": {},
    },
    "LOW_VERBAL": {
        "mastery_levels": {"math": 0.0, "ela": 0.0, "science": 0.0},
        "active_accommodations": ["picture_supports", "reduced_text", "visual_schedules", "choice_boards"],
        "active_tutors": ["nova", "sage", "echo", "harmony"],
        "functional_curriculum": {"focus": "academic_modified"},
    },
    "NON_VERBAL": {
        "mastery_levels": {"communication": 0.0, "daily_living": 0.0, "social": 0.0},
        "active_accommodations": ["switch_scanning", "aac_integration", "visual_supports", "partner_assisted"],
        "active_tutors": ["echo", "harmony", "compass"],
        "functional_curriculum": {"focus": "functional_academic"},
    },
    "PRE_SYMBOLIC": {
        "mastery_levels": {"cause_effect": 0.0, "sensory_engagement": 0.0, "social_awareness": 0.0},
        "active_accommodations": ["cause_effect_activities", "sensory_stimulation", "partner_assisted_scanning", "microswitches"],
        "active_tutors": ["echo", "harmony"],
        "functional_curriculum": {"focus": "developmental"},
    },
}

DOMAIN_TO_MASTERY = {
    "ela": "ela",
    "math": "math",
    "science": "science",
    "sel": "social",
    "speech": "communication",
    "executive_function": "coding",
}

DIFFICULTY_MULTIPLIER = {
    "easy": 0.8,
    "medium": 1.0,
    "hard": 1.2,
}

def _compute_mastery_from_discovery(discovery_results, template_mastery: dict) -> dict:
    mastery = dict(template_mastery)
    for ch in discovery_results.chapterResults:
        if ch.total <= 0:
            continue
        raw_score = ch.correct / ch.total
        multiplier = DIFFICULTY_MULTIPLIER.get(ch.difficulty, 1.0)
        adjusted = min(1.0, raw_score * multiplier)

        mastery_key = DOMAIN_TO_MASTERY.get(ch.domain, ch.domain)
        if mastery_key in mastery:
            mastery[mastery_key] = round(adjusted, 3)
        else:
            for key in mastery:
                if ch.domain in key or key in ch.domain:
                    mastery[key] = round(adjusted, 3)
                    break
    return mastery

def _build_disability_signals(parent_data) -> dict:
    signals = {}
    if parent_data:
        if parent_data.communicationMode and parent_data.communicationMode != "verbal":
            signals["communication_needs"] = parent_data.communicationMode
        if parent_data.deviceInteraction and parent_data.deviceInteraction != "independent":
            signals["device_access"] = parent_data.deviceInteraction
        if parent_data.attentionSpan and parent_data.attentionSpan not in ("typical", "age_appropriate"):
            signals["attention"] = parent_data.attentionSpan
        if parent_data.diagnoses:
            signals["diagnoses"] = parent_data.diagnoses
        if parent_data.responseMethod and parent_data.responseMethod != "typing":
            signals["preferred_response"] = parent_data.responseMethod
    return signals

def _build_initial_episodic(discovery_results, parent_data) -> list:
    events = []
    now = datetime.utcnow().isoformat()
    if parent_data:
        events.append({
            "type": "parent_assessment_completed",
            "timestamp": now,
            "communicationMode": parent_data.communicationMode,
            "attentionSpan": parent_data.attentionSpan,
            "diagnoses": parent_data.diagnoses or [],
        })
    if discovery_results:
        avg_latency = 0
        if discovery_results.responseLatencies:
            avg_latency = round(sum(discovery_results.responseLatencies) / len(discovery_results.responseLatencies))
        events.append({
            "type": "discovery_adventure_completed",
            "timestamp": now,
            "totalCorrect": discovery_results.totalCorrect,
            "totalAttempts": discovery_results.totalAttempts,
            "xpEarned": discovery_results.xpEarned,
            "avgLatencyMs": avg_latency,
            "chapters": [
                {
                    "domain": ch.domain,
                    "correct": ch.correct,
                    "total": ch.total,
                    "difficulty": ch.difficulty,
                    "avgLatencyMs": round(ch.avgLatencyMs),
                }
                for ch in discovery_results.chapterResults
            ],
        })
    return events


def clone_brain(db: Session, request: BrainCloneRequest) -> dict:
    existing = db.execute(
        text("SELECT id FROM brain_states WHERE learner_id = :lid"),
        {"lid": request.learner_id}
    ).first()

    if existing:
        return {"error": "Brain state already exists", "brain_state_id": existing[0]}

    template = SEED_TEMPLATES.get(request.functioning_level, SEED_TEMPLATES["STANDARD"])

    brain_state_id = str(uuid.uuid4())
    now = datetime.utcnow()

    learner_row = db.execute(
        text("SELECT curriculum_alignment, curriculum_framework, district_name, district_id, zip_code, country FROM learners WHERE id = :lid"),
        {"lid": request.learner_id}
    ).first()

    curriculum_alignment = {}
    if learner_row and learner_row[0]:
        try:
            curriculum_alignment = learner_row[0] if isinstance(learner_row[0], dict) else json.loads(learner_row[0])
        except (json.JSONDecodeError, TypeError):
            curriculum_alignment = {}

    mastery_levels = dict(template["mastery_levels"])
    if request.discovery_results:
        mastery_levels = _compute_mastery_from_discovery(request.discovery_results, mastery_levels)

    disability_signals = {}
    if request.parent_assessment_data:
        disability_signals = _build_disability_signals(request.parent_assessment_data)

    episodic_memory = _build_initial_episodic(request.discovery_results, request.parent_assessment_data)

    brain_data = {
        "mastery_levels": mastery_levels,
        "disability_signals": disability_signals,
        "functioning_level_profile": {"level": request.functioning_level, "determined_at": now.isoformat()},
        "iep_profile": {},
        "sensory_profile": {},
        "active_accommodations": template["active_accommodations"],
        "curriculum_alignment": curriculum_alignment,
        "active_tutors": template["active_tutors"],
        "functional_curriculum": template.get("functional_curriculum", {}),
        "episodic_memory": episodic_memory,
    }

    db.execute(
        text("""INSERT INTO brain_states
            (id, tenant_id, learner_id, mastery_levels, disability_signals,
             functioning_level_profile, iep_profile, sensory_profile,
             active_accommodations, curriculum_alignment, active_tutors,
             functional_curriculum, episodic_memory, version, created_at, updated_at)
            VALUES (:id, :tid, :lid, :ml, :ds, :flp, :ip, :sp, :aa, :ca, :at, :fc, :em, 1, :now, :now)"""),
        {
            "id": brain_state_id,
            "tid": request.tenant_id,
            "lid": request.learner_id,
            "ml": json.dumps(brain_data["mastery_levels"]),
            "ds": json.dumps(brain_data["disability_signals"]),
            "flp": json.dumps(brain_data["functioning_level_profile"]),
            "ip": json.dumps(brain_data["iep_profile"]),
            "sp": json.dumps(brain_data["sensory_profile"]),
            "aa": json.dumps(brain_data["active_accommodations"]),
            "ca": json.dumps(brain_data["curriculum_alignment"]),
            "at": json.dumps(brain_data["active_tutors"]),
            "fc": json.dumps(brain_data["functional_curriculum"]),
            "em": json.dumps(brain_data["episodic_memory"]),
            "now": now,
        }
    )

    snapshot_id = str(uuid.uuid4())
    db.execute(
        text("""INSERT INTO brain_state_snapshots
            (id, brain_state_id, learner_id, version, trigger, snapshot, created_at)
            VALUES (:id, :bsid, :lid, 1, 'initial_clone', :snap, :now)"""),
        {
            "id": snapshot_id,
            "bsid": brain_state_id,
            "lid": request.learner_id,
            "snap": json.dumps(brain_data),
            "now": now,
        }
    )

    db.commit()

    try:
        import httpx
        learning_svc_url = "http://localhost:3005"
        subjects = list(brain_data["mastery_levels"].keys())
        for subject in subjects:
            httpx.post(
                f"{learning_svc_url}/api/learning/path/{request.learner_id}/{subject}/init",
                json={"functioning_level": request.functioning_level},
                timeout=5.0,
            )
    except Exception:
        pass

    return {
        "brain_state_id": brain_state_id,
        "snapshot_id": snapshot_id,
        "version": 1,
        "functioning_level": request.functioning_level,
        "active_tutors": brain_data["active_tutors"],
        "active_accommodations": brain_data["active_accommodations"],
    }
