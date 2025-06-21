from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from db import init_db, get_db
from api.room import router as room_router
from api.guess import router as guess_router
from api.sync import router as sync_router
from api.card import router as card_router
from api.result import router as result_router
from api.search import router as search_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = init_db()

# include routers
app.include_router(room_router, prefix="/api")
app.include_router(guess_router, prefix="/api")
app.include_router(sync_router, prefix="/api")
app.include_router(card_router, prefix="/api")
app.include_router(result_router, prefix="/api")
app.include_router(search_router)

if __name__ == "__main__":
    print("Starting server on :8080")
    uvicorn.run(app, host="0.0.0.0", port=8080)
