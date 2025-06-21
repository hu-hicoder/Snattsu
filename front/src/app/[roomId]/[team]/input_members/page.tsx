"use client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function InputMembers() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const team = params.team as string;
  const [members, setMembers] = useState(2);
  const productId = Number(searchParams.get("productId")) || 1;
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  
  // チーム名（お菓子名）の価格を検索して保存
  useEffect(() => {
    const searchTeamPrice = async () => {
      setIsSearching(true);
      setSearchError("");
      try {
        const response = await fetch("http://localhost:8080/api/team-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, team }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to search for team price");
        }
        
        const data = await response.json();
        if (data.status === "error") {
          setSearchError(data.message || "検索中にエラーが発生しました");
        }
      } catch (error) {
        console.error("Error searching for team price:", error);
        setSearchError("検索中にエラーが発生しました");
      } finally {
        setIsSearching(false);
      }
    };
    
    searchTeamPrice();
  }, [roomId, team]);

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
      {isSearching && (
        <div className="text-blue-600 mb-4">
          チーム「{team}」の価格を検索中...
        </div>
      )}
      {searchError && (
        <div className="text-red-600 mb-4">
          {searchError}
        </div>
      )}
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
