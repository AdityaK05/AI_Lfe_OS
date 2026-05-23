from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "TODO"
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None

class Task(TaskBase):
    id: int
    created_at: datetime
    user_id: str

    class Config:
        from_attributes = True

class RoutineBase(BaseModel):
    title: str
    frequency: Optional[str] = "daily"
    time_of_day: Optional[str] = None

class RoutineCreate(RoutineBase):
    pass

class Routine(RoutineBase):
    id: int
    user_id: str

    class Config:
        from_attributes = True

class HabitLogCreate(BaseModel):
    pass

class HabitLog(BaseModel):
    id: int
    routine_id: int
    completed_at: datetime

    class Config:
        from_attributes = True

class ProgressStats(BaseModel):
    tasks_completed_today: int
    tasks_total_today: int
    routines_completed_today: int
    routines_total_today: int
