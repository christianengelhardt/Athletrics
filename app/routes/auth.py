from flask import Blueprint, redirect, request, jsonify, session, url_for
from requests_oauthlib import OAuth2Session
import time
import logging
from ..services.oauth import cleanup_old_states, oauth_states, exchange_code_for_token
from ..config import Config

bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

@bp.route('/login')
def login():
    """Handle Strava OAuth login."""
    cleanup_old_states()
    strava = OAuth2Session(
        Config.STRAVA_CLIENT_ID, 
        redirect_uri=Config.REDIRECT_URI, 
        scope=['activity:read_all']
    )
    authorization_url, state = strava.authorization_url(Config.AUTHORIZATION_BASE_URL)
    oauth_states[state] = (request.remote_addr, time.time())
    logger.info(f"Setting oauth_state: {state} for IP: {request.remote_addr}")
    return redirect(authorization_url)

@bp.route('/callback')
def callback():
    """Handle OAuth callback from Strava."""
    try:
        state = request.args.get('state')
        if state not in oauth_states:
            logger.error(f"State {state} not found in stored states")
            return jsonify({'error': 'Invalid state parameter'}), 400
        
        stored_ip, _ = oauth_states[state]
        if stored_ip != request.remote_addr:
            logger.error(f"IP mismatch. Stored: {stored_ip}, Current: {request.remote_addr}")
            return jsonify({'error': 'IP address mismatch'}), 400
        
        if 'error' in request.args:
            logger.error(f"Error in OAuth callback: {request.args['error']}")
            return jsonify({'error': request.args['error']}), 400
        
        code = request.args.get('code')
        token = exchange_code_for_token(code)
        session['oauth_token'] = token
        del oauth_states[state]
        
        return redirect(url_for('main.dashboard'))
    except Exception as e:
        logger.error(f"Error in callback: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 400

@bp.route('/logout')
def logout():
    """Handle user logout."""
    session.pop('oauth_token', None)
    return redirect(url_for('main.index'))