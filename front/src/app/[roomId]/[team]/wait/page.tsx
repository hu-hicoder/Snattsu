"use client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function WaitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const roomId = params.roomId as string;
  const team = params.team as string;
  const members = Number(searchParams.get("members") || 1);
  const productId = Number(searchParams.get("productId"));

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("http://localhost:8080/api/check-finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.bothFinished) {
          router.push(
            `/${roomId}/${team}/discuss?members=${members}&productId=${productId}`
          );
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [roomId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <div className="text-center mb-2 animate-float">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">待機中...</h1>
        <p className="text-[var(--foreground)] opacity-80">相手チームの入力を待っています</p>
      </div>
      
      <div className="card-candy w-full max-w-md">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col gap-2 items-center">
            <span className="inline-block bg-[var(--secondary)] text-[var(--foreground)] px-4 py-1.5 rounded-full text-sm font-medium">
              ルームID: <span className="font-mono font-bold">{roomId}</span>
            </span>
            
            <span className="inline-block bg-[var(--accent)] text-[var(--foreground)] px-4 py-1.5 rounded-full text-sm font-medium">
              チーム: <span className="font-bold">{decodeURIComponent(team)}</span>
            </span>
          </div>
          
          <div className="w-16 h-16 relative animate-spin-slow">
            <div className="w-full h-full rounded-full border-4 border-t-[var(--primary)] border-r-[var(--secondary)] border-b-[var(--accent)] border-l-[var(--primary-hover)] opacity-75"></div>
          </div>
          
          <p className="text-center text-[var(--foreground)] opacity-80">
            もうしばらくお待ちください...
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
