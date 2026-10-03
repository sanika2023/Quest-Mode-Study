from flask import Flask, jsonify

import config
from routes import campaigns, review


def create_app():
    app = Flask(__name__)

    @app.get("/api/config")
    def get_config():
        return jsonify(voice_available=config.voice_available(), demo_mode=config.demo_mode())

    app.register_blueprint(campaigns.bp)
    app.register_blueprint(review.bp)
    return app


app = create_app()
