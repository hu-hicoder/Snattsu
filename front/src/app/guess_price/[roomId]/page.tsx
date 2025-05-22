"use client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function GuessPrice() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const members = Number(searchParams.get("members") || 1);
  const current = Number(searchParams.get("current") || 1);
  const team = searchParams.get("team") || "A"; // チーム名をクエリから取得（なければ"A"）

  // JSON形式で保存・取得
  const [inputData, setInputData] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`guess_input_${roomId}_${team}`);
      return saved
        ? JSON.parse(saved)
        : {
            roomId,
            team,
            number: members,
            guesses: [],
          };
    }
    return {
      roomId,
      team,
      number: members,
      guesses: [],
    };
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextGuesses = [...inputData.guesses];
    nextGuesses[current - 1] = Number(price);

    const newInputData = {
      ...inputData,
      guesses: nextGuesses,
    };
    setInputData(newInputData);

    if (current < members) {
      // 次の人の入力ページへ
      const team = searchParams.get("team") || "A"; // チーム名をクエリから取得（なければ"A"）
      router.replace(
        `/guess_price/${roomId}?members=${members}&current=${
          current + 1
        }&team=${team}`
      );
    } else {
      // 全員分入力が終わったら結果ページへ
      const productId = 1; // 仮に商品IDを1とする
      const guesses = (newInputData.guesses as string[])
        .map((guess) => `guesses=${encodeURIComponent(guess)}`)
        .join("&");
      router.push(
        `/result/${roomId}?members=${members}&team=${team}&productId=${productId}&${guesses}`
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <h1 className="text-2xl font-bold mb-4">{current}人目の小売価格予想</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 items-center"
      >
        <input
          type="number"
          min={1}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
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
