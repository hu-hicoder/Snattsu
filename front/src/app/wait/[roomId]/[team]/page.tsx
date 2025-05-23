"use client";
import { STATUS_CODES } from "http";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type CardStatus = boolean | "used";

type Card = {
  name: string;
  description: string;
};

type Cards = {
  [key: string]: Card;
};

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

  const [cards, setCards] = useState<Cards | null>(null);
  const fetchSpecialCardList = async () => {
    const res = await fetch("http://localhost:8080/api/special-card", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const json = await res.json();

    if (res.ok) {
      setCards(json.cards as Cards);
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

  const [hoverDescription, setHoverDescription] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const showDescription = (desc: string) => {
    setHoverDescription(desc);
    setVisible(true);
  };

  const hideDescription = () => {
    // 遅延フェードアウトさせる
    setVisible(false);
    setTimeout(() => {
      setHoverDescription(null);
    }, 300); // フェードアウト後に説明文を削除
  };

  if (!cards) {
    return <div>カードを読み込み中...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <h2 className="text-xl font-bold mb-4">
        相手チームの入力を待っています…
      </h2>

      <div>
        <p className="text-lg">スペシャルカードを使用する</p>
        <div className="flex flex-row gap-5 items-center justify-center ">
          {Object.entries(cards).map(([key, card]) => (
            <button
              key={key}
              onClick={() => useSpecialCard(key)}
              onMouseEnter={() => showDescription(card.description)}
              onMouseLeave={() => hideDescription()}
              style={{ marginRight: "10px" }}
              disabled={usedCard !== false}
              className="bg-green-300 rounded-xl p-1 text-xl text-gray-900 disabled:bg-green-50 disabled:text-gray-500"
            >
              {card.name}
            </button>
          ))}
        </div>

        {hoverDescription && (
          <div
            className={`absolute left-0 mt-5 p-3 bg-white border rounded shadow text-gray-600
                        transition-opacity duration-300 z-10 ${
                          visible ? "opacity-100" : "opacity-0"
                        }`}
          >
            <strong>説明:</strong> {hoverDescription}
          </div>
        )}

        {usedCard === true && <p>スペシャルカード{usedCardName}を使用!</p>}
        {usedCard === "used" && <p>既にカードは使用されています。</p>}
      </div>

      <div>
        <p>ルームID: {roomId}</p>
        <p>あなたのチーム: {decodeURIComponent(team)}</p>
      </div>
    </div>
  );
}
