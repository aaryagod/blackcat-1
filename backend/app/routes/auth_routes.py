from fastapi import APIRouter, HTTPException, Depends, status
from app.models import UserLoginRequest, TokenResponse, User
from app.auth import verify_password, create_access_token, get_current_user
from app.database import get_db_connection
from app.audit import record_audit_event

router = APIRouter(prefix="/api/auth", tags=["Authentication & RBAC"])

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, password_hash, full_name, role, organization, badge_number FROM users WHERE username = ?", (login_data.username,))
    row = cursor.fetchone()
    conn.close()
    
    if not row or not verify_password(login_data.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials for supervisory terminal"
        )
        
    user = User(
        username=row["username"],
        full_name=row["full_name"],
        role=row["role"],
        organization=row["organization"],
        badge_number=row["badge_number"]
    )
    
    token = create_access_token({"sub": user.username, "role": user.role.value})
    
    record_audit_event(
        username=user.username,
        role=user.role.value,
        action="EXAMINER_LOGIN_AUTHENTICATED",
        details={"organization": user.organization, "badge": user.badge_number}
    )
    
    return TokenResponse(access_token=token, token_type="bearer", user=user)

@router.get("/me", response_model=User)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
