from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class ScheduleItem(BaseModel):
    startTime: datetime
    endTime: datetime


class DriverInput(BaseModel):
    id: str
    name: str
    schedules: List[ScheduleItem] = Field(default_factory=list)


class RecommendationRequest(BaseModel):
    date: datetime
    durationMinutes: int = Field(
        ...,
        ge=15,
        le=600,
    )

    drivers: List[DriverInput]


class RecommendationItem(BaseModel):
    assignedTo: str
    assigneeName: str

    startTime: datetime
    endTime: datetime

    durationMinutes: int

    taskCount: int
    workloadMinutes: int

    workloadScore: float
    availabilityScore: float
    score: float

    reason: str


class RecommendationResult(BaseModel):
    best: RecommendationItem
    alternatives: List[RecommendationItem]