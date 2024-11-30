from flask import Flask
from flask_session import Session
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    Session(app)
    
    from .routes import main, auth, api
    app.register_blueprint(main.bp, name='main')  # Add name
    app.register_blueprint(auth.bp, name='auth')  # Add name
    app.register_blueprint(api.bp, name='api', url_prefix='/api')
    
    return app