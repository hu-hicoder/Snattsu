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
      <h1 className="text-2xl font-bold mb-4">参加人数を入力</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 items-center"
      >
        <input
          type="number"
          min={1}
          max={10}
          value={members}
          onChange={(e) => setMembers(Number(e.target.value))}
          className="border rounded px-2 py-1 w-24 text-center"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition"
        >
          次へ
        </button>
      </form>
    </div>
  );
}
