from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from fastapi.security import OAuth2PasswordRequestForm
import models
import schemas
import auth
import ai_engine
from database import engine, Base, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-Based Smart Home Architecture Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/token", response_model=schemas.Token)
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/api/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_project = models.Project(**project.model_dump(), user_id=current_user.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Automatically generate Floor Plan upon project creation
    layout = ai_engine.generate_heuristic_floor_plan(
        project.plot_length, project.plot_width, project.budget, project.floors, 
        project.bedrooms, project.bathrooms, project.kitchen_open, project.parking, project.garden
    )
    
    scores = ai_engine.calculate_scores_and_recommendations(layout, project.budget, project.style)
    
    db_floor_plan = models.FloorPlan(
        project_id=db_project.id,
        total_area=project.plot_length * project.plot_width * project.floors,
        energy_score=scores["energy_score"],
        sustainability_score=scores["sustainability_score"],
        space_utilization_score=scores["space_utilization_score"],
        ventilation_score=scores["ventilation_score"],
        smart_home_readiness_score=scores["smart_home_readiness_score"],
        layout_data=layout,
        recommendations_data=scores["recommendations"]
    )
    db.add(db_floor_plan)
    db.commit()
    db.refresh(db_floor_plan)
    
    # Reload project to include floor plan
    db.refresh(db_project)
    return db_project

@app.get("/api/projects", response_model=List[schemas.Project])
def get_projects(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Project).filter(models.Project.user_id == current_user.id).all()

@app.get("/api/projects/{project_id}", response_model=schemas.Project)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
