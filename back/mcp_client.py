import asyncio
import os
from typing import Annotated
from dotenv import load_dotenv
from google import genai
from fastmcp import Client
from google.genai.types import GenerateContentConfig, AutomaticFunctionCallingConfig
from pydantic import BaseModel, Field

load_dotenv()

mcp_client = Client("mcp_server.py")
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = "gemini-2.0-flash"


class Price(BaseModel):
    snack: Annotated[str, Field(description="お菓子の名前")]
    price: Annotated[str, Field(description="販売小売価格")]


async def run_gemini(snack: str):
    async with mcp_client:
        json_format = '{"snack":"お菓子名","price":"価格"}'
        prompt = f"{snack}の最新の価格を検索して1件のみ抽出した次のJSONを出力しなければならない。\n{json_format}"

        tools = await mcp_client.list_tools()
        # Geminiへのリクエスト
        response = await gemini_client.aio.models.generate_content(
            model=MODEL,
            contents=[prompt],
            config=GenerateContentConfig(
                temperature=0,
                tools=[mcp_client.session],
                # automatic_function_calling=AutomaticFunctionCallingConfig(
                #     disable=True
                # )
            )
        )
        call = response.candidates[0].content.parts[0].function_call
        print(response.text)


# サンフランシスコの座標で実行
asyncio.run(run_gemini("きのこの山"))
