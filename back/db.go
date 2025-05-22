package main

import (
	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

func InitDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "./rooms.db")
	if err != nil {
		return nil, err
	}

	// roomsテーブル作成
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT UNIQUE,
        snack1 TEXT,
        snack2 TEXT
    )`)
	if err != nil {
		return nil, err
	}

	// guessesテーブル作成
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS guesses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT,
        user INTEGER,
        price INTEGER
    )`)
	if err != nil {
		return nil, err
	}

	// pricesテーブル作成
	_, err = db.Exec(`CREATE TABLE prices (
    id INTEGER PRIMARY KEY,
    price REAL NOT NULL
	);`)
	if err != nil {
		return nil, err
	}

	// とりあえずテストデータを挿入
	_, err = db.Exec(`INSERT INTO prices (price) VALUES (100);`)
	if err != nil {
		return nil, err
	}

	return db, nil
}
