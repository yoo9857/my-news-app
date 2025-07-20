from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from . import auth, crud, schemas, dependencies
from .database import get_db
from google.oauth2 import id_token
from google.auth.transport import requests
import os

router = APIRouter()

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(dependencies.get_current_active_user)):
    return current_user

@router.put("/users/me/", response_model=schemas.User)
async def update_user_me(user_update: schemas.UserUpdate, current_user: schemas.User = Depends(dependencies.get_current_active_user), db: Session = Depends(get_db)):
    print(f"DEBUG: update_user_me - Received update for user: {current_user.email}")
    print(f"DEBUG: update_user_me - user_update data: nickname={user_update.nickname}, avatar_url={user_update.avatar_url}")
    updated_user = crud.update_user_profile(db, current_user.id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.put("/users/me/password")
async def update_password_me(password_data: schemas.UserCreate, current_user: schemas.User = Depends(dependencies.get_current_active_user), db: Session = Depends(get_db)):
    if not auth.verify_password(password_data.password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    crud.update_user_password(db, current_user.id, password_data.password)
    return {"message": "Password updated successfully"}

@router.get("/users/me/privacy", response_model=schemas.User)
async def read_privacy_settings(current_user: schemas.User = Depends(dependencies.get_current_active_user)):
    return current_user

@router.put("/users/me/privacy", response_model=schemas.User)
async def update_privacy_settings(privacy_update: schemas.PrivacySettingsUpdate, current_user: schemas.User = Depends(dependencies.get_current_active_user), db: Session = Depends(get_db)):
    updated_user = crud.update_privacy_settings(db, current_user.id, privacy_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.get("/users/me/notifications", response_model=schemas.User)
async def read_notification_settings(current_user: schemas.User = Depends(dependencies.get_current_active_user)):
    return current_user

@router.put("/users/me/notifications", response_model=schemas.User)
async def update_notification_settings(notification_update: schemas.NotificationSettingsUpdate, current_user: schemas.User = Depends(dependencies.get_current_active_user), db: Session = Depends(get_db)):
    updated_user = crud.update_notification_settings(db, current_user.id, notification_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.post("/auth/google", response_model=schemas.TokenWithUser)
async def google_auth(request: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        CLIENT_ID = auth.settings.GOOGLE_CLIENT_ID
        
        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(request.id_token_str, requests.Request(), CLIENT_ID, clock_skew_in_seconds=10)

        # ID token is valid. Get the user's Google Account ID from the decoded token.
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        picture = idinfo.get('picture')

        user = crud.get_user_by_email(db, email=email)

        if user:
            # User exists, just use the existing user data
            pass
        else:
            # Create a new user if not exists
            user_create = schemas.UserCreate(
                email=email, 
                password=auth.get_password_hash(os.urandom(16).hex()), # Generate a random password
                nickname=name, 
                avatar_url=picture
            )
            user = crud.create_user(db=db, user=user_create)

        # At this point, 'user' is either the existing or newly created user
        # Now, create an access token containing the full user data.
        access_token_expires = timedelta(minutes=auth.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # Important: The data passed to create_access_token will be encoded in the JWT.
        # We pass the full user object so next-auth can use it in callbacks.
        user_data_for_token = schemas.User.from_orm(user).dict()
        # Add 'sub' claim for authentication dependency
        user_data_for_token["sub"] = user.email

        access_token = auth.create_access_token(
            data=user_data_for_token,
            expires_delta=access_token_expires
        )
        
        # The response for next-auth should include the access_token and the user details
        return schemas.TokenWithUser(
            access_token=access_token,
            token_type="bearer",
            **user_data_for_token
        )

    except ValueError as e: # Invalid token
        print(f"ERROR: Google ID token verification failed: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid Google ID token: {e}")
    except Exception as e:
        print(f"ERROR: An unexpected error occurred during Google auth: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
