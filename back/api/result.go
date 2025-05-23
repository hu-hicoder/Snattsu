package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type ResultRequest struct {
	RoomID    string `json:"roomId"`
	Team      string `json:"team"`
	Number    int    `json:"number"`
	Guesses   []int  `json:"guesses"`
	ProductID int    `json:"productId"` // ← 単一商品のID
}

func RegisterResultAPI(db *sql.DB) {
	http.HandleFunc("/api/result", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		var req ResultRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		// 正解の価格をDBに問い合わせ
		var actualPrice int
		err := db.QueryRow("SELECT price FROM prices WHERE id = ?", req.ProductID).Scan(&actualPrice)
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

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"roomId":       req.RoomID,
			"averageError": averageError,
		})
	})
}
