"use client";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CardStatus = boolean | "used";

type Card = {
  name: string;
  description: string;
};

type Cards = {
  [key: string]: Card;
};

export default function DiscussPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const roomId = params.roomId as string;
  const team = params.team as string;
  const members = Number(searchParams.get("members") || 1);
  const productId = Number(searchParams.get("productId"));

  const [remaining, setRemaining] = useState<number>(30);

  useEffect(() => {
    const interval = setInterval(async () => fetchCountDown(), 1000);
    return () => clearInterval(interval);
  }, [remaining]);

  const fetchCountDown = async () => {
    const res = await fetch("http://localhost:8080/api/discuss-timer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, productId }),
    });

    const json = await res.json();

    if (res.ok) {
      setRemaining(json.remaining as number);

      if (json.remaining <= 0) {
        router.push(
          `/${roomId}/${team}/result?members=${members}&productId=${productId}`
        );
      }
    }
  };

  const [cards, setCards] = useState<Cards | null>(null);
  useEffect(() => {
    fetchSpecialCardList();
  }, []);

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
  const showDescription = (desc: string) => {
    setHoverDescription(desc);
  };

  const hideDescription = () => {
    // 遅延フェードアウトさせる
    setHoverDescription(null);
  };

  if (!cards) {
    return <div>カードを読み込み中...</div>;
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen gap-8">
      <p>正解発表まで: {remaining}</p>
      <div className="relative">
        <p className="text-lg text-center pb-3">スペシャルカードを使用する</p>
        <div className="flex flex-row gap-5 items-center justify-center">
          {Object.entries(cards).map(([key, card]) => (
            <button
              key={key}
              onClick={() => useSpecialCard(key)}
              onMouseEnter={() => showDescription(card.description)}
              onMouseLeave={() => hideDescription()}
              style={{ marginRight: "10px" }}
              disabled={usedCard !== false}
              className="peer bg-green-300 rounded-xl p-1 text-xl text-gray-900 disabled:bg-green-50 disabled:text-gray-500 cursor-pointer"
            >
              {card.name}
            </button>
          ))}

          <div
            className={`absolute bottom-14 left-12 mt-5 p-3 bg-white border rounded shadow text-gray-600
                        transition-opacity duration-300 z-10 peer-hover:block hidden`}
          >
            <strong>説明:</strong> {hoverDescription}
          </div>
        </div>

        {usedCard === true && <p>スペシャルカード{usedCardName}を使用!</p>}
        {usedCard === "used" && <p>既にカードは使用されています。</p>}
      </div>
    </div>
  );
}
