import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Branch, Quest, Rarity } from "./types";

const FloatingEmbers = () => (
  <div className="embers-container">
    <div className="ember" />
    <div className="ember" />
    <div className="ember" />
    <div className="ember" />
    <div className="ember" />
    <div className="ember" />
    <div className="ember" />
    <div className="ember" />
  </div>
);

const RarityBadge = ({ rarity }: { rarity: Rarity }) => {
  const labels = { common: "Обычный", rare: "Редкий", epic: "Легендарный" };
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
      <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
        <div className="status-active-ring" />
        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center animate-glow"
          style={{ borderColor: "hsl(var(--quest-gold))" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--quest-gold))" }} />
        </div>
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
  <div className={`flex justify-center py-0.5 ${status === "active" ? "connector-active" : ""}`}>
    <div className="w-px h-6" style={{
      background: status === "completed"
        ? "linear-gradient(to bottom, hsl(var(--quest-green) / 0.6), hsl(var(--quest-green) / 0.15))"
        : status === "active"
          ? "linear-gradient(to bottom, hsl(var(--quest-gold) / 0.5), hsl(var(--quest-gold) / 0.1))"
          : "hsl(var(--border) / 0.3)"
    }} />
  </div>
);

const QuestCard = ({ quest, onClick, index }: { quest: Quest; onClick: (q: Quest) => void; index: number }) => {
  const status = quest.status ?? "locked";
  const rarityClass = quest.rarity !== "common" && status !== "locked" ? `rarity-${quest.rarity}` : "";
  return (
    <div
      className={`quest-card parchment-bg paper-texture rounded-md border p-3 animate-stagger-in ${status === "locked" ? "locked" : ""} ${status === "completed" ? "completed" : ""} ${status === "active" ? "quest-active" : ""} ${rarityClass}`}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={() => { if (status !== "locked") onClick(quest); }}
    >
      {status === "completed" && (
        <>
          <div className="quest-sparkle sparkle-1" />
          <div className="quest-sparkle sparkle-2" />
          <div className="quest-sparkle sparkle-3" />
        </>
      )}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-md flex items-center justify-center transition-all duration-300"
            style={{
              background: status === "completed" ? "hsl(var(--quest-green) / 0.2)" : status === "active" ? "hsl(var(--quest-gold) / 0.15)" : "hsl(var(--muted))",
              boxShadow: status === "active" ? "0 0 12px hsl(var(--quest-gold) / 0.15)" : status === "completed" ? "0 0 8px hsl(var(--quest-green) / 0.15)" : "none"
            }}>
            <Icon name={quest.icon} size={20} fallback="Star"
              color={status === "completed" ? "hsl(var(--quest-green-bright))" : status === "active" ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))"}
            />
          </div>
          <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center font-oswald text-[9px] font-bold transition-all duration-300"
            style={{
              background: status === "completed" ? "hsl(var(--quest-green))" : status === "active" ? "hsl(var(--quest-gold))" : "hsl(var(--muted))",
              color: status === "locked" ? "hsl(var(--muted-foreground))" : "hsl(var(--background))",
              border: `1.5px solid hsl(var(--background))`,
              boxShadow: status === "active" ? "0 0 8px hsl(var(--quest-gold) / 0.4)" : "none"
            }}>
            {index + 1}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={`font-cinzel text-sm font-semibold truncate ${status === "completed" ? "quest-title-text" : ""}`}
              style={{ color: status === "completed" ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))" }}>
              {quest.title}
            </span>
            <StatusDot status={status} />
          </div>
          <p className="text-xs font-crimson text-muted-foreground leading-snug mb-2">{quest.description}</p>
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
  const rarityColors = { common: "var(--quest-gold)", rare: "210 75% 68%", epic: "275 65% 72%" };
  const glowColor = rarityColors[quest.rarity];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-modal-backdrop" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "hsl(var(--background) / 0.88)", backdropFilter: "blur(8px)" }} />
      <div className="relative w-full max-w-md parchment-bg paper-texture rounded-lg border corner-decor animate-modal-reveal modal-particles p-6 overflow-hidden"
        style={{
          borderColor: `hsl(${glowColor} / 0.4)`,
          boxShadow: `0 0 80px hsl(${glowColor} / 0.12), 0 0 40px hsl(${glowColor} / 0.06), 0 25px 50px hsl(0 0% 0% / 0.5)`
        }}
        onClick={e => e.stopPropagation()}>

        <div className="text-center mb-4 relative">
          <div className="relative inline-block">
            <div className="absolute -inset-4 rounded-full animate-breathe"
              style={{ background: `radial-gradient(circle, hsl(${glowColor} / 0.2) 0%, transparent 70%)` }} />
            <div className="absolute -inset-8 rounded-full"
              style={{ background: `radial-gradient(circle, hsl(${glowColor} / 0.06) 0%, transparent 70%)`, animation: "breathe 4s ease-in-out infinite 1s" }} />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 border-2 transition-all"
              style={{
                background: "hsl(var(--quest-brown))",
                borderColor: `hsl(${glowColor} / 0.5)`,
                boxShadow: `0 0 20px hsl(${glowColor} / 0.2), inset 0 0 15px hsl(${glowColor} / 0.05)`
              }}>
              <Icon name={quest.icon} size={28} color={`hsl(${glowColor})`} fallback="Star" />
            </div>
          </div>
          <h3 className="font-cinzel text-xl font-bold mb-2 text-glow" style={{ color: `hsl(${glowColor})` }}>{quest.title}</h3>
          <RarityBadge rarity={quest.rarity} />
        </div>

        <div className="ornament mb-4"><span>ГЛАВА</span></div>

        <p className="font-crimson text-base text-center mb-5 leading-relaxed">{quest.description}</p>

        <div className="parchment-bg rounded-md p-3 mb-4 border relative overflow-hidden" style={{ borderColor: "hsl(var(--quest-gold) / 0.25)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Gift" size={14} color="hsl(var(--quest-gold))" />
            <span className="font-oswald text-xs tracking-widest uppercase text-muted-foreground">Награда</span>
          </div>
          <p className="font-crimson text-sm">{quest.reward}</p>
        </div>

        {quest.status === "completed" && (
          <div className="rounded-md p-3 mb-4 text-center border animate-fade-in" style={{ borderColor: "hsl(var(--quest-green) / 0.5)", background: "hsl(var(--quest-green) / 0.12)" }}>
            <p className="font-cinzel text-sm font-semibold flex items-center justify-center gap-2" style={{ color: "hsl(var(--quest-green-bright))" }}>
              <Icon name="CheckCircle" size={16} color="hsl(var(--quest-green-bright))" />
              Глава завершена
            </p>
          </div>
        )}

        {quest.status === "active" && (
          <div className="rounded-md p-3 mb-4 text-center border animate-fade-in" style={{ borderColor: "hsl(var(--quest-gold) / 0.4)", background: "hsl(var(--quest-gold) / 0.1)" }}>
            <p className="font-crimson text-sm" style={{ color: "hsl(var(--quest-gold))" }}>
              Ожидайте — хранитель книги откроет эту главу, когда вы её пройдёте
            </p>
          </div>
        )}

        <div className="diamond-divider mb-4"><div className="diamond" /></div>

        <div className="flex">
          <button className="btn-book flex-1 py-2.5 rounded-md font-cinzel text-sm font-semibold tracking-wider transition-all duration-200" onClick={onClose}>
            Закрыть книгу
          </button>
        </div>
      </div>
    </div>
  );
};

const BranchQuestCount = ({ total }: { total: number }) => {
  const label = total === 1 ? "глава" : total < 5 ? "главы" : "глав";
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
  const progressPercent = totalQuests > 0 ? Math.round((totalCompleted / totalQuests) * 100) : 0;

  return (
    <div className="min-h-screen quest-ambient vignette-warm">
      <FloatingEmbers />

      <header className="border-b sticky top-0 z-40 header-glow-line"
        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background) / 0.95)", backdropFilter: "blur(12px)" }}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center relative border"
              style={{ background: "hsl(var(--quest-brown))", borderColor: "hsl(var(--quest-gold) / 0.35)", boxShadow: "0 0 12px hsl(var(--quest-gold) / 0.1)" }}>
              <Icon name="BookMarked" size={19} color="hsl(var(--quest-gold))" />
            </div>
            <div>
              <h1 className="font-cinzel text-lg font-bold leading-none gold-shimmer">Quest Book RPM</h1>
              <p className="font-crimson text-xs italic text-muted-foreground">Книга квестов RPM</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md relative overflow-hidden border" style={{ background: "hsl(var(--muted))", borderColor: "hsl(var(--border))" }}>
              <Icon name="Scroll" size={12} color="hsl(var(--quest-gold) / 0.7)" />
              <span className="font-oswald text-[10px] tracking-wider text-muted-foreground">{totalCompleted}/{totalQuests}</span>
              <div className="absolute bottom-0 left-0 h-0.5 progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="flex items-center gap-2">
              <div className="wax-seal w-8 h-8 rounded-full flex items-center justify-center font-cinzel text-sm font-bold" style={{ color: "hsl(var(--primary-foreground))" }}>
                {player[0].toUpperCase()}
              </div>
              <span className="hidden sm:block font-cinzel text-sm font-semibold tracking-wide">{player}</span>
            </div>
            <button className="p-1.5 rounded-md hover:bg-secondary transition-colors duration-200" onClick={onLogout} title="Выйти">
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
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-md border text-left flex-shrink-0 transition-all duration-200 ${isActive ? "tab-active" : "hover:bg-secondary/50"}`}
                  style={{ borderColor: isActive ? undefined : "hsl(var(--border))" }}
                >
                  <Icon name={b.icon} size={15} fallback="Star" color={isActive ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))"} />
                  <span className="font-cinzel text-xs font-semibold tracking-wide leading-tight">{b.title}</span>
                  {allDone && (
                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                      style={{ background: "hsl(var(--quest-green))", boxShadow: "0 0 6px hsl(var(--quest-green) / 0.4)" }}>
                      <Icon name="Check" size={8} color="white" />
                    </div>
                  )}
                  {isActive && !allDone && bTotal > 0 && (
                    <span className="text-[9px] font-oswald tracking-wide" style={{ color: "hsl(var(--quest-gold) / 0.6)" }}>
                      {bCompleted}/{bTotal}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-2xl animate-page-turn relative z-10">
        {activeBranch && (
          <>
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-md flex items-center justify-center transition-all duration-300 border"
                  style={{
                    background: activeBranch.color + "22",
                    borderColor: activeBranch.color + "55",
                    boxShadow: `0 0 15px ${activeBranch.color}15, inset 0 1px 0 ${activeBranch.color}30`
                  }}>
                  <Icon name={activeBranch.icon} size={18} color={activeBranch.color} fallback="Star" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <h2 className="font-cinzel text-lg font-bold" style={{ color: activeBranch.color, textShadow: `0 0 20px ${activeBranch.color}30` }}>{activeBranch.title}</h2>
                    <BranchQuestCount total={(activeBranch.quests ?? []).length} />
                  </div>
                  {activeBranch.description && (
                    <p className="font-crimson text-sm italic text-muted-foreground">{activeBranch.description}</p>
                  )}
                </div>
              </div>

              {(activeBranch.quests ?? []).length > 0 && (() => {
                const done = (activeBranch.quests ?? []).filter(q => completedIds.includes(q.id)).length;
                const total = (activeBranch.quests ?? []).length;
                const pct = Math.round((done / total) * 100);
                return (
                  <div className="mt-3">
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                      <div className="h-full rounded-full progress-bar-fill transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flourish-divider mb-5">
              <Icon name="Sparkles" size={14} color="hsl(var(--quest-gold) / 0.6)" />
            </div>

            <div className="space-y-0">
              {branchQuestsWithStatus.map((q, i) => (
                <div key={q.id}>
                  {i > 0 && <VerticalConnector status={q.status ?? "locked"} />}
                  <QuestCard quest={q} onClick={setSelectedQuest} index={i} />
                </div>
              ))}
            </div>

            {branchQuestsWithStatus.length > 0 && (
              <div className="mt-6 flex items-center justify-center gap-3 opacity-40">
                <div className="h-px w-16" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--quest-gold) / 0.5))" }} />
                <Icon name="Feather" size={13} color="hsl(var(--quest-gold))" className="star-glow" />
                <div className="h-px w-16" style={{ background: "linear-gradient(90deg, hsl(var(--quest-gold) / 0.5), transparent)" }} />
              </div>
            )}

            {branchQuestsWithStatus.length === 0 && (
              <div className="text-center py-12 parchment-bg paper-texture rounded-lg border" style={{ borderColor: "hsl(var(--border))" }}>
                <Icon name="BookOpen" size={32} color="hsl(var(--muted-foreground))" />
                <p className="font-crimson text-sm text-muted-foreground mt-3 italic">В этой главе ещё не написано ни строчки</p>
              </div>
            )}
          </>
        )}
      </main>

      {activeSelectedQuest && <QuestModal quest={activeSelectedQuest} onClose={() => setSelectedQuest(null)} />}
    </div>
  );
}