"""Authentication routes with JWT."""

from fastapi import APIRouter, Depends, HTTPException, status

from auth import create_access_token, get_current_user_id, hash_password, verify_password
from database import supabase
from schemas import LoginUser, RegisterUser

router = APIRouter(prefix="/auth", tags=["Authentication"])


def public_user(user_row: dict) -> dict:
    return {
        "id": user_row["id"],
        "name": user_row["name"],
        "email": user_row["email"],
        "created_at": user_row.get("created_at"),
    }


@router.post("/register")
def register(user: RegisterUser):
    email = user.email.lower().strip()

    existing = supabase.table("users").select("id").eq("email", email).execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    response = (
        supabase.table("users")
        .insert(
            {
                "name": user.name.strip(),
                "email": email,
                "password_hash": hash_password(user.password),
            }
        )
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=500, detail="Could not create user")

    db_user = response.data[0]
    token = create_access_token({"user_id": db_user["id"], "email": db_user["email"]})

    return {
        "message": "User registered successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": public_user(db_user),
    }


@router.post("/login")
def login(user: LoginUser):
    email = user.email.lower().strip()

    response = supabase.table("users").select("*").eq("email", email).execute()
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    db_user = response.data[0]

    if not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"user_id": db_user["id"], "email": db_user["email"]})

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": public_user(db_user),
    }


@router.get("/me")
def me(user_id: str = Depends(get_current_user_id)):
    response = supabase.table("users").select("id, name, email, created_at").eq("id", user_id).execute()

    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"user": public_user(response.data[0])}
