"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ResultRequest = {
  roomId: string;
  team: string;
  productId: number;
};

type ResultResponse = {
  winner: string[];
  averageError: number;
};

export default function Result() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const team = params.team as string;
  const members = Number(searchParams.get("members") || 1);
  const productId = Number(searchParams.get("productId"));

  const [data, setData] = useState<ResultResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const payload: ResultRequest = {
        roomId,
        team,
        productId,
      };

      try {
        const response = await fetch("http://localhost:8080/api/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch result");
        }

        const result: ResultResponse = await response.json();
        setData(result);

        // averageError を加算して保存
        const previous = Number(localStorage.getItem("averageError")) || 0;
        const updated = previous + result.averageError;

        // localStorage に保存
        localStorage.setItem(
          `averageError_${roomId}_${team}`,
          updated.toString()
        );

        // 10秒後にホームに遷移
        setTimeout(() => {
          const nextProductId = productId + 1;
          router.push(
            `/${roomId}/${team}/guess_price/?members=${members}&current=1&productId=${nextProductId}`
          );
        }, 10000);
      } catch (error) {
        console.error("Error fetching result:", error);
      }
    };

    fetchData();
  }, [roomId, team, productId, router]);

  const handleGoHome = () => {
    const nextProductId = productId + 1;
    router.push(
      `/guess_price/${roomId}?members=${members}&current=1&team=${encodeURIComponent(
        team
      )}`
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <div className="text-center mb-2 animate-float">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">結果発表</h1>
        <p className="text-[var(--foreground)] opacity-80">お菓子の価格予想対決</p>
      </div>
      
      <div className="card-candy w-full max-w-md">
        {data ? (
          <div className="flex flex-col items-center gap-6">
            <div className="w-full">
              <div className="text-center mb-6">
                <div className="inline-block bg-[var(--warning)] text-[var(--foreground)] px-6 py-2 rounded-full text-lg font-bold mb-2">
                  勝者: {data.winner.join(', ')}
                </div>
                
                {data.winner.includes(decodeURIComponent(team)) && (
                  <div className="mt-2">
                    <div className="animate-float inline-block">
                      <span className="text-4xl">🎉</span>
                    </div>
                    <p className="text-[var(--foreground)] font-bold mt-1">おめでとうございます！</p>
                  </div>
                )}
              </div>
              
              <div className="bg-[var(--secondary)] bg-opacity-30 rounded-2xl p-5 mb-4">
                <p className="text-[var(--foreground)] text-lg mb-2">
                  チーム「<span className="font-bold">{decodeURIComponent(team)}</span>」の平均誤差
                </p>
                <div className="flex items-center justify-center">
                  <span className="text-4xl font-bold text-[var(--primary)]">
                    {data.averageError.toFixed(2)}
                  </span>
                  <span className="ml-1 text-[var(--foreground)] opacity-70">円</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleGoHome}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              次のラウンドへ
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10">
            <div className="w-16 h-16 relative animate-spin-slow">
              <div className="w-full h-full rounded-full border-4 border-t-[var(--primary)] border-r-[var(--secondary)] border-b-[var(--accent)] border-l-[var(--primary-hover)] opacity-75"></div>
            </div>
            <p className="text-[var(--foreground)] mt-4">結果を計算中...</p>
          </div>
        )}
      </div>
      
      <div className="text-center text-sm text-[var(--foreground)] opacity-60 mt-4">
        10秒後に自動的に次のラウンドに進みます
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
