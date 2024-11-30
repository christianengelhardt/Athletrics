from flask import Blueprint, redirect, url_for, session, render_template
from ..services.strava import fetch_strava_activities

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    """Handle the root route."""
    if 'oauth_token' in session:
        return redirect(url_for('main.dashboard'))
    return render_template('index.html')

@bp.route('/dashboard')
def dashboard():
    """Display the main dashboard."""
    if 'oauth_token' not in session:
        return redirect(url_for('auth.login'))
    
    activities = fetch_strava_activities()
    print(f"Fetched {len(activities)} activities")  # Debug line
    return render_template('dashboard.html', activities=activities)