from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    projects = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Requirements
    plot_length = Column(Float)
    plot_width = Column(Float)
    budget = Column(Float)
    floors = Column(Integer)
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    kitchen_open = Column(Boolean)
    parking = Column(Integer)
    garden = Column(Boolean)
    style = Column(String)

    owner = relationship("User", back_populates="projects")
    floor_plan = relationship("FloorPlan", back_populates="project", uselist=False)

class FloorPlan(Base):
    __tablename__ = "floor_plans"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    total_area = Column(Float)
    energy_score = Column(Integer)
    sustainability_score = Column(Integer)
    space_utilization_score = Column(Integer)
    ventilation_score = Column(Integer)
    smart_home_readiness_score = Column(Integer)
    
    layout_data = Column(JSON) # Stores room polygons/rectangles
    recommendations_data = Column(JSON) # Stores smart device placements

    project = relationship("Project", back_populates="floor_plan")
