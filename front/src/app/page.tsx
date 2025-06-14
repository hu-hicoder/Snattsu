"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ランダムIDで作成
  const handleAutoCreate = async () => {
    setError(null);
    const res = await fetch("http://localhost:8080/api/create-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      setRoomId(data.roomId); // ← ここで返ってきたIDを使う
      router.push(`/${data.roomId}/set_snacks/`);
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
      router.push(`/${id}/set_snacks/`);
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
        router.push(`/${roomId}/set_snacks/`); // ここで遷移
      } else {
        setError("そのルームIDは存在しません。");
      }
    } else {
      setError("通信エラーが発生しました。");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center w-full max-w-md">
        <div className="text-center mb-6 animate-float">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Snattsu</h1>
          <p className="text-lg text-[var(--foreground)] opacity-80">お菓子の価格を当てよう！</p>
        </div>
        
        <section className="card-candy w-full">
          <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">ルームに参加</h2>
          <div className="flex flex-col gap-5">
            <button
              className="btn-primary w-full flex items-center justify-center gap-2"
              onClick={handleAutoCreate}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              ランダムIDで作成
            </button>
            
            <div className="relative">
              <p className="absolute -top-3 left-4 bg-[var(--card-bg)] px-2 text-sm text-[var(--foreground)] opacity-70">
                または
              </p>
              <div className="border-t border-[var(--card-border)] my-4"></div>
            </div>
            
            <form onSubmit={handleManualCreate} className="flex gap-3">
              <input
                type="text"
                className="input-candy flex-1"
                placeholder="ルームIDを入力"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                maxLength={8}
                required
              />
              <button
                type="submit"
                className="btn-success"
              >
                作成
              </button>
            </form>
            
            <form onSubmit={handleJoinRoom} className="flex gap-3">
              <input
                type="text"
                className="input-candy flex-1"
                placeholder="ルームIDを入力"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                maxLength={8}
                required
              />
              <button
                type="submit"
                className="btn-secondary"
              >
                参加
              </button>
            </form>
            
            {error && (
              <div className="bg-red-100 text-red-600 p-3 rounded-xl text-center mt-2 animate-pulse">
                {error}
              </div>
            )}
          </div>
        </section>
        
        <div className="text-center text-sm text-[var(--foreground)] opacity-60 mt-4">
          お菓子の価格を予想して楽しもう！
        </div>
      </main>
    </div>
  );
}
