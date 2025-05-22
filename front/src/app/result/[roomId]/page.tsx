"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type ResultRequest = {
  roomId: string;
  team: string;
  number: number;
  productId: number;
  guesses: string[];
};

type ResultResponse = {
  roomId: string;
  averageError: number;
};

export default function Result() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const team = searchParams.get("team") || "A";
  const number = Number(searchParams.get("number")) || 0;
  const productId = Number(searchParams.get("productId"));
  const guesses = searchParams.getAll("guesses");

  const [data, setData] = useState<ResultResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const payload: ResultRequest = {
        roomId,
        team,
        number,
        productId,
        guesses,
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

        // localStorage に保存
        localStorage.setItem("averageError", result.averageError.toString());
      } catch (error) {
        console.error("Error fetching result:", error);
      }
    };

    fetchData();
  }, [roomId, team, number, guesses]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">結果</h1>
        {data ? (
          <>
            <p className="text-gray-600 text-lg">
              チーム <span className="font-semibold">{team}</span> の平均誤差：
            </p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {data.averageError.toFixed(2)}
            </p>
          </>
        ) : (
          <p className="text-gray-500">読み込み中...</p>
        )}
      </div>
    </div>
  );
}
