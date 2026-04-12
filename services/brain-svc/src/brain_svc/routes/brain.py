import uuid
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from brain_svc.models.database import get_db
from brain_svc.models.schemas import BrainCloneRequest, BrainRollbackRequest
from brain_svc.services.clone_pipeline import clone_brain
from brain_svc.auth import AuthClaims, require_auth

router = APIRouter()

@router.post("/clone")
async def clone_brain_endpoint(request: BrainCloneRequest, db: Session = Depends(get_db), auth: AuthClaims = Depends(require_auth)):
    result = clone_brain(db, request)
    return result

@router.get("/{learner_id}")
async def get_brain_state(learner_id: str, db: Session = Depends(get_db), auth: AuthClaims = Depends(require_auth)):
    result = db.execute(
        text("SELECT * FROM brain_states WHERE learner_id = :lid ORDER BY version DESC LIMIT 1"),
        {"lid": learner_id}
    ).mappings().first()

    if not result:
        raise HTTPException(status_code=404, detail="Brain state not found")

    return dict(result)

@router.get("/{learner_id}/history")
async def get_brain_history(learner_id: str, db: Session = Depends(get_db), auth: AuthClaims = Depends(require_auth)):
    results = db.execute(
        text("SELECT * FROM brain_state_snapshots WHERE learner_id = :lid ORDER BY version DESC"),
        {"lid": learner_id}
    ).mappings().all()
    return [dict(r) for r in results]

@router.post("/{learner_id}/rollback")
async def rollback_brain(learner_id: str, request: BrainRollbackRequest, db: Session = Depends(get_db), auth: AuthClaims = Depends(require_auth)):
    snapshot = db.execute(
        text("SELECT * FROM brain_state_snapshots WHERE id = :sid AND learner_id = :lid"),
        {"sid": request.snapshot_id, "lid": learner_id}
    ).mappings().first()

    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    snapshot_data = snapshot["snapshot"]
    if isinstance(snapshot_data, str):
        snapshot_data = json.loads(snapshot_data)

    current = db.execute(
        text("SELECT * FROM brain_states WHERE learner_id = :lid ORDER BY version DESC LIMIT 1"),
        {"lid": learner_id}
    ).mappings().first()

    new_version = (current["version"] if current else 0) + 1

    db.execute(
        text("""UPDATE brain_states SET
            mastery_levels = :ml, disability_signals = :ds, functioning_level_profile = :flp,
            iep_profile = :ip, sensory_profile = :sp, active_accommodations = :aa,
            active_tutors = :at, version = :v, updated_at = :now
            WHERE learner_id = :lid AND id = :bsid"""),
        {
            "ml": json.dumps(snapshot_data.get("mastery_levels", {})),
            "ds": json.dumps(snapshot_data.get("disability_signals", {})),
            "flp": json.dumps(snapshot_data.get("functioning_level_profile", {})),
            "ip": json.dumps(snapshot_data.get("iep_profile", {})),
            "sp": json.dumps(snapshot_data.get("sensory_profile", {})),
            "aa": json.dumps(snapshot_data.get("active_accommodations", [])),
            "at": json.dumps(snapshot_data.get("active_tutors", [])),
            "v": new_version,
            "now": datetime.utcnow(),
            "lid": learner_id,
            "bsid": current["id"] if current else None,
        }
    )

    new_snap_id = str(uuid.uuid4())
    db.execute(
        text("""INSERT INTO brain_state_snapshots
            (id, brain_state_id, learner_id, version, trigger, snapshot, created_at)
            VALUES (:id, :bsid, :lid, :v, 'rebaseline', :snap, :now)"""),
        {
            "id": new_snap_id,
            "bsid": current["id"] if current else None,
            "lid": learner_id,
            "v": new_version,
            "snap": json.dumps(snapshot_data),
            "now": datetime.utcnow(),
        }
    )

    db.commit()
    return {"status": "rolled_back", "version": new_version, "snapshot_id": new_snap_id}

