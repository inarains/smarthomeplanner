from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class FloorPlanBase(BaseModel):
    total_area: float
    energy_score: int
    sustainability_score: int
    space_utilization_score: int
    ventilation_score: int
    smart_home_readiness_score: int
    layout_data: Any
    recommendations_data: Any

class FloorPlanCreate(FloorPlanBase):
    pass

class FloorPlan(FloorPlanBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    plot_length: float
    plot_width: float
    budget: float
    floors: int
    bedrooms: int
    bathrooms: int
    kitchen_open: bool
    parking: int
    garden: bool
    style: str

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    user_id: int
    floor_plan: Optional[FloorPlan] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
