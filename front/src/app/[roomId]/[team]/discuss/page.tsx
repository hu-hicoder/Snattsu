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
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <div className="text-center mb-2 animate-float">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">ディスカッションタイム</h1>
        <p className="text-[var(--foreground)] opacity-80">チーム「{decodeURIComponent(team)}」の作戦会議</p>
      </div>
      
      <div className="card-candy w-full max-w-md">
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-[var(--secondary)] flex items-center justify-center border-4 border-[var(--accent)] shadow-lg">
            <span className="text-3xl font-bold text-[var(--foreground)]">{remaining}</span>
          </div>
          
          <p className="text-center text-[var(--foreground)] font-medium">
            正解発表までの残り時間
          </p>
          
          <div className="w-full border-t border-[var(--card-border)] my-2"></div>
          
          <div className="w-full">
            <p className="text-lg text-center font-bold text-[var(--foreground)] mb-4">スペシャルカード</p>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              {Object.entries(cards).map(([key, card]) => (
                <button
                  key={key}
                  onClick={() => useSpecialCard(key)}
                  onMouseEnter={() => showDescription(card.description)}
                  onMouseLeave={() => hideDescription()}
                  disabled={usedCard !== false}
                  className="relative group"
                >
                  <div className={`
                    p-3 rounded-2xl text-center transition-all duration-300 transform
                    ${usedCard !== false ? 'bg-gray-200 text-gray-400' : 'bg-gradient-to-br from-[var(--accent)] to-[var(--primary)] text-white shadow-md hover:shadow-lg hover:-translate-y-1'}
                  `}>
                    <div className="font-bold text-lg mb-1">{card.name}</div>
                    <div className="text-xs opacity-80">タップして使用</div>
                  </div>
                  
                  <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-0 right-0 mb-2 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-[var(--foreground)] text-sm transition-opacity duration-200 z-10">
                    <div className="font-bold mb-1">{card.name}</div>
                    <div>{card.description}</div>
                    <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45 bg-white dark:bg-gray-800"></div>
                  </div>
                </button>
              ))}
            </div>
            
            {usedCard === true && (
              <div className="mt-4 p-3 bg-[var(--success)] bg-opacity-20 rounded-xl text-center text-[var(--foreground)] animate-pulse">
                <span className="font-bold">スペシャルカード「{usedCardName}」</span>を使用しました！
              </div>
            )}
            
            {usedCard === "used" && (
              <div className="mt-4 p-3 bg-red-100 rounded-xl text-center text-red-600">
                既にカードは使用されています
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-center text-sm text-[var(--foreground)] opacity-60 mt-4">
        チームで相談して、スペシャルカードを使うか決めましょう
      </div>
    </div>
  );
}