@router.get("/{learner_id}/context")
async def get_brain_context(learner_id: str, db: Session = Depends(get_db), auth: AuthClaims = Depends(require_auth)):
    brain = db.execute(
        text("SELECT * FROM brain_states WHERE learner_id = :lid ORDER BY version DESC LIMIT 1"),
        {"lid": learner_id}
    ).mappings().first()
    if not brain:
        raise HTTPException(status_code=404, detail="Brain state not found")

    sensory = db.execute(
        text("SELECT * FROM sensory_profiles WHERE learner_id = :lid ORDER BY created_at DESC LIMIT 1"),
        {"lid": learner_id}
    ).mappings().first()

    iep = db.execute(
        text("SELECT * FROM iep_profiles WHERE learner_id = :lid ORDER BY created_at DESC LIMIT 1"),
        {"lid": learner_id}
    ).mappings().first()

    iep_goals = db.execute(
        text("SELECT * FROM iep_goals WHERE learner_id = :lid AND status = 'active'"),
        {"lid": learner_id}
    ).mappings().all()

    functioning = db.execute(
        text("SELECT * FROM learner_functioning_levels WHERE learner_id = :lid ORDER BY created_at DESC LIMIT 1"),
        {"lid": learner_id}
    ).mappings().first()

    milestones = db.execute(
        text("SELECT * FROM functional_milestones WHERE learner_id = :lid"),
        {"lid": learner_id}
    ).mappings().all()

    learner = db.execute(
        text("SELECT name, grade_level, communication_mode, diagnoses, curriculum_framework FROM learners WHERE id = :lid"),
        {"lid": learner_id}
    ).mappings().first()

    lang_profile = db.execute(
        text("SELECT * FROM language_profiles WHERE learner_id = :lid ORDER BY created_at DESC LIMIT 1"),
        {"lid": learner_id}
    ).mappings().first()

    brain_dict = dict(brain)
    return {
        "learner": dict(learner) if learner else {},
        "brainState": brain_dict,
        "sensoryProfile": dict(sensory) if sensory else None,
        "iepProfile": dict(iep) if iep else None,
        "iepGoals": [dict(g) for g in iep_goals],
        "functioningLevel": dict(functioning) if functioning else None,
        "functionalMilestones": [dict(m) for m in milestones],
        "languageProfile": dict(lang_profile) if lang_profile else None,
        "activeTutors": brain_dict.get("active_tutors", []),
        "activeAccommodations": brain_dict.get("active_accommodations", []),
        "masteryLevels": brain_dict.get("mastery_levels", {}),
        "episodicMemory": brain_dict.get("episodic_memory", []),
    }


