from flask import Blueprint, redirect, url_for, session, render_template
from ..services.strava import fetch_strava_activities
import logging

bp = Blueprint('main', __name__)
logger = logging.getLogger(__name__)

@bp.route('/dashboard')
def dashboard():
    """Display the main dashboard."""
    if 'oauth_token' not in session:
        return redirect(url_for('auth.login'))
    
    activities = fetch_strava_activities()
    logger.debug(f"Fetched {len(activities)} activities")  # Add this line for debugging
    
    return render_template('dashboard.html', activities=activities)