from langchain_core.tools import tool
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import SessionLocal
from app.models_db import Task, Routine

@tool
def create_task(title: str, description: str=None, due_date: str=None) -> str:
    """Create a new pending task with a title, optional description, and optional due date (ISO string)."""
    db: Session = SessionLocal()
    try:
        user_id = 'default_user'
        parsed_date = None
        if due_date:
            try:
                parsed_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
            except:
                pass
        db_task = Task(title=title, description=description, due_date=parsed_date, user_id=user_id)
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return f"Successfully created task '{title}' with ID {db_task.id}."
    except Exception as e:
        return f'Failed to create task: {str(e)}'
    finally:
        db.close()

@tool
def list_tasks() -> str:
    """List all pending tasks for the current user."""
    db: Session = SessionLocal()
    try:
        user_id = 'default_user'
        tasks = db.query(Task).filter(Task.user_id == user_id, Task.status != 'DONE').all()
        if not tasks:
            return 'You have no pending tasks.'
        result = 'Pending tasks:\n'
        for t in tasks:
            result += f'- [{t.id}] {t.title} (Due: {t.due_date})\n'
        return result
    except Exception as e:
        return f'Failed to list tasks: {str(e)}'
    finally:
        db.close()

@tool
def create_routine(title: str, frequency: str='daily', time_of_day: str=None) -> str:
    """Create a new routine/habit to track, optionally specifying frequency and time of day."""
    db: Session = SessionLocal()
    try:
        user_id = 'default_user'
        db_routine = Routine(title=title, frequency=frequency, time_of_day=time_of_day, user_id=user_id)
        db.add(db_routine)
        db.commit()
        db.refresh(db_routine)
        return f"Successfully created routine '{title}' with ID {db_routine.id}."
    except Exception as e:
        return f'Failed to create routine: {str(e)}'
    finally:
        db.close()