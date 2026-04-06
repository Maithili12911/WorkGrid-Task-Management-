from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import mongo
from bson import ObjectId
from datetime import datetime

tasks = Blueprint("tasks", __name__)

VALID_STATUS = ["Backlog", "Yet to Start", "In Progress", "Completed"]
VALID_PRIORITY = ["Urgent", "Casual"]
VALID_TOPICS = ["Development", "Testing", "UI Design", "Deployment"]


# ✅ NEW: checklist normalizer
def normalize_checklist(checklist):
    if not isinstance(checklist, list):
        return []

    normalized = []
    for item in checklist:
        if isinstance(item, dict):
            text = str(item.get("text") or item.get("name") or "").strip()
            done = bool(item.get("done", False))
        else:
            text = str(item).strip()
            done = False

        # 🔥 ONLY skip if completely empty AFTER conversion
        if text != "":
            normalized.append({
                "text": text,
                "done": done
            })

    return normalized


def serialize(task):
    task["_id"] = str(task["_id"])

    if task.get("due_date"):
        if isinstance(task["due_date"], datetime):
            task["due_date"] = task["due_date"].isoformat()
        else:
            task["due_date"] = str(task["due_date"])

    task["checklist"] = normalize_checklist(task.get("checklist", []))

    return task


# ✅ GET TASKS
@tasks.route("", methods=["GET"])
@tasks.route("/", methods=["GET"])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()

    tasks_cursor = mongo.db.tasks.find(
        {"user_id": user_id}
    ).sort("created_at", -1)

    return jsonify([serialize(t) for t in tasks_cursor])


# ✅ CREATE TASK
@tasks.route("", methods=["POST"])
@tasks.route("/", methods=["POST"])
@jwt_required()
def create_task():
    user_id = get_jwt_identity()
    data = request.json or {}

    status = data.get("status", "Backlog")
    priority = data.get("priority", "Casual")
    topic = data.get("topic", "Development")

    if status not in VALID_STATUS:
        return {"error": "Invalid status"}, 400

    if priority not in VALID_PRIORITY:
        return {"error": "Invalid priority"}, 400

    if topic not in VALID_TOPICS:
        return {"error": "Invalid topic"}, 400

    due_date = None
    if data.get("due_date"):
        try:
            due_date = datetime.fromisoformat(data["due_date"])
        except:
            return {"error": "Invalid due_date"}, 400

    # Inside tasks.py -> create_task()
    task = {
    "user_id": user_id,
    "title": data.get("title", ""),
    "assignee": data.get("assignee", ""),
    "description": data.get("description", ""), # Add this line
    "priority": priority,
    "status": status,
    "topic": topic,
    "due_date": due_date,
    "reminder": data.get("reminder", False),
    "checklist": normalize_checklist(data.get("checklist", [])),
    "created_at": datetime.utcnow(),
    "updated_at": datetime.utcnow()
    }

    result = mongo.db.tasks.insert_one(task)
    task["_id"] = result.inserted_id

    return jsonify(serialize(task)), 201

#UPDATE TASK
@tasks.route("/<id>", methods=["PUT"])
@jwt_required()
def update_task(id):
    user_id = get_jwt_identity()
    data = request.json or {}

    # 🔥🔥🔥 ADD THIS LINE (CRITICAL FIX)
    data.pop("_id", None)

    if "status" in data and data["status"] not in VALID_STATUS:
        return {"error": "Invalid status"}, 400

    if "priority" in data and data["priority"] not in VALID_PRIORITY:
        return {"error": "Invalid priority"}, 400

    if "topic" in data and data["topic"] not in VALID_TOPICS:
        return {"error": "Invalid topic"}, 400

    if "due_date" in data and data["due_date"]:
        try:
            data["due_date"] = datetime.fromisoformat(data["due_date"])
        except:
            return {"error": "Invalid due_date"}, 400

    # ✅ ONLY update checklist if it has data
    if "checklist" in data:
     normalized = normalize_checklist(data["checklist"])

    # 🔥 ONLY update if not empty
     if len(normalized) > 0:
        data["checklist"] = normalized
     else:
        data.pop("checklist", None)   # 🚨 PREVENT overwrite

    data["updated_at"] = datetime.utcnow()

    mongo.db.tasks.update_one(
        {"_id": ObjectId(id), "user_id": user_id},
        {"$set": data}
    )

    task = mongo.db.tasks.find_one({"_id": ObjectId(id)})
    return jsonify(serialize(task))


# ✅ DELETE TASK
@tasks.route("/<id>", methods=["DELETE"])
@jwt_required()
def delete_task(id):
    user_id = get_jwt_identity()

    mongo.db.tasks.delete_one({
        "_id": ObjectId(id),
        "user_id": user_id
    })

    return jsonify({"message": "Deleted"})