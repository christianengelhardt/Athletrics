import pytest
import time
from app.services.oauth import cleanup_old_states, oauth_states, exchange_code_for_token
from app.services.strava import fetch_strava_activities, get_activity_streams
from unittest.mock import patch, MagicMock

def test_cleanup_old_states():
    """Test cleanup of expired OAuth states."""
    # Add test states
    oauth_states['test1'] = ('127.0.0.1', time.time() - 700)  # Expired
    oauth_states['test2'] = ('127.0.0.1', time.time())        # Valid
    
    cleanup_old_states()
    
    assert 'test1' not in oauth_states
    assert 'test2' in oauth_states

@patch('requests.post')
def test_exchange_code_for_token(mock_post):
    """Test token exchange functionality."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        'access_token': 'test_token',
        'refresh_token': 'test_refresh'
    }
    mock_post.return_value = mock_response
    
    result = exchange_code_for_token('test_code')
    assert result['access_token'] == 'test_token'
    assert result['refresh_token'] == 'test_refresh'

@patch('requests.get')
def test_fetch_strava_activities(mock_get):
    """Test fetching Strava activities."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [{
        'id': 1,
        'name': 'Test Activity',
        'map': {'summary_polyline': 'test_polyline'}
    }]
    mock_get.return_value = mock_response
    
    with patch('flask.session', {'oauth_token': {'access_token': 'test'}}):
        activities = fetch_strava_activities()
        assert len(activities) == 1
        assert activities[0]['name'] == 'Test Activity'

@patch('requests.get')
def test_get_activity_streams(mock_get):
    """Test fetching activity streams."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        'time': [0, 1, 2],
        'heartrate': [100, 110, 120]
    }
    mock_get.return_value = mock_response
    
    with patch('flask.session', {'oauth_token': {'access_token': 'test'}}):
        response = get_activity_streams('123')
        data = response.get_json()
        assert 'time' in data
        assert 'heartrate' in data