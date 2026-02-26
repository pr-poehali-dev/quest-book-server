import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Branch, Quest, Rarity } from "./types";


const RarityBadge = ({ rarity }: { rarity: Rarity }) => {
  const labels = { common: "Обычный", rare: "Редкий", epic: "Эпик" };
  const icons = { common: "Circle", rare: "Gem", epic: "Crown" };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-oswald tracking-widest uppercase px-2 py-0.5 rounded border badge-${rarity}`}>
      <Icon name={icons[rarity]} size={9} />
      {labels[rarity]}
    </span>
  );
};

const StatusDot = ({ status }: { status: "completed" | "active" | "locked" }) => {
  if (status === "completed")
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
        style={{ background: "hsl(var(--quest-green))", boxShadow: "0 0 8px hsl(var(--quest-green) / 0.4)" }}>
        <Icon name="Check" size={11} color="white" />
      </div>
    );
  if (status === "active")
    return (
      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 animate-glow"
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

const VerticalConnector = ({ status }: { status: "completed" | "active" | "locked" }) => (
  <div className="flex justify-center py-0.5">
    <div className="w-px h-5" style={{
      background: status === "completed"
        ? "linear-gradient(to bottom, hsl(var(--quest-green) / 0.5), hsl(var(--quest-green) / 0.15))"
        : status === "active"
          ? "linear-gradient(to bottom, hsl(var(--quest-gold) / 0.4), hsl(var(--quest-gold) / 0.1))"
          : "hsl(var(--border) / 0.5)"
    }} />
  </div>
);

const QuestCard = ({ quest, onClick, index }: { quest: Quest; onClick: (q: Quest) => void; index: number }) => {
  const status = quest.status ?? "locked";
  return (
    <div
      className={`quest-card parchment-bg rounded border p-3 animate-stagger-in ${status === "locked" ? "locked" : ""} ${status === "completed" ? "completed" : ""} ${status === "active" ? "quest-active" : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => { if (status !== "locked") onClick(quest); }}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded flex items-center justify-center transition-colors duration-300"
            style={{ background: status === "completed" ? "hsl(var(--quest-green) / 0.2)" : status === "active" ? "hsl(var(--quest-gold) / 0.15)" : "hsl(var(--muted))" }}>
            <Icon name={quest.icon} size={20} fallback="Star"
              color={status === "completed" ? "hsl(var(--quest-green-bright))" : status === "active" ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))"}
            />
          </div>
          <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center font-oswald text-[9px] font-bold"
            style={{
              background: status === "completed" ? "hsl(var(--quest-green))" : status === "active" ? "hsl(var(--quest-gold))" : "hsl(var(--muted))",
              color: status === "locked" ? "hsl(var(--muted-foreground))" : "hsl(var(--background))",
              border: `1.5px solid hsl(var(--background))`
            }}>
            {index + 1}
          </span>
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
          <div className="flex items-center gap-2">
            <RarityBadge rarity={quest.rarity} />
            {quest.reward && status !== "locked" && (
              <span className="text-[10px] font-crimson italic text-muted-foreground/60 truncate">
                <Icon name="Gift" size={9} className="inline mr-0.5" />{quest.reward}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuestModal = ({ quest, onClose }: { quest: Quest; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "hsl(var(--background) / 0.85)", backdropFilter: "blur(6px)" }} />
      <div className="relative w-full max-w-md parchment-bg rounded-lg border corner-decor animate-scale-in p-6"
        style={{ borderColor: "hsl(var(--quest-gold) / 0.4)", boxShadow: "0 0 60px hsl(var(--quest-gold) / 0.1), 0 25px 50px hsl(0 0% 0% / 0.5)" }}
        onClick={e => e.stopPropagation()}>

        <div className="text-center mb-4">
          <div className="relative inline-block">
            <div className="absolute -inset-2 rounded-full animate-breathe"
              style={{ background: "radial-gradient(circle, hsl(var(--quest-gold) / 0.15) 0%, transparent 70%)" }} />
            <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 border-2"
              style={{ background: "hsl(var(--quest-brown))", borderColor: "hsl(var(--quest-gold) / 0.5)" }}>
              <Icon name={quest.icon} size={26} color="hsl(var(--quest-gold))" fallback="Star" />
            </div>
          </div>
          <h3 className="font-cinzel text-xl font-bold mb-2 text-glow" style={{ color: "hsl(var(--quest-gold))" }}>{quest.title}</h3>
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
        </div>

        {quest.status === "completed" && (
          <div className="rounded p-3 mb-4 text-center border" style={{ borderColor: "hsl(var(--quest-green) / 0.4)", background: "hsl(var(--quest-green) / 0.1)" }}>
            <p className="font-cinzel text-sm font-semibold flex items-center justify-center gap-2" style={{ color: "hsl(var(--quest-green-bright))" }}>
              <Icon name="CheckCircle" size={16} color="hsl(var(--quest-green-bright))" />
              Квест выполнен
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

        <div className="diamond-divider mb-4"><div className="diamond" /></div>

        <div className="flex">
          <button className="flex-1 py-2.5 rounded border font-oswald text-sm tracking-wider uppercase transition-all duration-200 hover:bg-secondary"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

const BranchQuestCount = ({ total }: { total: number }) => {
  const label = total === 1 ? "задание" : total < 5 ? "задания" : "заданий";
  return (
    <span className="font-crimson text-xs italic text-muted-foreground/70">
      {total} {label}
    </span>
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
    if (q.unlocked) return "active";
    if (idx === 0) return "active";
    const prev = allQuests[idx - 1];
    if (completedIds.includes(prev.id)) return "active";
    return "locked";
  };

  const activeBranch = branches.find(b => b.id === activeBranchId);

  const branchQuestsWithStatus: Quest[] = (activeBranch?.quests ?? []).map((q, idx, arr) => ({
    ...q,
    status: getQuestStatus(q, idx, arr),
  }));

  const activeSelectedQuest = selectedQuest
    ? branchQuestsWithStatus.find(q => q.id === selectedQuest.id) ?? selectedQuest
    : null;

  const totalCompleted = completedIds.length;
  const totalQuests = branches.reduce((s, b) => s + (b.quests?.length ?? 0), 0);

  return (
    <div className="min-h-screen">
      <header className="border-b sticky top-0 z-40"
        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background) / 0.95)", backdropFilter: "blur(12px)" }}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded flex items-center justify-center"
              style={{ background: "hsl(var(--quest-brown))", border: "1px solid hsl(var(--quest-gold) / 0.3)" }}>
              <Icon name="BookOpen" size={18} color="hsl(var(--quest-gold))" />
            </div>
            <div>
              <h1 className="font-cinzel text-lg font-bold leading-none text-glow" style={{ color: "hsl(var(--quest-gold))" }}>Quest Book RPM</h1>
              <p className="font-crimson text-xs italic text-muted-foreground">Книга Мэрии RPM</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded" style={{ background: "hsl(var(--muted))" }}>
              <Icon name="Scroll" size={12} color="hsl(var(--quest-gold) / 0.7)" />
              <span className="font-oswald text-[10px] tracking-wider text-muted-foreground">{totalCompleted}/{totalQuests}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-cinzel text-sm font-bold"
                style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))", boxShadow: "0 0 12px hsl(var(--quest-gold) / 0.25)" }}>
                {player[0].toUpperCase()}
              </div>
              <span className="hidden sm:block font-oswald text-sm tracking-wide">{player}</span>
            </div>
            <button className="p-1.5 rounded hover:bg-secondary transition-colors duration-200" onClick={onLogout} title="Выйти">
              <Icon name="LogOut" size={15} color="hsl(var(--muted-foreground))" />
            </button>
          </div>
        </div>
      </header>

      <div className="border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto scroll-fade-right">
            {branches.map(b => {
              const bCompleted = (b.quests ?? []).filter(q => completedIds.includes(q.id)).length;
              const bTotal = (b.quests ?? []).length;
              const isActive = b.id === activeBranchId;
              const allDone = bCompleted === bTotal && bTotal > 0;
              return (
                <button
                  key={b.id}
                  onClick={() => setActiveBranchId(b.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded border text-left flex-shrink-0 transition-all duration-200 ${isActive ? "tab-active" : "hover:bg-secondary/50"}`}
                  style={{ borderColor: isActive ? undefined : "hsl(var(--border))" }}
                >
                  <Icon name={b.icon} size={15} fallback="Star" color={isActive ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))"} />
                  <span className="font-oswald text-xs tracking-wider leading-tight">{b.title}</span>
                  {allDone && (
                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                      style={{ background: "hsl(var(--quest-green))" }}>
                      <Icon name="Check" size={8} color="white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-2xl animate-page-turn">
        {activeBranch && (
          <>
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded flex items-center justify-center"
                  style={{ background: activeBranch.color + "22", border: `1px solid ${activeBranch.color}44` }}>
                  <Icon name={activeBranch.icon} size={16} color={activeBranch.color} fallback="Star" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <h2 className="font-cinzel text-lg font-bold" style={{ color: activeBranch.color }}>{activeBranch.title}</h2>
                    <BranchQuestCount total={(activeBranch.quests ?? []).length} />
                  </div>
                  {activeBranch.description && (
                    <p className="font-crimson text-sm italic text-muted-foreground">{activeBranch.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="diamond-divider mb-5"><div className="diamond" /></div>

            <div className="space-y-0">
              {branchQuestsWithStatus.map((q, i) => (
                <div key={q.id}>
                  {i > 0 && <VerticalConnector status={q.status ?? "locked"} />}
                  <QuestCard quest={q} onClick={setSelectedQuest} index={i} />
                </div>
              ))}
            </div>

            {branchQuestsWithStatus.length > 0 && (
              <div className="mt-6 flex items-center justify-center gap-3 opacity-30">
                <div className="h-px w-12" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--quest-gold) / 0.5))" }} />
                <Icon name="Feather" size={12} color="hsl(var(--quest-gold))" />
                <div className="h-px w-12" style={{ background: "linear-gradient(90deg, hsl(var(--quest-gold) / 0.5), transparent)" }} />
              </div>
            )}

            {branchQuestsWithStatus.length === 0 && (
              <div className="text-center py-12 parchment-bg rounded-lg border" style={{ borderColor: "hsl(var(--border))" }}>
                <Icon name="BookOpen" size={32} color="hsl(var(--muted-foreground))" />
                <p className="font-crimson text-sm text-muted-foreground mt-3 italic">Квесты в этой ветке ещё не добавлены</p>
              </div>
            )}
          </>
        )}
      </main>

      {activeSelectedQuest && <QuestModal quest={activeSelectedQuest} onClose={() => setSelectedQuest(null)} />}
    </div>
  );
}