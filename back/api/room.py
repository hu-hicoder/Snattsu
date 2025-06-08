from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
import random
import string
from db import get_db

router = APIRouter()

class CheckRequest(BaseModel):
    roomId: str

class CheckResponse(BaseModel):
    exists: bool

class CreateResponse(BaseModel):
    roomId: str


def generate_room_id(length: int = 6) -> str:
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@router.post("/create-room", response_model=CreateResponse)
def create_room():
    db = get_db()
    while True:
        room_id = generate_room_id()
        cur = db.execute("SELECT 1 FROM rooms WHERE room_id=?", (room_id,))
        if not cur.fetchone():
            break
    db.execute("INSERT INTO rooms (room_id) VALUES (?)", (room_id,))
    db.commit()
    return {"roomId": room_id}

@router.post("/check-room", response_model=CheckResponse)
def check_room(req: CheckRequest):
    db = get_db()
    cur = db.execute("SELECT 1 FROM rooms WHERE room_id=?", (req.roomId,))
    exists = cur.fetchone() is not None
    return {"exists": exists}