package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"

	"github.com/google/generative-ai-go/genai"
	"github.com/hu-hicoder/Snattsu/back/dggo"
	_ "github.com/mattn/go-sqlite3"
	"google.golang.org/api/option"
)

type SearchRequest struct {
	Query string `json:"query"`
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

		req.Query = req.Query + "の希望小売価格"

		// DuckDuckGo検索
		dg := dggo.New(12, "github.com/tmc/langchaingo/tools/duckduckgo")
		results, err := dg.Search(context.Background(), req.Query)
		if err != nil {
			http.Error(w, "search error", http.StatusInternalServerError)
			return
		}

		// Gemini API呼び出し
		ctx := context.Background()
		client, err := genai.NewClient(ctx, option.WithAPIKey(os.Getenv("GEMINI_API_KEY")))
		if err != nil {
			http.Error(w, "gemini client error", http.StatusInternalServerError)
			return
		}
		defer client.Close()

		model := client.GenerativeModel("gemini-1.5-flash")

		// 検索結果をテキスト化
		resultsText := ""
		for _, res := range results {
			resultsText += fmt.Sprintf("Title: %s\nDescription: %s\nURL: %s\n\n", res.Title, res.Info, res.Ref)
		}

		// Geminiにプロンプト送信
		prompt := fmt.Sprintf(
			"%sを最新の価格1つのみ抽出し、以下のJSONで出力\n"+
				`{"snack":"お菓子名","price":"価格"}`+"\n\n%s", req.Query, resultsText)
		resp, err := model.GenerateContent(ctx, genai.Text(prompt))
		if err != nil {
			http.Error(w, "gemini error", http.StatusInternalServerError)
			return
		}

		// Geminiの返答からJSON部分を抽出
		var snackPrice struct {
			Snack string `json:"snack"`
			Price string `json:"price"`
		}
		found := false
		re := regexp.MustCompile(`\{[\s\S]*\}`) // 最初の { から最後の } まで

		for _, cand := range resp.Candidates {
			if cand.Content == nil {
				continue
			}
			for _, part := range cand.Content.Parts {
				partStr := fmt.Sprint(part)
				// デバッグ用: 実際の返答を出力
				fmt.Println("Gemini reply:", partStr)
				// 正規表現でJSON部分を抽出
				jsonStr := re.FindString(partStr)
				if jsonStr == "" {
					continue
				}
				if err := json.Unmarshal([]byte(jsonStr), &snackPrice); err == nil {
					found = true
					break
				}
			}
			if found {
				break
			}
		}
		if !found {
			http.Error(w, "gemini parse error", http.StatusInternalServerError)
			return
		}

		// クライアントに返す前にDBへ格納
		// db, err := sql.Open("sqlite3", "./yourdb.sqlite3") // DB接続（既存のdb変数があればそれを使う）
		// if err == nil {
		// 	defer db.Close()
		// 	_, err = db.Exec(
		// 		`INSERT INTO prices (snack, price) VALUES (?, ?)`,
		// 		snackPrice.Snack, snackPrice.Price,
		// 	)
		// 	// エラー時はログ出力など（ここでは無視）
		// }

		// クライアントに返す
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(snackPrice)
	})
}
