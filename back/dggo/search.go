package dggo

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"github.com/hashicorp/go-retryablehttp"
	"github.com/wano/contextlog/clog"
	"golang.org/x/xerrors"
)

var (
	ErrNoGoodResult = xerrors.New("no good search results found")
	ErrAPIResponse  = xerrors.New("duckduckgo api responded with error")
)

// Client defines an HTTP client for communicating with duckduckgo.
type Client struct {
	maxResults int
	userAgent  string
}

// Result defines a search query result type.
type Result struct {
	Title       string
	Info        string
	Ref         string
	OriginalUrl string
}

func New(maxResults int, userAgent string) *Client {
	if maxResults == 0 {
		maxResults = 1
	}

	return &Client{
		maxResults: maxResults,
		userAgent:  userAgent,
	}
}

func (client *Client) newRequest(ctx context.Context, queryURL string) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, queryURL, nil)
	if err != nil {
		return nil, fmt.Errorf("creating duckduckgo request: %w", err)
	}

	if client.userAgent != "" {
		request.Header.Add("User-Agent", client.userAgent)
	}

	return request, nil
}

// Search performs a search query and returns
// the result as string and an error if any.
func (client *Client) Search(ctx context.Context, query string) ([]Result, error) {
	queryURL := fmt.Sprintf("https://html.duckduckgo.com/html/?q=%s&kl=jp-jp", url.QueryEscape(query))

	request, err := client.newRequest(ctx, queryURL)
	if err != nil {
		return nil, err
	}

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return nil, fmt.Errorf("get %s error: %w", queryURL, err)
	}

	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, ErrAPIResponse
	}

	doc, err := goquery.NewDocumentFromReader(response.Body)
	if err != nil {
		return nil, fmt.Errorf("new document error: %w", err)
	}

	results := []Result{}
	sel := doc.Find(".web-result")

	for i := range sel.Nodes {
		// Break loop once required amount of results are add
		if client.maxResults == len(results) {
			break
		}
		node := sel.Eq(i)
		titleNode := node.Find(".result__a")

		info := node.Find(".result__snippet").Text()
		title := titleNode.Text()
		ref := ""

		if len(titleNode.Nodes) > 0 && len(titleNode.Nodes[0].Attr) > 2 {
			ref, err = url.QueryUnescape(
				strings.TrimPrefix(
					titleNode.Nodes[0].Attr[2].Val,
					"/l/?kh=-1&uddg=",
				),
			)
			if err != nil {
				return nil, err
			}
		}

		// DuckDuckGoの検索結果のURLを取得
		originalUrl := ``
		{

			duckUrl := fmt.Sprintf("http:%s", ref)

			retryClient := retryablehttp.NewClient()
			retryClient.RetryMax = 5
			retryClient.Logger = nil

			standardClient := retryClient.StandardClient() // *http.Client

			response, err := standardClient.Get(duckUrl)
			if err != nil {
				clog.Panic(err)
			}

			defer response.Body.Close()

			/*
					<html><head><meta name="referrer" content="origin"/></head><body><script language="JavaScript">window.parent.location.replace("https://www.tunecore.co.jp/artists/LOGIC-69STAR");</script><noscript><META http-equiv='refresh' content="0;URL=https://www.tunecore.co.jp/artists/LOGIC-69STAR"></noscript>
				</body></html>
			*/
			// リダイレクト先を取得

			doc, err := goquery.NewDocumentFromReader(response.Body)
			if err != nil {
				clog.Panic(err)
			}

			scriptTag := doc.Find("body").Find("script").Text()
			r := regexp.MustCompile(`"([^"]*)"`)
			matches := r.FindStringSubmatch(scriptTag)
			if len(matches) > 1 {
				originalUrl = matches[1]
			}

		}

		if originalUrl == `` {
			continue
		}

		results = append(results, Result{
			Title:       title,
			Info:        info,
			Ref:         ref,
			OriginalUrl: originalUrl,
		})
	}

	return results, nil
}

func (client *Client) SearchAPI(ctx context.Context, query string) ([]Result, error) {

	queryURL := fmt.Sprintf("https://api.duckduckgo.com/?q=%s&format=json&pretty=1&kl=jp-jp", url.QueryEscape(query))

	//clog.Info(queryURL)

	request, err := client.newRequest(ctx, queryURL)
	if err != nil {
		return nil, err
	}

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return nil, fmt.Errorf("get %s error: %w", queryURL, err)
	}

	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, ErrAPIResponse
	}

	bodyAsBytes, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	body := string(bodyAsBytes)
	fmt.Println(body)

	return nil, nil
}

func (client *Client) SetMaxResults(n int) {
	client.maxResults = n
}

// formatResults will return a structured string with the results.
func (client *Client) FormatResults(results []Result) string {
	formattedResults := ""

	for _, result := range results {
		formattedResults += fmt.Sprintf("Title: %s\nDescription: %s\nURL: %s\n\n", result.Title, result.Info, result.Ref)
	}

	return formattedResults
}
