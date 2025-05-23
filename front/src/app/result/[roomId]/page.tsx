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
  const team = searchParams.get("team") || "A";
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
        localStorage.setItem("averageError", updated.toString());

        // 10秒後にホームに遷移
        setTimeout(() => {
          const nextProductId = productId + 1;
          router.push(
            `/guess_price/${roomId}/?members=${members}&current=1&team=${team}&productId=${nextProductId}`
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">結果</h1>
        {data ? (
          <>
            <p className="text-gray-600 text-lg">
              Winner:{" "}
              <span className="font-semibold">{data.winner.join()}</span>
            </p>
            <p className="text-gray-600 text-lg">
              チーム <span className="font-semibold">{team}</span> の平均誤差：
            </p>
            <p className="text-3xl font-bold text-blue-600 mt-2 mb-4">
              {data.averageError.toFixed(2)}
            </p>
            <button
              onClick={handleGoHome}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full"
            >
              ホームへ戻る
            </button>
          </>
        ) : (
          <p className="text-gray-500">読み込み中...</p>
        )}
      </div>
    </div>
  );
}
