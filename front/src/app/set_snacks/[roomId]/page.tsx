"use client";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

export default function SetSnacks() {
  const [snack, setSnack] = useState("");
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snack.trim()) return;

    // お菓子名のみバックエンドに送信
    await fetch("http://localhost:8080/api/set-snack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, snack }),
    });
    console.log(roomId)
    router.push(`/input_members/${roomId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <h1 className="text-2xl font-bold mb-4">お菓子を入力</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
        <input
          type="text"
          className="border rounded px-2 py-1 flex-1"
          placeholder="お菓子の名前"
          value={snack}
          onChange={(e) => setSnack(e.target.value)}
        />
        <button
          type="submit"
          className="bg-green-600 text-white rounded px-4 py-2 font-semibold hover:bg-green-700 transition"
          disabled={!snack.trim()}
        >
          次へ
        </button>
      </form>
    </div>
  );
}