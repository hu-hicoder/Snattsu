"use client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

type InputData = {
  roomId: string;
  team: string;
  members: number;
  productId: number;
  guesses: number[];
};

export default function GuessPrice() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const team = params.team as string;
  const members = Number(searchParams.get("members") || 1);
  const current = Number(searchParams.get("current") || 1);
  const productId = Number(searchParams.get("productId")) || 1; // チーム名をクエリから取得（なければ1）

  // JSON形式で保存・取得
  const [inputData, setInputData] = useState<InputData>(() => {
    const data: InputData = {
      roomId,
      team,
      members,
      productId,
      guesses: [],
    };
    if (typeof window !== "undefined") {
      const storageData = localStorage.getItem(`guess_input_${roomId}_${team}`);
      return storageData ? JSON.parse(storageData) : data;
    }
    return data;
  });
  const [price, setPrice] = useState("");

  // ページ切り替え時に入力欄を初期化
  useEffect(() => {
    setPrice("");
  }, [current]);

  // inputDataが変わるたびにlocalStorageに保存
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `guess_input_${roomId}_${team}`,
        JSON.stringify(inputData)
      );
    }
  }, [inputData, roomId, team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 入力データを更新
    const nextGuesses = [...inputData.guesses];
    nextGuesses[current - 1] = Number(price);
    setInputData({ roomId, team, members, productId, guesses: nextGuesses });

    if (current < members) {
      // 次の人の入力ページへ
      router.replace(
        `/${roomId}/${encodeURIComponent(
          team
        )}/guess_price/?members=${members}&current=${
          current + 1
        }&productId=${productId}`
      );
    } else {
      // 全員分入力が終わったら結果ページへ

      // 価格予想をバックエンドに送信
      await fetch("http://localhost:8080/api/guess-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputData),
      });

      // 全員分入力が終わったら「待機ページ」へ遷移し、完了フラグを送信
      await fetch("http://localhost:8080/api/finish-guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, team }),
      });
      router.push(
        `/${roomId}/${team}/wait/?members=${members}&productId=${productId}`
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <div className="text-center mb-2 animate-float">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">{current}人目の小売価格予想</h1>
        <p className="text-[var(--foreground)] opacity-80">
          チーム「{decodeURIComponent(team)}」の{current}/{members}人目
        </p>
      </div>
      
      <div className="card-candy w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-block bg-[var(--secondary)] text-[var(--foreground)] px-4 py-1.5 rounded-full text-sm font-medium">
            商品 #{productId}
          </span>
        </div>
        
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 items-center"
        >
          <div className="w-full relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--foreground)] opacity-70">
              ¥
            </div>
            <input
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-candy w-full text-center text-2xl font-bold pl-8"
              placeholder="予想価格"
            />
            {price && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--foreground)] opacity-70">
                円
              </div>
            )}
          </div>
          
          <div className="text-center text-[var(--foreground)] opacity-80 my-2">
            お菓子の小売価格をズバリ予想！
          </div>
          
          <button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={!price}
          >
            決定
          </button>
        </form>
      </div>
      
      <div className="text-center text-sm text-[var(--foreground)] opacity-60 mt-4">
        他のメンバーには見せないでください
      </div>
    </div>
  );
}
