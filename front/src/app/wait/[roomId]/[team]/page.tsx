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
            `/result/${roomId}?team=${team}&members=${members}&productId=${productId}`
          );
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [roomId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <h2 className="text-xl font-bold mb-4">
        相手チームの入力を待っています…
      </h2>
      <p>ルームID: {roomId}</p>
      <p>あなたのチーム: {team}</p>
    </div>
  );
}
