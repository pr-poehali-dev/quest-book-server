import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Branch, Quest, Rarity } from "./types";

const RarityBadge = ({ rarity }: { rarity: Rarity }) => {
  const labels = { common: "Обычный", rare: "Редкий", epic: "Эпик" };
  return (
    <span className={`text-[10px] font-oswald tracking-widest uppercase px-2 py-0.5 rounded border badge-${rarity}`}>
      {labels[rarity]}
    </span>
  );
};

const StatusDot = ({ status }: { status: "completed" | "active" | "locked" }) => {
  if (status === "completed")
    return <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--quest-green))" }}><Icon name="Check" size={11} color="white" /></div>;
  if (status === "active")
    return <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 animate-pulse" style={{ borderColor: "hsl(var(--quest-gold))" }}><div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--quest-gold))" }} /></div>;
  return <div className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0" style={{ borderColor: "hsl(var(--border))" }}><Icon name="Lock" size={10} color="hsl(var(--muted-foreground))" /></div>;
};

const XPBar = ({ total, earned }: { total: number; earned: number }) => {
  const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1.5">
        <span className="text-[11px] font-oswald tracking-wider text-muted-foreground uppercase">Прогресс</span>
        <span className="text-[11px] font-oswald" style={{ color: "hsl(var(--quest-gold))" }}>{earned} / {total} XP</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "hsl(var(--muted))" }}>
        <div className="h-2 rounded-full progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const QuestCard = ({ quest, onClick }: { quest: Quest; onClick: (q: Quest) => void }) => {
  const status = quest.status ?? "locked";
  return (
    <div
      className={`quest-card parchment-bg rounded border p-3 animate-fade-in ${status === "locked" ? "locked" : ""} ${status === "completed" ? "completed" : ""}`}
      onClick={() => status !== "locked" && onClick(quest)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center"
          style={{ background: status === "completed" ? "hsl(var(--quest-green) / 0.2)" : status === "active" ? "hsl(var(--quest-gold) / 0.15)" : "hsl(var(--muted))" }}>
          <Icon name={quest.icon} size={20} fallback="Star"
            color={status === "completed" ? "hsl(var(--quest-green-bright))" : status === "active" ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))"}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="font-cinzel text-sm font-semibold truncate"
              style={{ color: status === "completed" ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))" }}>
              {quest.title}
            </span>
            <StatusDot status={status} />
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
};

