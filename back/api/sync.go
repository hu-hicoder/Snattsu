package api

import (
    // "database/sql"
    "encoding/json"
    "net/http"
    "sync"
)

var finishStatus = struct {
    sync.RWMutex
    m map[string]map[string]bool // roomId -> team -> finished
}{m: make(map[string]map[string]bool)}

// 入力完了を受け取るAPI
func RegisterSyncAPI() {
    http.HandleFunc("/api/finish-guess", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }

        var req struct {
            RoomID string `json:"roomId"`
            Team   string `json:"team"`
        }
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "invalid request", http.StatusBadRequest)
            return
        }

        finishStatus.Lock()
        if finishStatus.m[req.RoomID] == nil {
            finishStatus.m[req.RoomID] = make(map[string]bool)
        }
        finishStatus.m[req.RoomID][req.Team] = true
        finishStatus.Unlock()

        w.WriteHeader(http.StatusOK)
    })

    // 両チームの入力完了を確認するAPI
    http.HandleFunc("/api/check-finish", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }

        var req struct {
            RoomID string `json:"roomId"`
        }
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "invalid request", http.StatusBadRequest)
            return
        }

        finishStatus.RLock()
        teams := finishStatus.m[req.RoomID]
        bothFinished := teams != nil && len(teams) >= 2
        finishStatus.RUnlock()

        json.NewEncoder(w).Encode(map[string]bool{"bothFinished": bothFinished})
    })
}