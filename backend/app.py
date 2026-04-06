

from flask import Flask
from flask_cors import CORS
from extensions import mongo, jwt
import socket 
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)

app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

# ADD THESE
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"
app.config["JWT_ALGORITHM"] = "HS256"

mongo.init_app(app)
jwt.init_app(app)

CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    allow_headers=["Content-Type", "Authorization"]
)

from routes.auth import auth
from routes.tasks import tasks

app.register_blueprint(auth, url_prefix="/api/auth")
app.register_blueprint(tasks, url_prefix="/api/tasks")

@app.route("/")
def home():
    return {"message": "API running"}



if __name__ == "__main__":
    app.run(port=8000, debug=True, use_reloader=True)