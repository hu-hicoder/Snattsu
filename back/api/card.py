from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_db
from threading import Lock, Timer
from time import time

router = APIRouter()

class CardRequest(BaseModel):
    roomId: str
    team: str
    productId: int
    card: str

class TimerRequest(BaseModel):
    roomId: str
    productId: int

# Card maps
cards = {
    "half": {"name": "ハーフカード", "description": "誤差が半分になる"},
    "reduce": {"name": "リデュースカード", "description": "誤差が10を超えても10まで"}
}
used_cards: dict[str, dict[str, set[str]]] = {}
used_cards_lock = Lock()
# timers
_timers: dict[str, dict[int, dict]] = {}
_timers_lock = Lock()
max_time = 30

def ensure_used(room, team):
    if room not in used_cards:
        used_cards[room] = {}
    if team not in used_cards[room]:
        used_cards[room][team] = set()

@router.get("/special-card")
def get_cards():
    return {"cards": cards}

@router.post("/special-card")
def use_card(req: CardRequest):
    db = get_db()
    ensure_used(req.roomId, req.team)
    if req.card not in cards:
        raise HTTPException(400, "require card")
    with used_cards_lock:
        if req.card in used_cards[req.roomId][req.team]:
            raise HTTPException(409, "already card used")
        used_cards[req.roomId][req.team].add(req.card)
    if req.card == "half":
        db.execute(
            "UPDATE guesses SET error = error / 2 WHERE room_id=? AND team=? AND product_id=?",
            (req.roomId, req.team, req.productId)
        )
    else:
        db.execute(
            "UPDATE guesses SET error = 10 WHERE room_id=? AND team=? AND product_id=? AND error>10",
            (req.roomId, req.team, req.productId)
        )
    db.commit()
    return {"status": "ok"}

@router.post("/discuss-timer")
def discuss_timer(req: TimerRequest):
    now = int(time())
    with _timers_lock:
        if req.roomId not in _timers:
            _timers[req.roomId] = {}
        room_timers = _timers[req.roomId]
        entry = room_timers.get(req.productId)
        if not entry:
            entry = {"start": now, "expired": False}
            room_timers[req.productId] = entry
            # schedule expiration
            Timer(max_time, lambda: entry.update({"expired": True})).start()
        if entry["expired"]:
            remaining = 0
        else:
            elapsed = now - entry["start"]
            remaining = max_time - elapsed if elapsed < max_time else 0
    return {"remaining": remaining}