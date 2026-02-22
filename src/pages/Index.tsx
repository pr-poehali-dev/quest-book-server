import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── Types & Data ─────────────────────────────────────────────────────────────

type QuestStatus = "completed" | "active" | "locked";
type Rarity = "common" | "rare" | "epic";

interface Quest {
  id: string;
  title: string;
  description: string;
  reward: string;
  xp: number;
  rarity: Rarity;
  status: QuestStatus;
  icon: string;
}

interface Branch {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  quests: Quest[];
}

const BRANCHES: Branch[] = [
  {
    id: "survival",
    title: "Выживание",
    icon: "Sword",
    color: "#c0392b",
    description: "Докажи, что способен выжить в суровом мире",
    quests: [
      { id: "s1", title: "Первая ночь", description: "Переживи первую ночь без укрытия", reward: "Кожаная броня", xp: 50, rarity: "common", status: "completed", icon: "Moon" },
      { id: "s2", title: "Охотник", description: "Убей 10 мобов с помощью лука", reward: "Лук Охотника", xp: 120, rarity: "common", status: "completed", icon: "Target" },
      { id: "s3", title: "Мастер меча", description: "Получи 1000 единиц урона в бою", reward: "Меч «Кровожад»", xp: 300, rarity: "rare", status: "active", icon: "Swords" },
      { id: "s4", title: "Легенда войны", description: "Выживи в 5 осадах подряд", reward: "Кираса Ветерана", xp: 800, rarity: "epic", status: "locked", icon: "Shield" },
    ],
  },
  {
    id: "exploration",
    title: "Исследование",
    icon: "Compass",
    color: "#2980b9",
    description: "Открой все уголки бесконечного мира",
    quests: [
      { id: "e1", title: "Первые шаги", description: "Пройди 500 блоков от спавна", reward: "Компас странника", xp: 40, rarity: "common", status: "completed", icon: "MapPin" },
      { id: "e2", title: "Картограф", description: "Исследуй 3 различных биома", reward: "Карта мира", xp: 150, rarity: "rare", status: "active", icon: "Map" },
      { id: "e3", title: "Мореплаватель", description: "Переплыви океан на корабле", reward: "Капитанская шляпа", xp: 250, rarity: "rare", status: "locked", icon: "Anchor" },
      { id: "e4", title: "Конец света", description: "Достигни края карты (10 000 блоков)", reward: "Звание «Первопроходец»", xp: 1000, rarity: "epic", status: "locked", icon: "Globe" },
    ],
  },
  {
    id: "crafting",
    title: "Крафт и наука",
    icon: "Hammer",
    color: "#8e44ad",
    description: "Создавай легендарные артефакты",
    quests: [
      { id: "c1", title: "Кузнец", description: "Скрафти железный инструмент", reward: "Молот кузнеца", xp: 60, rarity: "common", status: "completed", icon: "Wrench" },
      { id: "c2", title: "Алхимик", description: "Создай 5 зелий разных видов", reward: "Зелье силы II", xp: 180, rarity: "rare", status: "completed", icon: "FlaskConical" },
      { id: "c3", title: "Чародей", description: "Заачаруй оружие уровнем 30+", reward: "Кристалл чар", xp: 350, rarity: "epic", status: "active", icon: "Sparkles" },
      { id: "c4", title: "Творец богов", description: "Создай артефакт легендарного качества", reward: "Реликвия Эпохи", xp: 1200, rarity: "epic", status: "locked", icon: "Crown" },
    ],
  },
  {
    id: "social",
    title: "Сообщество",
    icon: "Users",
    color: "#27ae60",
    description: "Стань легендой среди игроков сервера",
    quests: [
      { id: "so1", title: "Новичок", description: "Войди на сервер первый раз", reward: "Тег «Новичок»", xp: 10, rarity: "common", status: "completed", icon: "UserPlus" },
      { id: "so2", title: "Торговец", description: "Совершни 10 сделок с игроками", reward: "Торговый сундук", xp: 100, rarity: "common", status: "active", icon: "ShoppingBag" },
      { id: "so3", title: "Гильдмастер", description: "Создай гильдию из 5+ игроков", reward: "Знамя гильдии", xp: 500, rarity: "rare", status: "locked", icon: "Flag" },
      { id: "so4", title: "Легенда сервера", description: "Получи 100 голосов от игроков", reward: "Легендарный статус", xp: 2000, rarity: "epic", status: "locked", icon: "Star" },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const RarityBadge = ({ rarity }: { rarity: Rarity }) => {
  const labels = { common: "Обычный", rare: "Редкий", epic: "Эпик" };
  return (
    <span className={`text-[10px] font-oswald tracking-widest uppercase px-2 py-0.5 rounded border badge-${rarity}`}>
      {labels[rarity]}
    </span>
  );
};

const StatusIcon = ({ status }: { status: QuestStatus }) => {
  if (status === "completed")
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "hsl(var(--quest-green))" }}>
        <Icon name="Check" size={11} color="white" />
      </div>
    );
  if (status === "active")
    return (
      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 animate-pulse"
        style={{ borderColor: "hsl(var(--quest-gold))" }}>
        <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--quest-gold))" }} />
      </div>
    );
  return (
    <div className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0"
      style={{ borderColor: "hsl(var(--border))" }}>
      <Icon name="Lock" size={10} color="hsl(var(--muted-foreground))" />
    </div>
  );
};

