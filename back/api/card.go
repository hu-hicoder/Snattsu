package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type CardRequest struct {
	RoomID    string `json:"roomId"`
	Team      string `json:"team"`
	ProductID int    `json:"productId"`
	Card      string `json:"card"`
}

type CardEnum int

// iotaを用いて連番を生成する
const (
	Half CardEnum = iota
	Reduce
)

// iotaを用いて生成した連番に対して、別名を与えて定義する
func (yn CardEnum) String() string {
	switch yn {
	case Half:
		return "half"
	case Reduce:
		return "reduce"
	default:
		return "undefined"
	}
}

// roomId -> team -> finished
var usedCardStatus = make(map[string]map[string]map[CardEnum]bool)

func ensureUsedCardMap(roomID, team string) {
	if _, ok := usedCardStatus[roomID]; !ok {
		usedCardStatus[roomID] = make(map[string]map[CardEnum]bool)
	}
	if _, ok := usedCardStatus[roomID][team]; !ok {
		usedCardStatus[roomID][team] = make(map[CardEnum]bool)
	}
}

func RegisterCardAPI(db *sql.DB) {
	http.HandleFunc("/api/special-card", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method == http.MethodGet {
			methodGet(w, r)
			return
		}

		if r.Method == http.MethodPost {
			methodPost(w, r, db)
			return
		}

		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	})
}

func methodGet(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string][]string{
		"cards": {Half.String(), Reduce.String()},
	})
}

func methodPost(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var req CardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	// init map
	ensureUsedCardMap(req.RoomID, req.Team)

	var res sql.Result
	var err error
	switch req.Card {
	case Half.String():
		// 既にカードが使用されていればエラー
		if usedCardStatus[req.RoomID][req.Team][Half] {
			http.Error(w, "already card used", http.StatusConflict) // 409 Conflict
			return
		}

		// 該当するerrorを半分にする
		res, err = db.Exec(`UPDATE guesses SET error = error / 2
					WHERE room_id = ? AND team = ? AND product_id = ?
				`, req.RoomID, req.Team, req.ProductID)

		usedCardStatus[req.RoomID][req.Team][Half] = true

	case Reduce.String():
		// 既にカードが使用されていればエラー
		if usedCardStatus[req.RoomID][req.Team][Reduce] {
			http.Error(w, "already card used", http.StatusConflict) // 409 Conflict
			return
		}

		// errorが10を超えていたら10に設定
		// そうでなければそのまま
		res, err = db.Exec(`UPDATE guesses SET error = 10
					WHERE room_id = ? AND team = ? AND product_id = ? AND error > 10;
				`, req.RoomID, req.Team, req.ProductID)

		usedCardStatus[req.RoomID][req.Team][Reduce] = true

	default:
		http.Error(w, "require card", http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		http.Error(w, "no matching record", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
}
