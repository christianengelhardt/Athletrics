from flask import Blueprint, jsonify, session
from ..services.strava import get_activity_streams
from ..services.oauth import refresh_token

bp = Blueprint('api', __name__)

@bp.route('/activity_streams/<activity_id>')
def activity_streams(activity_id):
    """Fetch activity streams from Strava API."""
    if 'oauth_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    return get_activity_streams(activity_id)

@bp.route('/refresh_token', methods=['POST'])
def refresh():
    """Refresh the OAuth token."""
    if 'oauth_token' not in session:
        return jsonify({'error': 'No token to refresh'}), 400
    
    result = refresh_token()
    if isinstance(result, tuple):
        return result
    
    session['oauth_token'] = result
    return jsonify({'message': 'Token refreshed successfully'})

@bp.route('/activities')
def get_activities():
    """Get all activities for the current user."""
    if 'oauth_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        from ..services.strava import fetch_strava_activities
        activities = fetch_strava_activities()
        return jsonify(activities)
    except Exception as e:
        return jsonify({'error': str(e)}), 500