const XPBar = ({ total, earned }: { total: number; earned: number }) => {
  const pct = Math.round((earned / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] font-oswald tracking-wider text-muted-foreground uppercase">Прогресс</span>
        <span className="text-[11px] font-oswald" style={{ color: "hsl(var(--quest-gold))" }}>{earned} / {total} XP</span>
      </div>
      <div className="h-2 rounded-full w-full" style={{ background: "hsl(var(--muted))" }}>
        <div className="h-2 rounded-full progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const QuestCard = ({ quest, onClick }: { quest: Quest; onClick: (q: Quest) => void }) => (
  <div
    className={`quest-card parchment-bg rounded border p-3 animate-fade-in ${quest.status === "locked" ? "locked" : ""} ${quest.status === "completed" ? "completed" : ""}`}
    onClick={() => quest.status !== "locked" && onClick(quest)}
  >
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center"
        style={{
          background: quest.status === "completed" ? "hsl(var(--quest-green) / 0.2)"
            : quest.status === "active" ? "hsl(var(--quest-gold) / 0.15)"
            : "hsl(var(--muted))"
        }}>
        <Icon name={quest.icon} size={20} fallback="Star"
          color={quest.status === "completed" ? "hsl(var(--quest-green-bright))"
            : quest.status === "active" ? "hsl(var(--quest-gold))"
            : "hsl(var(--muted-foreground))"}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="font-cinzel text-sm font-semibold truncate"
            style={{ color: quest.status === "completed" ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))" }}>
            {quest.title}
          </span>
          <StatusIcon status={quest.status} />
        </div>
        <p className="text-xs font-crimson text-muted-foreground leading-tight mb-2">{quest.description}</p>
        <div className="flex items-center justify-between">
          <RarityBadge rarity={quest.rarity} />
          <span className="text-[11px] font-oswald tracking-wider" style={{ color: "hsl(var(--quest-gold))" }}>+{quest.xp} XP</span>
        </div>
      </div>
    </div>
  </div>
);

const QuestModal = ({ quest, onClose, onComplete }: { quest: Quest; onClose: () => void; onComplete: (id: string) => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="absolute inset-0" style={{ background: "hsl(var(--background) / 0.85)", backdropFilter: "blur(4px)" }} />
    <div
      className="relative w-full max-w-md parchment-bg rounded-lg border animate-scale-in p-6"
      style={{ borderColor: "hsl(var(--quest-gold) / 0.4)" }}
      onClick={e => e.stopPropagation()}
    >
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 border-2"
          style={{ background: "hsl(var(--quest-brown))", borderColor: "hsl(var(--quest-gold) / 0.5)" }}>
          <Icon name={quest.icon} size={26} color="hsl(var(--quest-gold))" fallback="Star" />
        </div>
        <h3 className="font-cinzel text-xl font-bold mb-2" style={{ color: "hsl(var(--quest-gold))" }}>{quest.title}</h3>
        <RarityBadge rarity={quest.rarity} />
      </div>

      <div className="ornament mb-4"><span>ЗАДАНИЕ</span></div>

      <p className="font-crimson text-base text-center mb-5 leading-relaxed">{quest.description}</p>

      <div className="parchment-bg rounded p-3 mb-5 border" style={{ borderColor: "hsl(var(--quest-gold) / 0.2)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Gift" size={14} color="hsl(var(--quest-gold))" />
          <span className="font-oswald text-xs tracking-widest uppercase text-muted-foreground">Награда</span>
        </div>
        <p className="font-crimson text-sm">{quest.reward}</p>
        <p className="font-oswald text-xs mt-1" style={{ color: "hsl(var(--quest-gold))" }}>+{quest.xp} XP</p>
      </div>

      <div className="flex gap-3">
        <button
          className="flex-1 py-2.5 rounded border font-oswald text-sm tracking-wider uppercase transition-colors hover:bg-secondary"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
          onClick={onClose}>
          Закрыть
        </button>
        {quest.status === "active" && (
          <button
            className="flex-1 py-2.5 rounded font-cinzel text-sm font-semibold tracking-wider uppercase transition-opacity hover:opacity-90 animate-glow"
            style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}
            onClick={() => onComplete(quest.id)}>
            ✓ Выполнено
          </button>
        )}
      </div>
    </div>
  </div>
);

const LoginScreen = ({ onLogin }: { onLogin: (nick: string) => void }) => {
  const [nick, setNick] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <img
              src="https://cdn.poehali.dev/projects/d5e86919-d370-406c-a721-817de003fa32/files/2aaf2152-2c19-4345-9b41-e69234d4b1e1.jpg"
              alt="Quest Book"
              className="w-28 h-28 object-cover rounded-lg border-2 mx-auto"
              style={{ borderColor: "hsl(var(--quest-gold) / 0.5)", boxShadow: "0 0 30px hsl(var(--quest-gold) / 0.2)" }}
            />
          </div>
          <h1 className="font-cinzel text-4xl font-black mb-2 gold-shimmer">Quest Book</h1>
          <p className="font-crimson text-lg italic text-muted-foreground">Книга приключений</p>
        </div>
        <div className="parchment-bg rounded-lg border p-6" style={{ borderColor: "hsl(var(--quest-gold) / 0.35)" }}>
          <div className="ornament mb-5"><span>ВХОД</span></div>
          <label className="block font-oswald text-xs tracking-widest uppercase text-muted-foreground mb-2">Ваш ник</label>
          <input
            type="text"
            placeholder="Steve..."
            value={nick}
            onChange={e => setNick(e.target.value)}
            onKeyDown={e => e.key === "Enter" && nick.trim() && onLogin(nick.trim())}
            className="w-full bg-transparent border rounded px-3 py-2.5 font-crimson text-base mb-5 outline-none transition-colors"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            autoFocus
          />
          <button
            disabled={!nick.trim()}
            onClick={() => nick.trim() && onLogin(nick.trim())}
            className="w-full py-3 rounded font-cinzel text-sm font-bold tracking-widest uppercase transition-opacity disabled:opacity-40 hover:opacity-90"
            style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}>
            Открыть книгу
          </button>
        </div>
        <p className="text-center font-crimson text-sm text-muted-foreground mt-4 italic">
          Введите ваш игровой ник для входа
        </p>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const [player, setPlayer] = useState<string | null>(null);
  const [activeBranch, setActiveBranch] = useState(BRANCHES[0].id);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [questStatuses, setQuestStatuses] = useState<Record<string, QuestStatus>>({});
  const [notification, setNotification] = useState<string | null>(null);

  const getStatus = (q: Quest): QuestStatus => questStatuses[q.id] ?? q.status;

  const handleComplete = (id: string) => {
    setQuestStatuses(prev => ({ ...prev, [id]: "completed" }));
    setSelectedQuest(null);
    const quest = BRANCHES.flatMap(b => b.quests).find(q => q.id === id);
    if (quest) {
      setNotification(`✓ «${quest.title}» выполнено! +${quest.xp} XP`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  if (!player) return <LoginScreen onLogin={setPlayer} />;

  const branch = BRANCHES.find(b => b.id === activeBranch)!;
  const allQuests = BRANCHES.flatMap(b => b.quests);
  const totalXP = allQuests.filter(q => getStatus(q) === "completed").reduce((s, q) => s + q.xp, 0);
  const maxXP = allQuests.reduce((s, q) => s + q.xp, 0);
  const completedCount = allQuests.filter(q => getStatus(q) === "completed").length;
  const branchQuests = branch.quests.map(q => ({ ...q, status: getStatus(q) }));

  return (
    <div className="min-h-screen">
      {/* Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right parchment-bg border rounded-lg px-4 py-3 flex items-center gap-3 shadow-2xl"
          style={{ borderColor: "hsl(var(--quest-green) / 0.6)", maxWidth: 320 }}>
          <Icon name="CheckCircle" size={18} color="hsl(var(--quest-green-bright))" />
          <span className="font-crimson text-sm">{notification}</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b sticky top-0 z-40"
        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background) / 0.95)", backdropFilter: "blur(8px)" }}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <h1 className="font-cinzel text-lg font-bold leading-none" style={{ color: "hsl(var(--quest-gold))" }}>Quest Book</h1>
              <p className="font-crimson text-xs italic text-muted-foreground">Книга приключений</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 parchment-bg border rounded px-3 py-1.5"
              style={{ borderColor: "hsl(var(--border))" }}>
              <Icon name="Trophy" size={14} color="hsl(var(--quest-gold))" />
              <span className="font-oswald text-xs tracking-wider" style={{ color: "hsl(var(--quest-gold))" }}>{totalXP} XP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-cinzel text-sm font-bold"
                style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}>
                {player[0].toUpperCase()}
              </div>
              <span className="hidden sm:block font-oswald text-sm tracking-wide">{player}</span>
            </div>
            <button className="p-1.5 rounded transition-colors hover:bg-secondary" onClick={() => setPlayer(null)} title="Выйти">
              <Icon name="LogOut" size={15} color="hsl(var(--muted-foreground))" />
            </button>
          </div>
        </div>
      </header>

      {/* Global XP progress */}
      <div className="border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1"><XPBar total={maxXP} earned={totalXP} /></div>
          <div className="text-right flex-shrink-0">
            <p className="font-oswald text-xs tracking-wider text-muted-foreground">{completedCount}/{allQuests.length}</p>
          </div>
        </div>
      </div>

      {/* Branch tabs */}
      <div className="border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {BRANCHES.map(b => {
              const bCompleted = b.quests.filter(q => getStatus(q) === "completed").length;
              const isActive = activeBranch === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setActiveBranch(b.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded border transition-all whitespace-nowrap font-oswald text-sm tracking-wide ${isActive ? "tab-active" : "border-transparent hover:bg-secondary"}`}>
                  <Icon name={b.icon} size={15} fallback="Star"
                    color={isActive ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))"} />
                  <span>{b.title}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded ml-1"
                    style={{
                      background: isActive ? "hsl(var(--quest-gold) / 0.2)" : "hsl(var(--muted))",
                      color: isActive ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))"
                    }}>
                    {bCompleted}/{b.quests.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Branch header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center"
              style={{ background: `${branch.color}22` }}>
              <Icon name={branch.icon} size={24} color={branch.color} fallback="Star" />
            </div>
            <div>
              <h2 className="font-cinzel text-2xl font-bold">{branch.title}</h2>
              <p className="font-crimson text-sm italic text-muted-foreground">{branch.description}</p>
            </div>
          </div>
          <div className="ornament"><span>ЦЕПОЧКА ЗАДАНИЙ</span></div>
        </div>

        {/* Quest chain */}
        <div className="grid gap-0">
          {branchQuests.map((quest, idx) => (
            <div key={quest.id} className="flex items-stretch gap-3">
              {/* Step col */}
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-cinzel text-xs font-bold z-10"
                  style={{
                    borderColor: quest.status === "completed" ? "hsl(var(--quest-green))"
                      : quest.status === "active" ? "hsl(var(--quest-gold))"
                      : "hsl(var(--border))",
                    color: quest.status === "completed" ? "hsl(var(--quest-green-bright))"
                      : quest.status === "active" ? "hsl(var(--quest-gold))"
                      : "hsl(var(--muted-foreground))",
                    background: "hsl(var(--background))",
                  }}>
                  {quest.status === "completed" ? <Icon name="Check" size={12} color="hsl(var(--quest-green-bright))" /> : idx + 1}
                </div>
                {idx < branchQuests.length - 1 && (
                  <div className="flex-1 w-px my-1"
                    style={{ background: quest.status === "completed" ? "hsl(var(--quest-green) / 0.4)" : "hsl(var(--border))" }} />
                )}
              </div>
              {/* Card col */}
              <div className="flex-1 pb-3">
                <QuestCard quest={quest} onClick={setSelectedQuest} />
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="ornament mb-4"><span>ЛЕГЕНДА</span></div>
          <div className="flex flex-wrap gap-6 justify-center">
            {[
              { label: "Выполнено", icon: "CheckCircle", color: "hsl(var(--quest-green-bright))" },
              { label: "Активно", icon: "Circle", color: "hsl(var(--quest-gold))" },
              { label: "Заблокировано", icon: "Lock", color: "hsl(var(--muted-foreground))" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <Icon name={item.icon} size={14} color={item.color} fallback="Circle" />
                <span className="font-oswald text-xs tracking-wide text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {selectedQuest && (
        <QuestModal quest={selectedQuest} onClose={() => setSelectedQuest(null)} onComplete={handleComplete} />
      )}
    </div>
  );
}