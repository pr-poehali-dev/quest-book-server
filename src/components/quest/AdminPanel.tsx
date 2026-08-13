import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Branch, Quest, apiFetch } from "./types";
import AdminQuestsTab from "./AdminQuestsTab";

type AdminTab = "quests" | "players";

interface PlayerEntry {
  nick: string;
  completed: number;
  total_xp: number;
  last_active?: string;
}

interface PlayerProgress {
  id: number;
  quest_id: number;
  status: string;
  completed_at: string;
  quest_title: string;
  xp: number;
  rarity: string;
  icon: string;
  branch_title: string;
}

interface AdminPanelProps {
  branches: Branch[];
  adminKey: string;
  onRefresh: () => void;
  onClose: () => void;
}

export default function AdminPanel({ branches, adminKey, onRefresh, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("quests");

  const [activeBranch, setActiveBranch] = useState<Branch | null>(branches[0] ?? null);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Quest>>({});
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({});

  const [players, setPlayers] = useState<PlayerEntry[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);

  const loadPlayers = useCallback(async () => {
    setPlayersLoading(true);
    const data = await apiFetch("/players", { method: "GET" }, adminKey);
    setPlayers(Array.isArray(data) ? data : []);
    setPlayersLoading(false);
  }, [adminKey]);

  const loadPlayerProgress = useCallback(async (nick: string) => {
    setProgressLoading(true);
    const data = await apiFetch(`/player-progress?nick=${encodeURIComponent(nick)}`, { method: "GET" }, adminKey);
    setPlayerProgress(Array.isArray(data) ? data : []);
    setProgressLoading(false);
  }, [adminKey]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  useEffect(() => {
    if (selectedPlayer) loadPlayerProgress(selectedPlayer);
  }, [selectedPlayer, loadPlayerProgress]);

  const toggleQuestProgress = async (nick: string, questId: number, isCompleted: boolean) => {
    const action = isCompleted ? "revoke" : "grant";
    await apiFetch("/progress", {
      method: "POST",
      body: JSON.stringify({ nick, quest_id: questId, action }),
    }, adminKey);
    await loadPlayerProgress(nick);
    await loadPlayers();
  };

  const filteredPlayers = players.filter(p =>
    p.nick.toLowerCase().includes(playerSearch.toLowerCase())
  );

  const [error, setError] = useState<string | null>(null);

  const withLoad = async (fn: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
      await onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка запроса");
    }
    setLoading(false);
  };

  const addBranch = () => withLoad(async () => {
    const res = await apiFetch("/branches", { method: "POST", body: JSON.stringify({ title: "Новая операция", icon: "Crosshair", color: "#c0a830", description: "" }) }, adminKey);
    if (res.id) {
      const newBranch = { id: res.id, title: "Новая операция", icon: "Crosshair", color: "#c0a830", description: "", sort_order: 99, quests: [] };
      setActiveBranch(newBranch);
      setEditingBranch(newBranch);
      setBranchForm(newBranch);
    }
  });

  const saveBranch = (_b: Branch) => withLoad(async () => {
    await apiFetch("/branches", { method: "PUT", body: JSON.stringify(branchForm) }, adminKey);
    setEditingBranch(null);
  });

  const removeBranch = (b: Branch) => {
    if (!confirm(`Удалить операцию «${b.title}» со всеми задачами?`)) return;
    withLoad(async () => {
      await apiFetch("/branches/remove", { method: "POST", body: JSON.stringify({ id: b.id }) }, adminKey);
      setActiveBranch(null);
    });
  };

  const addQuest = () => {
    if (!activeBranch) return;
    const q: Partial<Quest> = { title: "Новая задача", description: "", reward: "", xp: 0, rarity: "common", icon: "Target", sort_order: 99 };
    setEditingQuest({ ...q, id: 0 } as Quest);
    setForm(q);
  };

  const saveNewQuest = () => withLoad(async () => {
    await apiFetch("/quests", { method: "POST", body: JSON.stringify({ ...form, branch_id: activeBranch?.id }) }, adminKey);
    setEditingQuest(null);
  });

  const saveQuest = (q: Quest) => withLoad(async () => {
    await apiFetch("/quests", { method: "PUT", body: JSON.stringify({ ...form, id: q.id }) }, adminKey);
    setEditingQuest(null);
  });

  const removeQuest = (q: Quest) => {
    if (!confirm(`Удалить задачу «${q.title}»?`)) return;
    withLoad(async () => {
      await apiFetch("/quests/remove", { method: "POST", body: JSON.stringify({ id: q.id }) }, adminKey);
    });
  };

  const reorderQuests = (ids: number[]) => withLoad(async () => {
    await apiFetch("/quests/reorder", { method: "POST", body: JSON.stringify({ ids }) }, adminKey);
  });

  const reorderBranches = (ids: number[]) => withLoad(async () => {
    await apiFetch("/branches/reorder", { method: "POST", body: JSON.stringify({ ids }) }, adminKey);
  });

  const [brDragIdx, setBrDragIdx] = useState<number | null>(null);
  const [brOverIdx, setBrOverIdx] = useState<number | null>(null);
  const brDragNode = useRef<HTMLButtonElement | null>(null);

  const brDragStart = (idx: number, e: React.DragEvent<HTMLButtonElement>) => {
    setBrDragIdx(idx);
    brDragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.style.opacity = "0.4";
  };

  const brDragEnd = () => {
    if (brDragNode.current) brDragNode.current.style.opacity = "1";
    if (brDragIdx !== null && brOverIdx !== null && brDragIdx !== brOverIdx) {
      const reordered = [...branches];
      const [moved] = reordered.splice(brDragIdx, 1);
      reordered.splice(brOverIdx, 0, moved);
      reorderBranches(reordered.map(b => b.id));
    }
    setBrDragIdx(null);
    setBrOverIdx(null);
    brDragNode.current = null;
  };

  const brDragOver = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (brOverIdx !== idx) setBrOverIdx(idx);
  };

  const startEditQuest = (q: Quest) => {
    setEditingQuest(q);
    setForm({ title: q.title, description: q.description, reward: q.reward, xp: q.xp, rarity: q.rarity, icon: q.icon, unlocked: q.unlocked });
  };

  const startEditBranch = (b: Branch) => {
    setEditingBranch(b);
    setBranchForm({ id: b.id, title: b.title, icon: b.icon, color: b.color, description: b.description });
  };

  const currentBranch = branches.find(b => b.id === activeBranch?.id) ?? activeBranch;

  const completedQuestIds = new Set(playerProgress.map(p => p.quest_id));

  const totalBranches = branches.length;
  const totalQuests = branches.reduce((s, b) => s + (b.quests?.length ?? 0), 0);
  const totalPlayers = players.length;

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "hsl(var(--background))" }}>
      <div className="w-72 border-r flex flex-col" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-2.5">
            <div className="wax-seal w-9 h-9 flex items-center justify-center flex-shrink-0">
              <Icon name="Star" size={17} color="hsl(var(--primary-foreground))" />
            </div>
            <div>
              <h2 className="stencil text-sm" style={{ color: "hsl(var(--quest-gold))", letterSpacing: "0.12em" }}>Штаб</h2>
              <p className="font-oswald text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Книга приказов RPM</p>
            </div>
          </div>
          <button className="p-1.5 rounded-md hover:bg-secondary transition-colors" onClick={onClose} title="Закрыть">
            <Icon name="X" size={16} color="hsl(var(--muted-foreground))" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-px border-b" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--border))" }}>
          {[
            { icon: "FolderTree", value: totalBranches, label: "операций" },
            { icon: "Target", value: totalQuests, label: "задач" },
            { icon: "Users", value: totalPlayers || "—", label: "бойцов" },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center py-3 gap-0.5" style={{ background: "hsl(var(--card))" }}>
              <Icon name={stat.icon} size={14} color="hsl(var(--quest-gold) / 0.7)" />
              <span className="font-cinzel text-lg font-bold leading-none" style={{ color: "hsl(var(--foreground))" }}>{stat.value}</span>
              <span className="font-oswald text-[9px] tracking-wider uppercase text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mx-3 mt-3 p-2 rounded text-xs font-crimson border" style={{ background: "hsl(var(--destructive) / 0.1)", borderColor: "hsl(var(--destructive) / 0.3)", color: "hsl(var(--destructive))" }}>
            {error}
            <button className="ml-2 underline" onClick={() => setError(null)}>×</button>
          </div>
        )}
        {loading && (
          <div className="mx-3 mt-2 text-center">
            <span className="font-crimson text-xs text-muted-foreground animate-pulse italic">Сохранение...</span>
          </div>
        )}

        <div className="flex border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <button
            className="flex-1 py-3 font-oswald text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5"
            style={{ color: activeTab === "quests" ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))", borderBottom: activeTab === "quests" ? "2px solid hsl(var(--quest-gold))" : "2px solid transparent", background: activeTab === "quests" ? "hsl(var(--quest-gold) / 0.05)" : "transparent" }}
            onClick={() => setActiveTab("quests")}>
            <Icon name="Target" size={14} />
            Задачи
          </button>
          <button
            className="flex-1 py-3 font-oswald text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5"
            style={{ color: activeTab === "players" ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))", borderBottom: activeTab === "players" ? "2px solid hsl(var(--quest-gold))" : "2px solid transparent", background: activeTab === "players" ? "hsl(var(--quest-gold) / 0.05)" : "transparent" }}
            onClick={() => setActiveTab("players")}>
            <Icon name="Users" size={14} />
            Личный состав
          </button>
        </div>

        {activeTab === "quests" && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-oswald text-[10px] tracking-widest uppercase text-muted-foreground">Операции</span>
              <button className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-secondary transition-colors" onClick={addBranch} disabled={loading} title="Добавить операцию">
                <Icon name="Plus" size={13} color="hsl(var(--quest-gold))" />
                <span className="font-oswald text-[10px] tracking-wider uppercase" style={{ color: "hsl(var(--quest-gold))" }}>Операция</span>
              </button>
            </div>
            {branches.map((b, idx) => {
              const bqTotal = (b.quests ?? []).length;
              const isActive = activeBranch?.id === b.id;
              return (
              <button key={b.id}
                draggable
                onDragStart={e => brDragStart(idx, e)}
                onDragEnd={brDragEnd}
                onDragOver={e => brDragOver(idx, e)}
                className={`w-full text-left px-2.5 py-2.5 rounded-md mb-1 flex items-center gap-2 transition-all group cursor-grab active:cursor-grabbing ${isActive ? "bg-secondary" : "hover:bg-secondary/50"}`}
                style={{
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: brDragIdx !== null && brOverIdx === idx && brDragIdx !== idx
                    ? "hsl(var(--quest-gold))"
                    : isActive ? `${b.color}55` : "transparent",
                  boxShadow: isActive ? `inset 2px 0 0 ${b.color}` : "none",
                }}
                onClick={() => { setActiveBranch(b); setEditingBranch(null); setEditingQuest(null); }}>
                <Icon name="GripVertical" size={13} color="hsl(var(--muted-foreground) / 0.5)" className="flex-shrink-0" />
                <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${b.color}22`, border: `1px solid ${b.color}44` }}>
                  <Icon name={b.icon} size={14} color={b.color} fallback="Star" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-cinzel text-sm font-semibold truncate block leading-tight">{b.title}</span>
                  <span className="font-oswald text-[9px] tracking-wider uppercase text-muted-foreground">{bqTotal} {bqTotal === 1 ? "задача" : bqTotal < 5 ? "задачи" : "задач"}</span>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button className="p-1 rounded hover:bg-background" onClick={e => { e.stopPropagation(); startEditBranch(b); }} title="Редактировать">
                    <Icon name="Pencil" size={12} color="hsl(var(--muted-foreground))" />
                  </button>
                  <button className="p-1 rounded hover:bg-background" onClick={e => { e.stopPropagation(); removeBranch(b); }} title="Удалить">
                    <Icon name="Trash2" size={12} color="hsl(var(--destructive))" />
                  </button>
                </div>
              </button>
              );
            })}
            {branches.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="FolderPlus" size={28} color="hsl(var(--muted-foreground))" />
                <p className="font-crimson text-xs mt-2 italic">Создайте первую операцию</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "players" && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="mb-3">
              <div className="relative">
                <input
                  className="w-full bg-background border rounded-md px-2 py-2 pl-8 font-crimson text-sm outline-none"
                  style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  placeholder="Поиск бойца..."
                  value={playerSearch}
                  onChange={e => setPlayerSearch(e.target.value)}
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Icon name="Search" size={13} color="hsl(var(--muted-foreground))" />
                </div>
              </div>
            </div>
            {playersLoading ? (
              <p className="font-crimson text-xs text-muted-foreground text-center py-4 italic animate-pulse">Загрузка...</p>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="UserX" size={28} color="hsl(var(--muted-foreground))" />
                <p className="font-crimson text-xs mt-2 italic">{playerSearch ? "Бойцы не найдены" : "Пока нет бойцов"}</p>
              </div>
            ) : (
              filteredPlayers.map(p => {
                const pct = totalQuests > 0 ? Math.round((p.completed / totalQuests) * 100) : 0;
                const isSel = selectedPlayer === p.nick;
                return (
                <button key={p.nick}
                  className={`w-full text-left px-2.5 py-2.5 rounded-md mb-1 flex items-center gap-2.5 transition-all ${isSel ? "bg-secondary" : "hover:bg-secondary/50"}`}
                  style={{ boxShadow: isSel ? "inset 2px 0 0 hsl(var(--quest-gold))" : "none" }}
                  onClick={() => setSelectedPlayer(p.nick)}>
                  <div className="wax-seal w-8 h-8 rounded-full flex items-center justify-center font-cinzel text-xs font-bold flex-shrink-0"
                    style={{ color: "hsl(var(--primary-foreground))" }}>
                    {p.nick[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-cinzel text-sm font-semibold truncate block leading-tight">{p.nick}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                        <div className="h-full rounded-full progress-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-oswald text-[9px] text-muted-foreground flex-shrink-0">{p.completed}/{totalQuests}</span>
                    </div>
                  </div>
                </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {activeTab === "quests" && (
        <AdminQuestsTab
          currentBranch={currentBranch}
          editingBranch={editingBranch}
          editingQuest={editingQuest}
          branchForm={branchForm}
          form={form}
          setBranchForm={fn => setBranchForm(prev => fn(prev))}
          setForm={fn => setForm(prev => fn(prev))}
          onSaveBranch={saveBranch}
          onCancelBranch={() => setEditingBranch(null)}
          onAddQuest={addQuest}
          onSaveNewQuest={saveNewQuest}
          onSaveQuest={saveQuest}
          onCancelQuest={() => setEditingQuest(null)}
          onStartEditQuest={startEditQuest}
          onRemoveQuest={removeQuest}
          onReorderQuests={reorderQuests}
        />
      )}

      {activeTab === "players" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedPlayer ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="parchment-bg paper-texture rounded-lg border p-4 mb-6 flex items-center gap-4" style={{ borderColor: "hsl(var(--quest-gold) / 0.3)" }}>
                <button className="p-1.5 rounded-md hover:bg-secondary transition-colors flex-shrink-0" onClick={() => setSelectedPlayer(null)} title="Назад к списку">
                  <Icon name="ArrowLeft" size={16} color="hsl(var(--muted-foreground))" />
                </button>
                <div className="wax-seal w-12 h-12 rounded-full flex items-center justify-center font-cinzel text-lg font-bold flex-shrink-0"
                  style={{ color: "hsl(var(--primary-foreground))" }}>
                  {selectedPlayer[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-cinzel text-xl font-bold truncate">{selectedPlayer}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 max-w-xs h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                      <div className="h-full rounded-full progress-bar-fill transition-all duration-700"
                        style={{ width: `${totalQuests > 0 ? Math.round((playerProgress.length / totalQuests) * 100) : 0}%` }} />
                    </div>
                    <span className="font-oswald text-xs text-muted-foreground tracking-wider whitespace-nowrap">
                      {playerProgress.length}/{totalQuests} задач
                    </span>
                  </div>
                </div>
              </div>

              {progressLoading ? (
                <p className="font-crimson text-sm text-muted-foreground text-center py-8 italic animate-pulse">Загрузка прогресса...</p>
              ) : (
                <div className="space-y-6 max-w-2xl">
                  {branches.map(branch => {
                    const bq = branch.quests ?? [];
                    const bDone = bq.filter(q => completedQuestIds.has(q.id)).length;
                    const bAllDone = bq.length > 0 && bDone === bq.length;
                    return (
                    <div key={branch.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${branch.color}22`, border: `1px solid ${branch.color}44` }}>
                          <Icon name={branch.icon} size={16} color={branch.color} fallback="Star" />
                        </div>
                        <h4 className="font-cinzel text-sm font-bold">{branch.title}</h4>
                        {bAllDone && (
                          <Icon name="BadgeCheck" size={14} color="hsl(var(--quest-green-bright))" />
                        )}
                        <span className="font-oswald text-[10px] tracking-wider text-muted-foreground ml-auto">
                          {bDone}/{bq.length}
                        </span>
                      </div>
                      <div className="grid gap-2">
                        {bq.map(quest => {
                          const isCompleted = completedQuestIds.has(quest.id);
                          return (
                            <div key={quest.id}
                              className="parchment-bg rounded-md border p-3 flex items-center gap-3 cursor-pointer hover:bg-secondary/30 transition-all group"
                              style={{ borderColor: isCompleted ? "hsl(var(--quest-green) / 0.4)" : "hsl(var(--border))" }}
                              onClick={() => toggleQuestProgress(selectedPlayer, quest.id, isCompleted)}>
                              <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                                style={{
                                  borderColor: isCompleted ? "hsl(var(--quest-green))" : "hsl(var(--border))",
                                  background: isCompleted ? "hsl(var(--quest-green))" : "transparent",
                                }}>
                                {isCompleted && <Icon name="Check" size={12} color="white" />}
                              </div>
                              <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                                style={{ background: isCompleted ? "hsl(var(--quest-green) / 0.15)" : "hsl(var(--muted))" }}>
                                <Icon name={quest.icon} size={16} fallback="Star"
                                  color={isCompleted ? "hsl(var(--quest-green-bright))" : "hsl(var(--quest-gold))"} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`font-cinzel text-sm font-semibold truncate block ${isCompleted ? "text-muted-foreground line-through" : ""}`}>
                                  {quest.title}
                                </span>
                                <span className="font-oswald text-[10px] tracking-widest uppercase px-1.5 py-0.5 rounded inline-block mt-0.5"
                                  style={{ background: "hsl(var(--muted) / 0.5)", color: "hsl(var(--muted-foreground))" }}>
                                  {quest.rarity === "common" ? "Рядовая" : quest.rarity === "rare" ? "Боевая" : "Особой важности"}
                                </span>
                              </div>
                              <span className="font-oswald text-[9px] tracking-widest uppercase px-2 py-1 rounded-md flex-shrink-0 border transition-colors"
                                style={{
                                  color: isCompleted ? "hsl(var(--quest-green-bright))" : "hsl(var(--muted-foreground))",
                                  borderColor: isCompleted ? "hsl(var(--quest-green) / 0.4)" : "hsl(var(--border))",
                                  background: isCompleted ? "hsl(var(--quest-green) / 0.1)" : "transparent",
                                }}>
                                {isCompleted ? "Зачтено" : "Зачесть"}
                              </span>
                            </div>
                          );
                        })}
                        {bq.length === 0 && (
                          <p className="font-crimson text-xs text-muted-foreground italic pl-9">Нет задач</p>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border"
                  style={{ background: "hsl(var(--quest-brown))", borderColor: "hsl(var(--quest-gold) / 0.2)" }}>
                  <Icon name="UserSearch" size={30} color="hsl(var(--quest-gold) / 0.6)" />
                </div>
                <p className="font-cinzel text-lg font-semibold" style={{ color: "hsl(var(--foreground))" }}>Выберите бойца</p>
                <p className="font-crimson text-sm italic mt-1">Слева — личный состав и боевые досье</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}