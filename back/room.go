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
        room_id TEXT UNIQUE
    )`)
	if err != nil {
		panic(err)
	}

	http.HandleFunc("/api/create-room", func(w http.ResponseWriter, r *http.Request) {
		// ランダムなルームIDを生成
		roomID := generateRoomID()
		for {
			var exists bool
			err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM rooms WHERE room_id = ?)", roomID).Scan(&exists)
			if err != nil {
				http.Error(w, "db error", http.StatusInternalServerError)
				return
			}
			if !exists {
				break
			}
			roomID = generateRoomID() // 重複していたら再生成
		}

		// DBに保存
		_, err := db.Exec("INSERT INTO rooms (room_id) VALUES (?)", roomID)
		if err != nil {
			http.Error(w, "failed to create room", http.StatusInternalServerError)
			return
		}

		fmt.Println("Room ID created:", roomID)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"roomId": roomID})
	})

	http.ListenAndServe(":8080", nil)
}
