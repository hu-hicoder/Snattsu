from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from threading import Lock

router = APIRouter()

finish_status: dict[str, dict[str, bool]] = {}
status_lock = Lock()

class SyncRequest(BaseModel):
    roomId: str
    team: str | None = None

@router.post("/finish-guess")
def finish_guess(req: SyncRequest):
    with status_lock:
        if req.roomId not in finish_status:
            finish_status[req.roomId] = {}
        finish_status[req.roomId][req.team] = True
    return {"status": "ok"}

@router.post("/check-finish")
def check_finish(req: SyncRequest):
    with status_lock:
        teams = finish_status.get(req.roomId, {})
        both = len(teams) >= 2
    return {"bothFinished": both}