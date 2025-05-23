"use client";
import { STATUS_CODES } from "http";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type CardStatus = boolean | "used";

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
    }, 5000);

    fetchSpecialCardList();

    return () => clearInterval(interval);
  }, [roomId, router]);

  const [cards, setCards] = useState([] as string[]);
  const fetchSpecialCardList = async () => {
    const res = await fetch("http://localhost:8080/api/special-card", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const json = await res.json();

    if (res.ok) {
      setCards(json.cards as string[]);
    }
  };

  const [usedCardName, setUsedCardName] = useState("");
  const [usedCard, setUsedCard] = useState<CardStatus>(false);
  const useSpecialCard = async (card: string) => {
    const res = await fetch("http://localhost:8080/api/special-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, team, productId, card }),
    });

    if (res.status == 409) {
      setUsedCard("used");
    }

    if (res.ok) {
      setUsedCardName(card);
      setUsedCard(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <h2 className="text-xl font-bold mb-4">
        相手チームの入力を待っています…
      </h2>

      <div>
        <p className="text-lg">スペシャルカードを使用する</p>
        <div className="flex flex-row gap-5 items-center justify-center ">
          {cards.map((card, i) => (
            <button
              key={i}
              onClick={() => useSpecialCard(card)}
              disabled={usedCard !== false}
              className="bg-green-300 rounded-xl p-1 text-xl text-gray-900 disabled:bg-green-50 disabled:text-gray-500"
            >
              {card}
            </button>
          ))}
        </div>
        {usedCard === true && <p>スペシャルカード{usedCardName}を使用!</p>}
        {usedCard === "used" && <p>既にカードは使用されています。</p>}
      </div>

      <div>
        <p>ルームID: {roomId}</p>
        <p>あなたのチーム: {team}</p>
      </div>
    </div>
  );
}
