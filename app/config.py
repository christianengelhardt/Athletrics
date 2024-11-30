import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration class."""
    SECRET_KEY = os.urandom(24)
    SESSION_TYPE = 'filesystem'
    STRAVA_CLIENT_ID = os.getenv('STRAVA_CLIENT_ID')
    STRAVA_CLIENT_SECRET = os.getenv('STRAVA_CLIENT_SECRET')
    REDIRECT_URI = 'http://localhost:5000/callback'
    AUTHORIZATION_BASE_URL = 'https://www.strava.com/oauth/authorize'
    TOKEN_URL = 'https://www.strava.com/oauth/token'
    
    # Additional config settings
    DEBUG = os.getenv('FLASK_ENV') == 'development'
    TEMPLATES_AUTO_RELOAD = True