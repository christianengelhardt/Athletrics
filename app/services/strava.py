import requests
import logging
from flask import session, jsonify
from ..config import Config

logger = logging.getLogger(__name__)

def fetch_strava_activities():
    """Fetch activities from Strava API."""
    try:
        access_token = session['oauth_token']['access_token']
        activities_url = 'https://www.strava.com/api/v3/athlete/activities'
        headers = {'Authorization': f'Bearer {access_token}'}
        params = {
            'per_page': 100,
            'include_all_efforts': True
        }
        
        print("Fetching with token:", access_token)  # Debug
        response = requests.get(activities_url, headers=headers, params=params)
        print("Response status:", response.status_code)  # Debug
        
        if response.status_code == 200:
            activities = response.json()
            print(f"Fetched {len(activities)} activities")  # Debug
            return activities
        else:
            print(f"Error fetching activities: {response.text}")  # Debug
            return []
            
    except Exception as e:
        print(f"Exception in fetch_strava_activities: {str(e)}")  # Debug
        return []

def get_activity_streams(activity_id):
    """Fetch activity streams from Strava API."""
    access_token = session['oauth_token']['access_token']
    streams_url = f"https://www.strava.com/api/v3/activities/{activity_id}/streams"
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {
        'keys': 'time,heartrate,velocity_smooth,distance',
        'key_by_type': True
    }
    
    try:
        response = requests.get(streams_url, headers=headers, params=params)
        
        if response.status_code == 429:  # Rate limit exceeded
            return jsonify({'error': 'Rate limit exceeded'}), 429
            
        response.raise_for_status()
        return jsonify(response.json())
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching streams: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_activity_details(activity_id):
    """Fetch detailed activity information from Strava API."""
    access_token = session['oauth_token']['access_token']
    activity_url = f"https://www.strava.com/api/v3/activities/{activity_id}"
    headers = {'Authorization': f'Bearer {access_token}'}
    
    try:
        response = requests.get(activity_url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching activity details: {str(e)}")
        return None