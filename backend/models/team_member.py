from pydantic import BaseModel

class TeamMember(BaseModel):
    id: int
    user_id: int
    name: str
    role: str
    skills: list[str]
    joined_at: str
    project_id: int
    event_id: int
    project_title: str 