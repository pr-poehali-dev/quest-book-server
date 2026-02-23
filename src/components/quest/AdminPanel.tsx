import { useState, useEffect, useCallback } from "react";
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
    if (activeTab === "players") loadPlayers();
  }, [activeTab, loadPlayers]);

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
    const res = await apiFetch("/branches", { method: "POST", body: JSON.stringify({ title: "Новая ветка", icon: "Star", color: "#c0a830", description: "" }) }, adminKey);
    if (res.id) {
      const newBranch = { id: res.id, title: "Новая ветка", icon: "Star", color: "#c0a830", description: "", sort_order: 99, quests: [] };
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
    if (!confirm(`Удалить ветку «${b.title}» со всеми квестами?`)) return;
    withLoad(async () => {
      await apiFetch("/branches/remove", { method: "POST", body: JSON.stringify({ id: b.id }) }, adminKey);
      setActiveBranch(null);
    });
  };

  const addQuest = () => {
    if (!activeBranch) return;
    const q: Partial<Quest> = { title: "Новый квест", description: "", reward: "", xp: 100, rarity: "common", icon: "Star", sort_order: 99 };
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
    if (!confirm(`Удалить квест «${q.title}»?`)) return;
    withLoad(async () => {
      await apiFetch("/quests/remove", { method: "POST", body: JSON.stringify({ id: q.id }) }, adminKey);
    });
  };

  const startEditQuest = (q: Quest) => {
    setEditingQuest(q);
    setForm({ title: q.title, description: q.description, reward: q.reward, xp: q.xp, rarity: q.rarity, icon: q.icon });
  };

  const startEditBranch = (b: Branch) => {
    setEditingBranch(b);
    setBranchForm({ id: b.id, title: b.title, icon: b.icon, color: b.color, description: b.description });
  };

  const currentBranch = branches.find(b => b.id === activeBranch?.id) ?? activeBranch;

  const completedQuestIds = new Set(playerProgress.map(p => p.quest_id));

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "hsl(var(--background))" }}>
      <div className="w-64 border-r flex flex-col" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "hsl(var(--border))" }}>
          <div>
            <h2 className="font-cinzel text-sm font-bold" style={{ color: "hsl(var(--quest-gold))" }}>Админка</h2>
            <p className="font-crimson text-xs text-muted-foreground">Управление квестами</p>
          </div>
          <button className="p-1.5 rounded hover:bg-secondary" onClick={onClose}>
            <Icon name="X" size={16} color="hsl(var(--muted-foreground))" />
          </button>
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
            className="flex-1 py-2.5 font-oswald text-xs tracking-wider uppercase transition-colors"
            style={{ color: activeTab === "quests" ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))", borderBottom: activeTab === "quests" ? "2px solid hsl(var(--quest-gold))" : "2px solid transparent" }}
            onClick={() => setActiveTab("quests")}>
            <Icon name="ScrollText" size={13} />
            <span className="ml-1">Квесты</span>
          </button>
          <button
            className="flex-1 py-2.5 font-oswald text-xs tracking-wider uppercase transition-colors"
            style={{ color: activeTab === "players" ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))", borderBottom: activeTab === "players" ? "2px solid hsl(var(--quest-gold))" : "2px solid transparent" }}
            onClick={() => setActiveTab("players")}>
            <Icon name="Users" size={13} />
            <span className="ml-1">Игроки</span>
          </button>
        </div>

        {activeTab === "quests" && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-oswald text-[10px] tracking-widest uppercase text-muted-foreground">Ветки</span>
              <button className="p-1 rounded hover:bg-secondary" onClick={addBranch} disabled={loading}>
                <Icon name="Plus" size={14} color="hsl(var(--quest-gold))" />
              </button>
            </div>
            {branches.map(b => (
              <button key={b.id}
                className={`w-full text-left px-3 py-2.5 rounded mb-1 flex items-center gap-2 transition-colors group ${activeBranch?.id === b.id ? "bg-secondary" : "hover:bg-secondary/50"}`}
                onClick={() => { setActiveBranch(b); setEditingBranch(null); setEditingQuest(null); }}>
                <Icon name={b.icon} size={15} color={b.color} fallback="Star" />
                <span className="font-crimson text-sm truncate flex-1">{b.title}</span>
                <span className="font-oswald text-[10px] text-muted-foreground">{(b.quests ?? []).length}</span>
                <div className="flex gap-0.5">
                  <button className="p-1 rounded hover:bg-background" onClick={e => { e.stopPropagation(); startEditBranch(b); }}>
                    <Icon name="Pencil" size={13} color="hsl(var(--muted-foreground))" />
                  </button>
                  <button className="p-1 rounded hover:bg-background" onClick={e => { e.stopPropagation(); removeBranch(b); }}>
                    <Icon name="Trash2" size={13} color="hsl(var(--destructive))" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === "players" && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="mb-3">
              <div className="relative">
                <input
                  className="w-full bg-background border rounded px-2 py-1.5 pl-7 font-crimson text-sm outline-none"
                  style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  placeholder="Поиск игрока..."
                  value={playerSearch}
                  onChange={e => setPlayerSearch(e.target.value)}
                />
                <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Icon name="Search" size={13} color="hsl(var(--muted-foreground))" />
                </div>
              </div>
            </div>
            {playersLoading ? (
              <p className="font-crimson text-xs text-muted-foreground text-center py-4 italic animate-pulse">Загрузка...</p>
            ) : filteredPlayers.length === 0 ? (
              <p className="font-crimson text-xs text-muted-foreground text-center py-4 italic">Игроки не найдены</p>
            ) : (
              filteredPlayers.map(p => (
                <button key={p.nick}
                  className={`w-full text-left px-3 py-2.5 rounded mb-1 flex items-center gap-2 transition-colors ${selectedPlayer === p.nick ? "bg-secondary" : "hover:bg-secondary/50"}`}
                  onClick={() => setSelectedPlayer(p.nick)}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center font-cinzel text-[10px] font-bold flex-shrink-0"
                    style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}>
                    {p.nick[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-crimson text-sm truncate block">{p.nick}</span>
                    <span className="font-oswald text-[10px] text-muted-foreground">{p.completed} done · {p.total_xp} XP</span>
                  </div>
                </button>
              ))
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
        />
      )}

      {activeTab === "players" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedPlayer ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-3 mb-6">
                <button className="p-1.5 rounded hover:bg-secondary" onClick={() => setSelectedPlayer(null)}>
                  <Icon name="ArrowLeft" size={16} color="hsl(var(--muted-foreground))" />
                </button>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-cinzel text-sm font-bold"
                  style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}>
                  {selectedPlayer[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-cinzel text-lg font-bold">{selectedPlayer}</h3>
                  <p className="font-oswald text-xs text-muted-foreground tracking-wider">
                    {playerProgress.length} {playerProgress.length === 1 ? "квест выполнен" : "квестов выполнено"}
                  </p>
                </div>
              </div>

              {progressLoading ? (
                <p className="font-crimson text-sm text-muted-foreground text-center py-8 italic animate-pulse">Загрузка прогресса...</p>
              ) : (
                <div className="space-y-6 max-w-2xl">
                  {branches.map(branch => (
                    <div key={branch.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: `${branch.color}22` }}>
                          <Icon name={branch.icon} size={16} color={branch.color} fallback="Star" />
                        </div>
                        <h4 className="font-cinzel text-sm font-bold">{branch.title}</h4>
                        <span className="font-oswald text-[10px] text-muted-foreground ml-auto">
                          {(branch.quests ?? []).filter(q => completedQuestIds.has(q.id)).length}/{(branch.quests ?? []).length}
                        </span>
                      </div>
                      <div className="grid gap-2">
                        {(branch.quests ?? []).map(quest => {
                          const isCompleted = completedQuestIds.has(quest.id);
                          return (
                            <div key={quest.id}
                              className="parchment-bg rounded border p-3 flex items-center gap-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                              style={{ borderColor: isCompleted ? "hsl(var(--quest-green) / 0.4)" : "hsl(var(--border))" }}
                              onClick={() => toggleQuestProgress(selectedPlayer, quest.id, isCompleted)}>
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isCompleted ? "" : ""}`}
                                style={{
                                  borderColor: isCompleted ? "hsl(var(--quest-green))" : "hsl(var(--border))",
                                  background: isCompleted ? "hsl(var(--quest-green))" : "transparent",
                                }}>
                                {isCompleted && <Icon name="Check" size={12} color="white" />}
                              </div>
                              <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                                style={{ background: isCompleted ? "hsl(var(--quest-green) / 0.15)" : "hsl(var(--muted))" }}>
                                <Icon name={quest.icon} size={16} fallback="Star"
                                  color={isCompleted ? "hsl(var(--quest-green-bright))" : "hsl(var(--quest-gold))"} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`font-cinzel text-sm font-semibold truncate block ${isCompleted ? "text-muted-foreground line-through" : ""}`}>
                                  {quest.title}
                                </span>
                                <span className="font-oswald text-[10px] text-muted-foreground">+{quest.xp} XP · {quest.rarity}</span>
                              </div>
                              <span className="font-oswald text-[10px] tracking-wider flex-shrink-0"
                                style={{ color: isCompleted ? "hsl(var(--quest-green-bright))" : "hsl(var(--muted-foreground))" }}>
                                {isCompleted ? "DONE" : "—"}
                              </span>
                            </div>
                          );
                        })}
                        {(branch.quests ?? []).length === 0 && (
                          <p className="font-crimson text-xs text-muted-foreground italic pl-9">Нет квестов</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Icon name="Users" size={40} color="hsl(var(--muted-foreground))" />
                <p className="font-crimson text-lg italic mt-3">Выберите игрока из списка</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}