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

    brain_data = {
        "mastery_levels": template["mastery_levels"],
        "disability_signals": {},
        "functioning_level_profile": {"level": request.functioning_level, "determined_at": now.isoformat()},
        "iep_profile": {},
        "sensory_profile": {},
        "active_accommodations": template["active_accommodations"],
        "curriculum_alignment": curriculum_alignment,
        "active_tutors": template["active_tutors"],
        "functional_curriculum": template.get("functional_curriculum", {}),
        "episodic_memory": [],
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
