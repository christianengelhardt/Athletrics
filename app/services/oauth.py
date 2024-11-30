import time
import requests
import logging
from flask import session
from ..config import Config

logger = logging.getLogger(__name__)

# Store OAuth states temporarily
oauth_states = {}

def cleanup_old_states():
    """Remove expired OAuth states (older than 10 minutes)."""
    current_time = time.time()
    expired_states = [
        state for state, (_, timestamp) 
        in oauth_states.items() 
        if current_time - timestamp > 600
    ]
    for state in expired_states:
        del oauth_states[state]

def exchange_code_for_token(code):
    """Exchange authorization code for access token."""
    token_params = {
        'client_id': Config.STRAVA_CLIENT_ID,
        'client_secret': Config.STRAVA_CLIENT_SECRET,
        'code': code,
        'grant_type': 'authorization_code'
    }
    
    try:
        response = requests.post(Config.TOKEN_URL, data=token_params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error exchanging code for token: {str(e)}")
        raise Exception('Failed to exchange code for token')

def refresh_token():
    """Refresh the OAuth access token."""
    refresh_token = session['oauth_token']['refresh_token']
    
    data = {
        'client_id': Config.STRAVA_CLIENT_ID,
        'client_secret': Config.STRAVA_CLIENT_SECRET,
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token
    }
    
    try:
        response = requests.post(Config.TOKEN_URL, data=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error refreshing token: {str(e)}")
        return {'error': 'Failed to refresh token'}, 400

def validate_token():
    """Validate current token and refresh if necessary."""
    if 'oauth_token' not in session:
        return False
        
    token = session['oauth_token']
    # Check if token expires in less than 5 minutes
    if token['expires_at'] - time.time() < 300:
        try:
            new_token = refresh_token()
            if isinstance(new_token, dict) and 'access_token' in new_token:
                session['oauth_token'] = new_token
                return True
            return False
        except Exception as e:
            logger.error(f"Error validating token: {str(e)}")
            return False
            
    return True