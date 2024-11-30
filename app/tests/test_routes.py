import pytest
from flask import url_for, session

def test_index_route(client):
    """Test the index route."""
    response = client.get('/')
    assert response.status_code == 200
    assert b'Connect with Strava' in response.data

def test_dashboard_route_unauthorized(client):
    """Test dashboard route without authentication."""
    response = client.get('/dashboard')
    assert response.status_code == 302  # Redirect to login
    assert 'login' in response.location

def test_dashboard_route_authorized(client, auth):
    """Test dashboard route with authentication."""
    with client.session_transaction() as sess:
        sess['oauth_token'] = {
            'access_token': 'fake_token',
            'refresh_token': 'fake_refresh',
            'expires_at': 9999999999
        }
    
    response = client.get('/dashboard')
    assert response.status_code == 200
    assert b'Dashboard' in response.data

def test_logout(client, auth):
    """Test logout functionality."""
    with client.session_transaction() as sess:
        sess['oauth_token'] = {'access_token': 'fake_token'}
    
    response = client.get('/logout')
    assert response.status_code == 302
    assert 'oauth_token' not in session