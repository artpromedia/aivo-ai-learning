from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BrainCloneRequest(BaseModel):
    learner_id: str
    tenant_id: str
    assessment_id: Optional[str] = None
    functioning_level: str = "STANDARD"
    parent_assessment_id: Optional[str] = None
    iep_profile_id: Optional[str] = None

class BrainStateResponse(BaseModel):
    id: str
    learner_id: str
    tenant_id: str
    mastery_levels: dict
    disability_signals: dict
    functioning_level_profile: dict
    iep_profile: dict
    sensory_profile: dict
    active_accommodations: list
    active_tutors: list
    version: int
    created_at: datetime
    updated_at: datetime

class SnapshotResponse(BaseModel):
    id: str
    brain_state_id: str
    learner_id: str
    version: int
    trigger: str
    created_at: datetime

class RecommendationCreate(BaseModel):
    learner_id: str
    tenant_id: str
    type: str
    title: str
    description: Optional[str] = None
    payload: dict = {}

class RecommendationResolve(BaseModel):
    status: str
    parent_notes: Optional[str] = None

class BrainRollbackRequest(BaseModel):
    snapshot_id: str
