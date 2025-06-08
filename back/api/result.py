from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_db

router = APIRouter()

class ResultRequest(BaseModel):
    roomId: str
    team: str
    productId: int

@router.post("/result")
def get_result(req: ResultRequest):
    db = get_db()
    # latest error
    cur = db.execute(
        "SELECT error FROM guesses WHERE room_id=? AND team=? AND product_id=? ORDER BY id DESC LIMIT 1",
        (req.roomId, req.team, req.productId)
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(404, "no guess found")
    avg_err = row["error"]
    # min error
    cur = db.execute(
        "SELECT MIN(error) as m FROM guesses WHERE room_id=? AND product_id=?",
        (req.roomId, req.productId)
    )
    m = cur.fetchone()["m"]
    # winners
    cur = db.execute(
        "SELECT team FROM guesses WHERE room_id=? AND product_id=? AND error=?",
        (req.roomId, req.productId, m)
    )
    winners = [r["team"] for r in cur.fetchall()]
    return {"averageError": avg_err, "winner": winners}