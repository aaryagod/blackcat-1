import hashlib
import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.models import User, UserRole
from app.database import get_db_connection

SECRET_KEY = os.getenv("SATSA_SECRET_KEY", "nciipc-satsa-supervisory-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

security_scheme = HTTPBearer()

def hash_password(password: str) -> str:
    salt = "satsa_supervisory_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def seed_default_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    users = [
        ("examiner", hash_password("examiner123"), "Dr. V. K. Sharma", "examiner", "NCIIPC Supervisory Directorate", "EXAM-2026-01"),
        ("lead_auditor", hash_password("auditor123"), "Ananya Deshmukh", "lead_auditor", "National Cyber Coordination Centre", "AUD-2026-14"),
        ("admin", hash_password("admin123"), "SysAdmin Officer", "super_admin", "NCIIPC Systems Division", "ADM-2026-00"),
        ("viewer", hash_password("viewer123"), "Observer Officer", "readonly", "Sectoral Cert Observer", "OBS-2026-88")
    ]
    
    for u in users:
        cursor.execute("""
        INSERT OR IGNORE INTO users (username, password_hash, full_name, role, organization, badge_number)
        VALUES (?, ?, ?, ?, ?, ?)
        """, u)
        
    conn.commit()
    conn.close()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username, full_name, role, organization, badge_number FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
    return User(
        username=row["username"],
        full_name=row["full_name"],
        role=UserRole(row["role"]),
        organization=row["organization"] or "NCIIPC",
        badge_number=row["badge_number"] or "EXAM-2026"
    )

def require_role(allowed_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.value not in allowed_roles and current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role {current_user.role.value}"
            )
        return current_user
    return role_checker
