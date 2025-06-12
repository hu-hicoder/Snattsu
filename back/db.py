import sqlite3
from threading import Lock

_lock = Lock()

def get_db():
    # sqlite3 is threadsafe if check_same_thread=False
    conn = sqlite3.connect("rooms.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    with _lock:
        db.execute("""
            CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id TEXT UNIQUE,
                snack1 TEXT,
                snack2 TEXT
            )""")
        db.execute("""
            CREATE TABLE IF NOT EXISTS guesses (
                id INTEGER PRIMARY KEY,
                room_id TEXT,
                team TEXT,
                product_id INTEGER,
                error REAL
            )""")
        db.execute("""
            CREATE TABLE IF NOT EXISTS prices (
                id INTEGER PRIMARY KEY,
                price INTEGER NOT NULL
            )""")
        # test data
        db.execute("INSERT OR IGNORE INTO prices (id, price) VALUES (1, 100)")
        db.commit()
    return db