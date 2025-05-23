package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type ResultRequest struct {
	RoomID    string `json:"roomId"`
	Team      string `json:"team"`
	Members   int    `json:"members"`
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

		// 最小誤差を取得
		var averageError float64
		err := db.QueryRow(`SELECT error FROM guesses
			WHERE room_id = ? AND team = ? AND product_id = ?
			ORDER BY id DESC
			LIMIT 1
		`, req.RoomID, req.Team, req.ProductID).Scan(&averageError)
		if err != nil {
			return
		}

		// 最小誤差を取得
		var minError float64
		err = db.QueryRow(`SELECT MIN(error) FROM guesses
			WHERE room_id = ? AND product_id = ?
		`, req.RoomID, req.ProductID).Scan(&minError)
		if err != nil {
			return
		}

		// 最小誤差のチームをすべて取得
		rows, err := db.Query(`SELECT team FROM guesses
			WHERE room_id = ? AND product_id = ? AND error = ?
		`, req.RoomID, req.ProductID, minError)
		if err != nil {
			return
		}

		var winners []string
		for rows.Next() {
			var team string
			if err := rows.Scan(&team); err != nil {
				return
			}
			winners = append(winners, team)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"averageError": averageError,
			"winner":       winners,
		})
	})
}
