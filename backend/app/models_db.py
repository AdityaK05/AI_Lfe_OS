from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
import datetime
from .database import Base

class TaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    status = Column(String, default=TaskStatus.TODO)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(String, index=True) # To filter by user from clerk

class Routine(Base):
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    frequency = Column(String, default="daily") # e.g. daily, weekly
    time_of_day = Column(String, nullable=True) # e.g. morning, evening
    user_id = Column(String, index=True)
    
    logs = relationship("HabitLog", back_populates="routine")

class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    routine_id = Column(Integer, ForeignKey("routines.id"))
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    routine = relationship("Routine", back_populates="logs")
