"use client";
import Link from 'next/link'
import { useState } from "react";

export default function SetSnacks() {
  const [snack, setSnack] = useState("");
  const [snacks, setSnacks] = useState<string[]>([]);

  const handleAddSnack = (e: React.FormEvent) => {
    e.preventDefault();
    if (snack.trim() !== "") {
      setSnacks([...snacks, snack]);
      setSnack("");
    }
  };

  const handleRemoveSnack = (index: number) => {
    setSnacks(snacks.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-16">
      <h1 className="text-2xl font-bold mb-4">お菓子を選択</h1>
      <form onSubmit={handleAddSnack} className="flex gap-2 mb-4">
        <input
          type="text"
          className="border rounded px-2 py-1 flex-1"
          placeholder="お菓子の名前"
          value={snack}
          onChange={(e) => setSnack(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-1 font-semibold hover:bg-blue-700 transition"
        >
          追加
        </button>
      </form>
      <ul className="list-disc list-inside mb-4">
        {snacks.map((s, index) => (
          <li key={index} className="flex justify-between items-center">
            {s}
            <button
              onClick={() => handleRemoveSnack(index)}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
      <Link href="/room" className="bg-green-600 text-white rounded px-4 py-2 font-semibold hover:bg-green-700 transition">
        次へ
      </Link>
    </div>
  );
}