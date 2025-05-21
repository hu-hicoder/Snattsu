"use client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";

export default function GuessPrice() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const members = Number(searchParams.get("members") || 1);
  const current = Number(searchParams.get("current") || 1);

  const [price, setPrice] = useState("");

  // 価格入力欄の初期化
  useEffect(() => {
      setPrice("");
  }, [current]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 価格予想をバックエンドに送信
    await fetch("http://localhost:8080/api/guess-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, user: current, price }),
    });

    if (current < members) {
      // 次の人の入力ページへ
      router.replace(`/guess_price/${roomId}?members=${members}&current=${current + 1}`);
    } else {
      // 全員分入力が終わったら結果ページなどへ
      router.push(`/result/${roomId}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <h1 className="text-2xl font-bold mb-4">{current}人目の小売価格予想</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
        <input
          type="number"
          min={1}
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="border rounded px-2 py-1 w-32 text-center"
          placeholder="予想価格（円）"
        />
        <button
          type="submit"
          className="bg-green-600 text-white rounded px-4 py-2 font-semibold hover:bg-green-700 transition"
          disabled={!price}
        >
          決定
        </button>
      </form>
    </div>
  );
}