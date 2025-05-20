"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation"; // 追加

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [mode, setMode] = useState<"join" | "create" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // 追加

  // ルームID作成（APIでID作成）
  const handleCreateRoom = async () => {
    setError(null);
    try {
      const res = await fetch("http://localhost:8080/api/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
  
      if (res.ok) {
        const data = await res.json();
        setRoomId(data.roomId); // バックエンドから取得したルームIDを設定
        setMode("create");
        router.push(`/set_snacks/${data.roomId}`); // ここで遷移
      } else if (res.status === 409) {
        setError("ルームIDが重複しました。もう一度お試しください。");
      } else {
        setError("ルーム作成に失敗しました。");
      }
    } catch (err) {
      setError("通信エラーが発生しました。");
    }
  };

  // ルーム参加（APIで存在チェック）
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await fetch("http://localhost:8080/api/check-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.exists) {
        setMode("join");
        router.push(`/set_snacks/${roomId}`); // ここで遷移
      } else {
        setError("そのルームIDは存在しません。");
      }
    } else {
      setError("通信エラーが発生しました。");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <section className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold mb-4 text-center">ルームに参加</h2>
          <div className="flex flex-col gap-4">
            <button
              className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition"
              onClick={handleCreateRoom}
            >
              新しいルームを作成
            </button>
            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                className="border rounded px-2 py-1 flex-1"
                placeholder="ルームIDを入力"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                maxLength={8}
                required
              />
              <button
                type="submit"
                className="bg-green-600 text-white rounded px-4 py-1 font-semibold hover:bg-green-700 transition"
              >
                参加
              </button>
            </form>
            {error && (
              <div className="text-red-600 text-center mt-2">{error}</div>
            )}
            {mode === "create" && (
              <div className="text-center text-blue-700 mt-2">
                作成したルームID: <span className="font-mono">{roomId}</span>
              </div>
            )}
          </div>
        </section>
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        {/* ...既存の説明リストやリンク... */}
      </main>
    </div>
  );
}