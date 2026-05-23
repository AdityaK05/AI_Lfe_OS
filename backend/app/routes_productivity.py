from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
import datetime

from . import models_db, schemas_productivity
from .database import get_db

router = APIRouter(
    prefix="/api",
    tags=["productivity"],
)

def get_user_id(request: Request) -> str:
    # Get user_id from ClerkMiddleware state or fallback
    return getattr(request.state, "user_id", "default_user")

# --- Tasks ---

@router.get("/tasks", response_model=List[schemas_productivity.Task])
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), request: Request = None):
    user_id = get_user_id(request)
    tasks = db.query(models_db.Task).filter(models_db.Task.user_id == user_id).offset(skip).limit(limit).all()
    return tasks

@router.post("/tasks", response_model=schemas_productivity.Task)
def create_task(task: schemas_productivity.TaskCreate, db: Session = Depends(get_db), request: Request = None):
    user_id = get_user_id(request)
    db_task = models_db.Task(**task.model_dump(), user_id=user_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.put("/tasks/{task_id}", response_model=schemas_productivity.Task)
def update_task(task_id: int, task: schemas_productivity.TaskUpdate, db: Session = Depends(get_db), request: Request = None):
    user_id = get_user_id(request)
    db_task = db.query(models_db.Task).filter(models_db.Task.id == task_id, models_db.Task.user_id == user_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), request: Request = None):
    user_id = get_user_id(request)
    db_task = db.query(models_db.Task).filter(models_db.Task.id == task_id, models_db.Task.user_id == user_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return {"ok": True}

# --- Routines ---

@router.get("/routines", response_model=List[schemas_productivity.Routine])
def read_routines(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), request: Request = None):
    user_id = get_user_id(request)
    routines = db.query(models_db.Routine).filter(models_db.Routine.user_id == user_id).offset(skip).limit(limit).all()
    return routines

@router.post("/routines", response_model=schemas_productivity.Routine)
def create_routine(routine: schemas_productivity.RoutineCreate, db: Session = Depends(get_db), request: Request = None):
    user_id = get_user_id(request)
    db_routine = models_db.Routine(**routine.model_dump(), user_id=user_id)
    db.add(db_routine)
    db.commit()
    db.refresh(db_routine)
    return db_routine

@router.post("/routines/{routine_id}/log", response_model=schemas_productivity.HabitLog)
def log_routine(routine_id: int, db: Session = Depends(get_db), request: Request = None):
    user_id = get_user_id(request)
    db_routine = db.query(models_db.Routine).filter(models_db.Routine.id == routine_id, models_db.Routine.user_id == user_id).first()
    if not db_routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    db_log = models_db.HabitLog(routine_id=routine_id)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/routines/{routine_id}/logs", response_model=List[schemas_productivity.HabitLog])
def get_routine_logs(routine_id: int, db: Session = Depends(get_db), request: Request = None):
    user_id = get_user_id(request)
    db_routine = db.query(models_db.Routine).filter(models_db.Routine.id == routine_id, models_db.Routine.user_id == user_id).first()
    if not db_routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    logs = db.query(models_db.HabitLog).filter(models_db.HabitLog.routine_id == routine_id).all()
    return logs

# --- Progress ---

@router.get("/progress", response_model=schemas_productivity.ProgressStats)
def get_progress(db: Session = Depends(get_db), request: Request = None):
    user_id = get_user_id(request)
    today = datetime.datetime.utcnow().date()
    
    # Tasks logic
    tasks_total = db.query(models_db.Task).filter(models_db.Task.user_id == user_id).count()
    tasks_done = db.query(models_db.Task).filter(models_db.Task.user_id == user_id, models_db.Task.status == "DONE").count()
    
    # Routines logic
    routines = db.query(models_db.Routine).filter(models_db.Routine.user_id == user_id).all()
    routines_total = len(routines)
    
    routines_completed = 0
    for r in routines:
        # Check if there is a log for today
        log = db.query(models_db.HabitLog).filter(
            models_db.HabitLog.routine_id == r.id,
        ).order_by(models_db.HabitLog.completed_at.desc()).first()
        
        if log and log.completed_at.date() == today:
            routines_completed += 1
            
    return schemas_productivity.ProgressStats(
        tasks_completed_today=tasks_done,
        tasks_total_today=tasks_total,
        routines_completed_today=routines_completed,
        routines_total_today=routines_total
    )
