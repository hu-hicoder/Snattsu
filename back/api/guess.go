package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type GuessRequest struct {
	RoomID    string `json:"roomId"`
	Team      string `json:"team"`
	Members   int    `json:"members"`
	Guesses   []int  `json:"guesses"`
	ProductID int    `json:"productId"` // ← 単一商品のID
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

		// 重複チェック
		var exists int
		err := db.QueryRow(`SELECT COUNT(*) FROM guesses
			WHERE room_id = ? AND team = ? AND product_id = ?
		`, req.RoomID, req.Team, req.ProductID).Scan(&exists)
		if err != nil {
			http.Error(w, "database error", http.StatusInternalServerError)
			return
		}
		if exists > 0 {
			http.Error(w, "already submitted", http.StatusConflict) // 409 Conflict
			return
		}

		// 正解の価格をDBに問い合わせ
		var actualPrice int
		err = db.QueryRow("SELECT price FROM prices WHERE id = ?", req.ProductID).Scan(&actualPrice)
		if err != nil {
			http.Error(w, "price not found", http.StatusBadRequest)
			return
		}

		// 誤差の計算
		var totalError int
		for _, guess := range req.Guesses {
			diff := guess - actualPrice
			if diff < 0 {
				diff = -diff
			}
			totalError += diff
		}

		// 誤差の平均
		averageError := float64(totalError) / float64(len(req.Guesses))

		_, err = db.Exec("INSERT INTO guesses (room_id, team, product_id, error) VALUES (?, ?, ?, ?)", req.RoomID, req.Team, req.ProductID, averageError)
		if err != nil {
			http.Error(w, "failed to save guess", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	})
}