@router.post("/{learner_id}/regression-check")
async def check_regression(learner_id: str, db: Session = Depends(get_db), auth: AuthClaims = Depends(require_auth)):
    brain = db.execute(
        text("SELECT * FROM brain_states WHERE learner_id = :lid ORDER BY version DESC LIMIT 1"),
        {"lid": learner_id}
    ).mappings().first()
    if not brain:
        raise HTTPException(status_code=404, detail="Brain state not found")

    mastery = brain.get("mastery_levels", {})
    if isinstance(mastery, str):
        mastery = json.loads(mastery)

    snapshots = db.execute(
        text("""SELECT snapshot FROM brain_state_snapshots
                WHERE learner_id = :lid
                ORDER BY created_at DESC LIMIT 5"""),
        {"lid": learner_id}
    ).mappings().all()

    regressions = []
    if snapshots:
        prev_snap = snapshots[0]["snapshot"]
        if isinstance(prev_snap, str):
            prev_snap = json.loads(prev_snap)
        prev_mastery = prev_snap.get("mastery_levels", {})

        for domain, current_val in mastery.items():
            if isinstance(current_val, dict):
                current_score = current_val.get("score", 0)
            else:
                current_score = float(current_val) if current_val else 0

            prev_val = prev_mastery.get(domain)
            if prev_val is None:
                continue
            if isinstance(prev_val, dict):
                prev_score = prev_val.get("score", 0)
            else:
                prev_score = float(prev_val) if prev_val else 0

            if prev_score > 0 and (prev_score - current_score) / prev_score >= 0.15:
                drop = prev_score - current_score

                events = db.execute(
                    text("""SELECT * FROM parent_reported_events
                            WHERE learner_id = :lid
                            ORDER BY occurred_at DESC LIMIT 5"""),
                    {"lid": learner_id}
                ).mappings().all()

                factors = []
                for ev in events:
                    factors.append({
                        "type": "parent_reported_event",
                        "eventType": ev["event_type"],
                        "description": ev.get("description"),
                        "occurredAt": ev["occurred_at"].isoformat() if ev.get("occurred_at") else None,
                    })

                analysis_id = str(uuid.uuid4())
                hypothesis = f"Mastery in {domain} dropped by {drop:.1%} (from {prev_score:.2f} to {current_score:.2f})."
                if factors:
                    hypothesis += f" {len(factors)} recent parent-reported event(s) may be correlated."

                db.execute(
                    text("""INSERT INTO causal_analyses
                        (id, learner_id, domain, mastery_drop, previous_mastery, current_mastery,
                         correlated_factors, hypothesis, confidence, status, created_at)
                        VALUES (:id, :lid, :domain, :drop, :prev, :curr, :factors, :hyp, :conf, 'DETECTED', :now)"""),
                    {
                        "id": analysis_id,
                        "lid": learner_id,
                        "domain": domain,
                        "drop": drop,
                        "prev": prev_score,
                        "curr": current_score,
                        "factors": json.dumps(factors),
                        "hyp": hypothesis,
                        "conf": 0.6 if factors else 0.3,
                        "now": datetime.utcnow(),
                    }
                )

                regressions.append({
                    "domain": domain,
                    "drop": round(drop, 4),
                    "previousMastery": round(prev_score, 4),
                    "currentMastery": round(current_score, 4),
                    "correlatedFactors": factors,
                    "hypothesis": hypothesis,
                    "analysisId": analysis_id,
                })

    if regressions:
        db.commit()

    return {
        "learnerId": learner_id,
        "regressionsDetected": len(regressions),
        "regressions": regressions,
    }


@router.post("/{learner_id}/engagement")
async def update_engagement_profile(learner_id: str, request: dict = None, db: Session = Depends(get_db), auth: AuthClaims = Depends(require_auth)):
    import json as json_mod

    if auth.sub != learner_id and auth.role not in ("admin", "teacher", "service"):
        raise HTTPException(status_code=403, detail="Not authorized to update engagement for this learner")

    current = db.execute(
        text("SELECT * FROM brain_states WHERE learner_id = :lid ORDER BY version DESC LIMIT 1"),
        {"lid": learner_id}
    ).mappings().first()

    if not current:
        return {"status": "no_brain_state", "learner_id": learner_id}

    engagement_data = {}
    if request and isinstance(request, dict):
        engagement_data = request.get("engagement", {})

    episodic = current.get("episodic_memory", [])
    if isinstance(episodic, str):
        episodic = json_mod.loads(episodic)
    if not isinstance(episodic, list):
        episodic = []

    episodic.append({
        "type": "engagement_sync",
        "timestamp": datetime.utcnow().isoformat(),
        "totalXp": engagement_data.get("totalXp"),
        "level": engagement_data.get("level"),
        "eventType": engagement_data.get("eventType"),
        "newBadges": engagement_data.get("newBadges", []),
    })

    if len(episodic) > 100:
        episodic = episodic[-100:]

    db.execute(
        text("UPDATE brain_states SET episodic_memory = :em, updated_at = :now WHERE id = :id"),
        {
            "em": json_mod.dumps(episodic),
            "now": datetime.utcnow(),
            "id": current["id"],
        }
    )
    db.commit()

    return {"status": "engagement_synced", "learner_id": learner_id}
