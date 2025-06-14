"use client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function InputMembers() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const team = params.team as string;
  const [members, setMembers] = useState(2);
  const productId = Number(searchParams.get("productId")) || 1; // チーム名をクエリから取得（なければ"A"）

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 必要ならバックエンドに人数を保存
    router.push(
      `/${roomId}/${team}/guess_price/?members=${members}&current=1&productId=${productId}`
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <div className="text-center mb-2 animate-float">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">参加人数を入力</h1>
        <p className="text-[var(--foreground)] opacity-80">チーム「{decodeURIComponent(team)}」の人数</p>
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
          <div className="relative w-full flex justify-center">
            <div className="relative">
              <div className="absolute -left-10 top-1/2 transform -translate-y-1/2">
                <button 
                  type="button"
                  className="text-[var(--foreground)] opacity-70 hover:opacity-100 transition-opacity"
                  onClick={() => members > 1 && setMembers(members - 1)}
                  disabled={members <= 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              
              <input
                type="number"
                min={1}
                max={10}
                value={members}
                onChange={(e) => setMembers(Number(e.target.value))}
                className="input-candy w-24 text-center text-2xl font-bold"
              />
              
              <div className="absolute -right-10 top-1/2 transform -translate-y-1/2">
                <button 
                  type="button"
                  className="text-[var(--foreground)] opacity-70 hover:opacity-100 transition-opacity"
                  onClick={() => members < 10 && setMembers(members + 1)}
                  disabled={members >= 10}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-center text-[var(--foreground)] opacity-80 my-2">
            {members}人で参加します
          </div>
          
          <button
            type="submit"
            className="btn-primary w-full mt-2"
          >
            次へ
          </button>
        </form>
      </div>
      
      <div className="text-center text-sm text-[var(--foreground)] opacity-60 mt-4">
        各メンバーが順番に価格を予想します
      </div>
    </div>
  );
}
