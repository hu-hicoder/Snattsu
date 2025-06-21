from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_db
import re

router = APIRouter()

class GuessRequest(BaseModel):
    roomId: str
    team: str
    members: int
    guesses: list[int]
    productId: int

@router.post("/guess-price")
async def guess_price(req: GuessRequest):
    db = get_db()
    # duplicate check
    cur = db.execute(
        "SELECT COUNT(*) as cnt FROM guesses WHERE room_id=? AND team=? AND product_id=?",
        (req.roomId, req.team, req.productId)
    )
    if cur.fetchone()["cnt"] > 0:
        raise HTTPException(status_code=409, detail="already submitted")
    # Try to get the price from snack_prices table first
    cur = db.execute("SELECT price FROM snack_prices WHERE snack=?", (req.team,))
    row = cur.fetchone()
    
    if row:
        # Use the price from the snack_prices table
        actual = row["price"]
    else:
        # Fallback to the prices table
        cur = db.execute("SELECT price FROM prices WHERE id=?", (req.productId,))
        row = cur.fetchone()
        if not row:
            # If no price is found, use a default value
            # We can't call search_api directly here due to async/await complexity
            print(f"No price found for team: {req.team}")
            raise HTTPException(status_code=400, detail="price not found")
        else:
            actual = row["price"]
    # calculate error
    if not req.guesses:
        # Handle empty guesses list
        avg_error = 0
    else:
        total_error = sum(abs(g - actual) for g in req.guesses)
        avg_error = total_error / len(req.guesses)
    db.execute(
        "INSERT INTO guesses (room_id, team, product_id, error) VALUES (?,?,?,?)",
        (req.roomId, req.team, req.productId, avg_error)
    )
    db.commit()
    return {"status": "ok"}
