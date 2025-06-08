from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_db

router = APIRouter()

class GuessRequest(BaseModel):
    roomId: str
    team: str
    members: int
    guesses: list[int]
    productId: int

@router.post("/guess-price")
def guess_price(req: GuessRequest):
    db = get_db()
    # duplicate check
    cur = db.execute(
        "SELECT COUNT(*) as cnt FROM guesses WHERE room_id=? AND team=? AND product_id=?",
        (req.roomId, req.team, req.productId)
    )
    if cur.fetchone()["cnt"] > 0:
        raise HTTPException(status_code=409, detail="already submitted")
    # get actual price
    cur = db.execute("SELECT price FROM prices WHERE id=?", (req.productId,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=400, detail="price not found")
    actual = row["price"]
    # calculate error
    total_error = sum(abs(g - actual) for g in req.guesses)
    avg_error = total_error / len(req.guesses)
    db.execute(
        "INSERT INTO guesses (room_id, team, product_id, error) VALUES (?,?,?,?)",
        (req.roomId, req.team, req.productId, avg_error)
    )
    db.commit()
    return {"status": "ok"}
