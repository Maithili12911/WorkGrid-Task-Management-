from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from extensions import mongo
import bcrypt

auth = Blueprint("auth", __name__)

@auth.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        print("DATA RECEIVED:", data)

        email = data["email"]
        password = data["password"]

        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        mongo.db.users.insert_one({
            "email": email,
            "password": hashed
        })

        return {"message": "User created"}

    except Exception as e:
        print("ERROR:", e)
        return {"error": str(e)}, 500


@auth.route("/login", methods=["POST"])
def login():
    try:
        data = request.json

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return {"message": "Missing fields"}, 400

        user = mongo.db.users.find_one({"email": email})

        if not user:
            return {"message": "User not found"}, 404

        stored_password = user["password"]

        if isinstance(stored_password, str):
            stored_password = stored_password.encode('utf-8')

        if bcrypt.checkpw(password.encode('utf-8'), stored_password):
            token = create_access_token(identity=str(user["_id"]))

            # 🔥 ADD THIS BLOCK
            print("\n===== LOGIN SUCCESS =====")
            print("EMAIL:", email)
            print("TOKEN:", token)
            print("========================\n")

            return {"token": token}, 200

        return {"message": "Invalid password"}, 401

    except Exception as e:
        print("LOGIN ERROR:", e)
        return {"error": str(e)}, 500
