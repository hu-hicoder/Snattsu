package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type GuessRequest struct {
	RoomID string `json:"roomId"`
	User   int    `json:"user"`
	Price  int    `json:"price"`
}

func RegisterGuessAPI(db *sql.DB) {
	http.HandleFunc("/api/guess-price", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		var req GuessRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		_, err := db.Exec("INSERT INTO guesses (room_id, user, price) VALUES (?, ?, ?)", req.RoomID, req.User, req.Price)
		if err != nil {
			http.Error(w, "failed to save guess", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	})
}
