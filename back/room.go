package main

import (
    "database/sql"
    "encoding/json"
    "net/http"
    "fmt"
    _ "github.com/mattn/go-sqlite3"
)

type CheckRequest struct {
    RoomID string `json:"roomId"`
}
type CheckResponse struct {
    Exists bool `json:"exists"`
}

func main() {
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

    http.HandleFunc("/api/check-room", func(w http.ResponseWriter, r *http.Request) {
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
        fmt.Println("Room ID checked:", req.RoomID, "Exists:", exists)
        json.NewEncoder(w).Encode(CheckResponse{Exists: exists})
    })

    http.HandleFunc("/api/create-room", func(w http.ResponseWriter, r *http.Request) {
        var req CheckRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "invalid request", http.StatusBadRequest)
            return
        }
        _, err := db.Exec("INSERT INTO rooms (room_id) VALUES (?)", req.RoomID)
        if err != nil {
            http.Error(w, "room id already exists", http.StatusConflict)
            return
        }
        fmt.Println("Room ID created:", req.RoomID)
        w.WriteHeader(http.StatusCreated)
    })

    http.ListenAndServe(":8080", nil)
}