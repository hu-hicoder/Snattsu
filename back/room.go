package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type CheckRequest struct {
	RoomID string `json:"roomId"`
}
type CheckResponse struct {
	Exists bool `json:"exists"`
}

// ランダムなルームIDを生成する関数（main関数の外に出す）
func generateRoomID() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func main() {
	rand.Seed(time.Now().UnixNano()) // 乱数の初期化

	fmt.Println("Starting server on :8080")
	db, err := sql.Open("sqlite3", "./rooms.db")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	// テーブル作成（なければ）
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT UNIQUE,
        snack1 TEXT,
        snack2 TEXT
    )`)
	if err != nil {
		panic(err)
	}

	http.HandleFunc("/api/create-room", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		var req CheckRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}
		// 重複チェック
		var exists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM rooms WHERE room_id = ?)", req.RoomID).Scan(&exists)
		if err != nil {
			http.Error(w, "db error", http.StatusInternalServerError)
			return
		}
		if exists {
			http.Error(w, "room id already exists", http.StatusConflict)
			return
		}
		// 登録
		_, err = db.Exec("INSERT INTO rooms (room_id) VALUES (?)", req.RoomID)
		if err != nil {
			http.Error(w, "failed to create room", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"roomId": req.RoomID})
	})

	http.ListenAndServe(":8080", nil)
}
