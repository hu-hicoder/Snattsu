package api

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/hu-hicoder/Snattsu/back/dggo"
)

type SearchRequest struct {
	Query string `json:"query"`
}

type SearchResponse struct {
	Results []dggo.Result `json:"results"`
}

func RegisterSearchAPI() {
	http.HandleFunc("/api/search", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		var req SearchRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		dg := dggo.New(12, "github.com/tmc/langchaingo/tools/duckduckgo")
		results, err := dg.Search(context.Background(), req.Query)
		if err != nil {
			http.Error(w, "search error", http.StatusInternalServerError)
			return
		}

		resp := SearchResponse{Results: results}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})
}
