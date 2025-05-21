"use client";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

export default function SetSnacks() {
  const [team, setTeam] = useState(""); // 入力値をteamに
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!team.trim()) return;

    // DBには何も送信しない（ルームIDのみDB管理のため）
    // 派閥名はlocalStorageなどで管理
    localStorage.setItem(`team_${roomId}`, team);

    // 入力したteam名で遷移
    router.push(`/input_members/${roomId}?team=${encodeURIComponent(team)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <h1 className="text-2xl font-bold mb-4">派閥名を入力</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
        <input
          type="text"
          className="border rounded px-2 py-1 flex-1"
          placeholder="派閥名を入力"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
        />
        <button
          type="submit"
          className="bg-green-600 text-white rounded px-4 py-2 font-semibold hover:bg-green-700 transition"
          disabled={!team.trim()}
        >
          次へ
        </button>
      </form>
    </div>
  );
}