"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // // ランダムID生成
  // const generateRoomId = () => {
  //   const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  //   let id = "";
  //   for (let i = 0; i < 6; i++) {
  //     id += charset[Math.floor(Math.random() * charset.length)];
  //   }
  //   return id;
  // };

  // ランダムIDで作成
  const handleAutoCreate = async () => {
    setError(null);
    const res = await fetch("http://localhost:8080/api/create-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      setRoomId(data.roomId);
      router.push(`/set_snacks/${data.roomId}`);
    } else {
      setError("ルーム作成に失敗しました。");
    }
  };

  // 手入力で作成
  const handleCreateRoom = async (id: string) => {
    setError(null);
    const res = await fetch("http://localhost:8080/api/create-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: id }),
    });
    if (res.ok) {
      router.push(`/set_snacks/${id}`);
    } else if (res.status === 409) {
      setError("ルームIDが重複しました。別のIDを入力してください。");
    } else {
      setError("ルーム作成に失敗しました。");
    }
  };

  // 入力欄から作成
  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateRoom(roomId);
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
              onClick={handleAutoCreate}
            >
              ランダムIDで作成
            </button>
            <form onSubmit={handleManualCreate} className="flex gap-2">
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
                このIDで作成
              </button>
            </form>
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