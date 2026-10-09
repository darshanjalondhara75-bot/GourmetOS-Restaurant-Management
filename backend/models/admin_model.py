from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")

class AdminUserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class APIResponse(BaseModel):
    success: bool
    message: str
    data: dict | list | None = None