const QuestModal = ({ quest, onClose }: {
  quest: Quest;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "hsl(var(--background) / 0.85)", backdropFilter: "blur(4px)" }} />
      <div className="relative w-full max-w-md parchment-bg rounded-lg border animate-scale-in p-6"
        style={{ borderColor: "hsl(var(--quest-gold) / 0.4)" }} onClick={e => e.stopPropagation()}>
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
        <div className="parchment-bg rounded p-3 mb-4 border" style={{ borderColor: "hsl(var(--quest-gold) / 0.2)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Gift" size={14} color="hsl(var(--quest-gold))" />
            <span className="font-oswald text-xs tracking-widest uppercase text-muted-foreground">Награда</span>
          </div>
          <p className="font-crimson text-sm">{quest.reward}</p>
          <p className="font-oswald text-xs mt-1" style={{ color: "hsl(var(--quest-gold))" }}>+{quest.xp} XP</p>
        </div>

        {quest.status === "completed" && (
          <div className="rounded p-3 mb-4 text-center border" style={{ borderColor: "hsl(var(--quest-green) / 0.4)", background: "hsl(var(--quest-green) / 0.1)" }}>
            <p className="font-cinzel text-sm font-semibold" style={{ color: "hsl(var(--quest-green-bright))" }}>
              <Icon name="CheckCircle" size={16} color="hsl(var(--quest-green-bright))" />
              <span className="ml-2">Квест выполнен</span>
            </p>
          </div>
        )}

        {quest.status === "active" && (
          <div className="rounded p-3 mb-4 text-center border" style={{ borderColor: "hsl(var(--quest-gold) / 0.3)", background: "hsl(var(--quest-gold) / 0.08)" }}>
            <p className="font-crimson text-sm" style={{ color: "hsl(var(--quest-gold))" }}>
              Ожидайте — администратор откроет этот квест когда вы его выполните
            </p>
          </div>
        )}

        <div className="flex">
          <button className="flex-1 py-2.5 rounded border font-oswald text-sm tracking-wider uppercase transition-colors hover:bg-secondary"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

interface QuestBookProps {
  player: string;
  branches: Branch[];
  completedIds: number[];
  onLogout: () => void;
}

export default function QuestBook({ player, branches, completedIds, onLogout }: QuestBookProps) {
  const [activeBranchId, setActiveBranchId] = useState<number | null>(branches[0]?.id ?? null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  const getQuestStatus = (q: Quest, idx: number, allQuests: Quest[]): "completed" | "active" | "locked" => {
    if (completedIds.includes(q.id)) return "completed";
    if (idx === 0) return "active";
    const prev = allQuests[idx - 1];
    if (completedIds.includes(prev.id)) return "active";
    return "locked";
  };

  const activeBranch = branches.find(b => b.id === activeBranchId);
  const allQuests = branches.flatMap(b => b.quests ?? []);
  const totalXP = allQuests.filter(q => completedIds.includes(q.id)).reduce((s, q) => s + q.xp, 0);
  const maxXP = allQuests.reduce((s, q) => s + q.xp, 0);
  const completedCount = allQuests.filter(q => completedIds.includes(q.id)).length;

  const branchQuestsWithStatus: Quest[] = (activeBranch?.quests ?? []).map((q, idx, arr) => ({
    ...q,
    status: getQuestStatus(q, idx, arr),
  }));

  const activeSelectedQuest = selectedQuest
    ? branchQuestsWithStatus.find(q => q.id === selectedQuest.id) ?? selectedQuest
    : null;

  return (
    <div className="min-h-screen">
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
            <div className="hidden sm:flex items-center gap-2 parchment-bg border rounded px-3 py-1.5">
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
            <button className="p-1.5 rounded hover:bg-secondary" onClick={onLogout} title="Выйти">
              <Icon name="LogOut" size={15} color="hsl(var(--muted-foreground))" />
            </button>
          </div>
        </div>
      </header>

      <div className="border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1"><XPBar total={maxXP} earned={totalXP} /></div>
          <div className="flex-shrink-0">
            <p className="font-oswald text-xs tracking-wider text-muted-foreground">{completedCount}/{allQuests.length}</p>
          </div>
        </div>
      </div>

      <div className="border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {branches.map(b => {
              const bCompleted = (b.quests ?? []).filter(q => completedIds.includes(q.id)).length;
              const isActive = activeBranchId === b.id;
              return (
                <button key={b.id} onClick={() => setActiveBranchId(b.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded border transition-all whitespace-nowrap font-oswald text-sm tracking-wide ${isActive ? "tab-active" : "border-transparent hover:bg-secondary"}`}>
                  <Icon name={b.icon} size={15} fallback="Star" color={isActive ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))"} />
                  <span>{b.title}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded ml-1"
                    style={{ background: isActive ? "hsl(var(--quest-gold) / 0.2)" : "hsl(var(--muted))", color: isActive ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))" }}>
                    {bCompleted}/{(b.quests ?? []).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {activeBranch && (
          <>
            <div className="mb-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: `${activeBranch.color}22` }}>
                  <Icon name={activeBranch.icon} size={24} color={activeBranch.color} fallback="Star" />
                </div>
                <div>
                  <h2 className="font-cinzel text-2xl font-bold">{activeBranch.title}</h2>
                  <p className="font-crimson text-sm italic text-muted-foreground">{activeBranch.description}</p>
                </div>
              </div>
              <div className="ornament"><span>ЦЕПОЧКА ЗАДАНИЙ</span></div>
            </div>

            <div className="grid gap-0">
              {branchQuestsWithStatus.map((quest, idx) => (
                <div key={quest.id} className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center flex-shrink-0 pt-1">
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-cinzel text-xs font-bold z-10"
                      style={{
                        borderColor: quest.status === "completed" ? "hsl(var(--quest-green))" : quest.status === "active" ? "hsl(var(--quest-gold))" : "hsl(var(--border))",
                        color: quest.status === "completed" ? "hsl(var(--quest-green-bright))" : quest.status === "active" ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))",
                        background: "hsl(var(--background))",
                      }}>
                      {quest.status === "completed" ? <Icon name="Check" size={12} color="hsl(var(--quest-green-bright))" /> : idx + 1}
                    </div>
                    {idx < branchQuestsWithStatus.length - 1 && (
                      <div className="flex-1 w-px my-1"
                        style={{ background: quest.status === "completed" ? "hsl(var(--quest-green) / 0.4)" : "hsl(var(--border))" }} />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <QuestCard quest={quest} onClick={setSelectedQuest} />
                  </div>
                </div>
              ))}
              {(activeBranch.quests ?? []).length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="font-crimson text-lg italic">В этой ветке пока нет квестов</p>
                </div>
              )}
            </div>

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
          </>
        )}

        {branches.length === 0 && (
          <div className="text-center py-20">
            <p className="font-cinzel text-xl" style={{ color: "hsl(var(--quest-gold))" }}>Книга пуста</p>
            <p className="font-crimson text-muted-foreground mt-2 italic">Войдите как администратор, чтобы создать первые квесты</p>
          </div>
        )}
      </main>

      {activeSelectedQuest && (
        <QuestModal quest={activeSelectedQuest} onClose={() => setSelectedQuest(null)} />
      )}
    </div>
  );
}
