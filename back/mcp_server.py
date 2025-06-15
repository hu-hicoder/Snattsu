from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from typing import Annotated, Any, Dict
from mcp.server.fastmcp import FastMCP
from fastmcp import FastMCP
import httpx
from pydantic import Field

mcp = FastMCP()


@mcp.tool(name='search', description='キーワードを検索して、ヒットした1件のページのbodyタグを返します。')
async def search(keywords: Annotated[str, Field(description="検索キーワード")]) -> str:
    with DDGS() as ddgs:
        results = list(ddgs.text(
            keywords,
            region='jp-jp',
            safesearch='off',
            timelimit="y",
            max_results=1
        ))

    url = results[0]["href"]
    body = await fetch_url(url)
    return body


async def fetch_url(url: Annotated[str, Field(description="URL")]) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if (response.status_code == 404):
            return "404 Not Found."

        soup = BeautifulSoup(response.text, 'html.parser')
        return soup.body  # type: ignore


if __name__ == "__main__":
    mcp.run()
