import pytest
from app import create_app

@pytest.fixture
def app():
    """Create and configure a test Flask application."""
    app = create_app()
    app.config.update({
        'TESTING': True,
        'SERVER_NAME': 'localhost.localdomain',
        'SESSION_TYPE': 'filesystem'
    })
    
    yield app

@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create a test CLI runner."""
    return app.test_cli_runner()

@pytest.fixture
def auth(client):
    """Authentication helper fixture."""
    class AuthActions:
        def __init__(self, client):
            self._client = client
            
        def login(self):
            with self._client.session_transaction() as sess:
                sess['oauth_token'] = {
                    'access_token': 'test_token',
                    'refresh_token': 'test_refresh',
                    'expires_at': 9999999999
                }
            return self._client.get('/')
            
        def logout(self):
            return self._client.get('/logout')
    
    return AuthActions(client)