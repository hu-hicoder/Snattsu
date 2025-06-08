package api

import (
	"database/sql"
	"encoding/json"
	"math/rand"
	"net/http"
	"fmt"
)

type CheckRequest struct {
	RoomID string `json:"roomId"`
}
type CheckResponse struct {
	Exists bool `json:"exists"`
}

type SnackRequest struct {
	RoomID string `json:"roomId"`
	Snack  string `json:"snack"`
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

// ここでRegisterRoomAPIをエクスポート（大文字で始める）
func RegisterRoomAPI(db *sql.DB) {
	// 例: /api/create-room のエンドポイント
	http.HandleFunc("/api/create-room", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// ランダムなルームID生成
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
			roomID = generateRoomID()
		}

		_, err := db.Exec("INSERT INTO rooms (room_id) VALUES (?)", roomID)
		if err != nil {
			http.Error(w, "failed to create room", http.StatusInternalServerError)
			return
		}
		fmt.Printf("Created room with ID: %s\n", roomID)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"roomId": roomID})
	})

	// ルーム存在チェックAPI
	http.HandleFunc("/api/check-room", func(w http.ResponseWriter, r *http.Request) {
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
		var exists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM rooms WHERE room_id = ?)", req.RoomID).Scan(&exists)
		if err != nil {
			http.Error(w, "db error", http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(CheckResponse{Exists: exists})
	})

	// 他のエンドポイントもここで登録できます
}
