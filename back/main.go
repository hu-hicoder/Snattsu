package main

import (
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/hu-hicoder/Snattsu/back/api"
)

func main() {
	rand.Seed(time.Now().UnixNano())

	db, err := InitDB()
	if err != nil {
		panic(err)
	}
	defer db.Close()

	// API登録
	api.RegisterRoomAPI(db)
	api.RegisterGuessAPI(db)
	api.RegisterSyncAPI()

	fmt.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}
}
