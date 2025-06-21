import os
import re
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from duckduckgo_search import DDGS
import google.generativeai as genai
from dotenv import load_dotenv
from db import get_db

load_dotenv()
router = APIRouter()

class SearchRequest(BaseModel):
    query: str

class TeamSearchRequest(BaseModel):
    roomId: str
    team: str

class SnackPrice(BaseModel):
    snack: str
    price: str

@router.post("/api/search", response_model=SnackPrice)
async def search_api(req: SearchRequest):
    # クエリ整形
    query = req.query + "の希望小売価格"

    # DuckDuckGo検索
    with DDGS() as ddgs:
        results = list(ddgs.text(query, region='jp-jp', safesearch='off', timelimit="y", max_results=5))

    # 検索結果をテキスト化
    results_text = ""
    for res in results:
        results_text += f"Title: {res.get('title')}\nDescription: {res.get('body')}\nURL: {res.get('href')}\n\n"

    # Gemini API呼び出し
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            f"{query}を最新の価格1つのみ抽出し、以下のJSONで出力\n"
            '{"snack":"お菓子名","price":"価格"}\n\n'
            f"{results_text}"
        )
        
        print(f"Sending prompt to Gemini API: {prompt[:100]}...")
        response = model.generate_content([prompt])
        
        # Geminiの返答からJSON部分を抽出
        text = response.text.strip() if hasattr(response, "text") and response.text else ""
        print(f"Gemini API response: {text[:200]}...")
        
        # Try to find JSON in the response
        match = re.search(r'\{[\s\S]*?\}', text)
        if not match:
            print("No JSON found in Gemini response")
            # Fallback: If the team name is the query, create a default JSON
            return SnackPrice(snack=req.query, price="100円")
        
        json_str = match.group(0)
        print(f"Extracted JSON: {json_str}")
    except Exception as e:
        print(f"Error with Gemini API: {e}")
        # Fallback in case of API error
        return SnackPrice(snack=req.query, price="100円")

    try:
        import json
        data = json.loads(json_str)
        
        # Save the result to the database
        db = get_db()
        try:
            # Convert price string to integer (remove non-numeric characters)
            price_str = data.get("price", "100円")
            # Extract numeric part from the price string
            price_numeric = re.sub(r'[^\d]', '', price_str)
            price = int(price_numeric) if price_numeric else 100
            
            snack_name = data.get("snack", req.query)
            
            # Save to database
            db.execute(
                "INSERT OR REPLACE INTO snack_prices (snack, price) VALUES (?, ?)",
                (snack_name, price)
            )
            db.commit()
            print(f"Saved to database: {snack_name}, {price}")
        except Exception as e:
            print(f"Error saving to database: {e}")
        
        return SnackPrice(**data)
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        # Fallback in case of JSON parsing error
        fallback_data = {"snack": req.query, "price": "100円"}
        
        # Save fallback data to database
        db = get_db()
        db.execute(
            "INSERT OR REPLACE INTO snack_prices (snack, price) VALUES (?, ?)",
            (fallback_data["snack"], 100)
        )
        db.commit()
        print(f"Saved fallback data to database: {fallback_data['snack']}, 100")
        
        return SnackPrice(**fallback_data)

@router.post("/api/team-search")
async def team_search(req: TeamSearchRequest):
    """
    Search for a team's price and save it to the database.
    This endpoint is used before the guessing phase to ensure we have the price data.
    """
    print(f"Team search request for: {req.team}")
    db = get_db()
    
    # Check if we already have the price in the database
    cur = db.execute("SELECT price FROM snack_prices WHERE snack=?", (req.team,))
    row = cur.fetchone()
    
    if row:
        # We already have the price
        print(f"Found existing price for {req.team}: {row['price']}")
        return {"status": "ok", "price": row["price"]}
    
    # Search for the price
    try:
        print(f"Searching for price of: {req.team}")
        result = await search_api(SearchRequest(query=req.team))
        
        # Extract numeric part from the price string
        price_str = result.price
        price_numeric = re.sub(r'[^\d]', '', price_str)
        price = int(price_numeric) if price_numeric else 100
        
        print(f"Found price for {req.team}: {price}")
        return {"status": "ok", "price": price}
    except Exception as e:
        print(f"Error searching for price: {e}")
        
        # Fallback: Save a default price
        try:
            db.execute(
                "INSERT OR REPLACE INTO snack_prices (snack, price) VALUES (?, ?)",
                (req.team, 100)
            )
            db.commit()
            print(f"Saved default price for {req.team}: 100")
            return {"status": "ok", "price": 100}
        except Exception as db_error:
            print(f"Error saving default price: {db_error}")
            return {"status": "error", "message": str(e)}
