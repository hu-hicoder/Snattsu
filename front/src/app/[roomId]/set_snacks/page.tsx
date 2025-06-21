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
    router.push(`/${roomId}/${encodeURIComponent(team)}/input_members/`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <div className="text-center mb-2 animate-float">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">派閥名を入力</h1>
        <p className="text-[var(--foreground)] opacity-80">あなたのチーム名を決めましょう</p>
      </div>
      
      <div className="card-candy w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-block bg-[var(--secondary)] text-[var(--foreground)] px-4 py-1.5 rounded-full text-sm font-medium">
            ルームID: <span className="font-mono font-bold">{roomId}</span>
          </span>
        </div>
        
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 items-center"
        >
          <div className="w-full relative">
            <input
              type="text"
              className="input-candy w-full text-center text-lg"
              placeholder="派閥名を入力"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            />
            {team && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={!team.trim()}
          >
            次へ
          </button>
        </form>
      </div>
      
      <div className="text-center text-sm text-[var(--foreground)] opacity-60 mt-4">
        チーム名はゲーム中に表示されます
      </div>
    </div>
  );
}
