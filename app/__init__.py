from flask import Flask
from flask_session import Session
from .config import Config

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize Flask-Session
    Session(app)
    
    # Register blueprints
    from .routes import main, auth, api
    app.register_blueprint(main.bp)
    app.register_blueprint(auth.bp)
    app.register_blueprint(api.bp, url_prefix='/api')
    
    return app