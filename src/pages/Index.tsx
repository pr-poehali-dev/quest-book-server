import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ─── Config ───────────────────────────────────────────────────────────────────

const API = "https://functions.poehali.dev/2f2c6c49-83e3-4b16-a65e-e7568c82acd4";

// ─── Types ────────────────────────────────────────────────────────────────────

type Rarity = "common" | "rare" | "epic";

interface Quest {
  id: number;
  title: string;
  description: string;
  reward: string;
  xp: number;
  rarity: Rarity;
  icon: string;
  sort_order: number;
  status?: "completed" | "active" | "locked";
}

interface Branch {
  id: number;
  title: string;
  icon: string;
  color: string;
  description: string;
  sort_order: number;
  quests: Quest[];
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch(path: string, opts?: RequestInit, adminKey?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) headers["X-Admin-Key"] = adminKey;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  return res.json();
}

// ─── Small UI ─────────────────────────────────────────────────────────────────

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

// ─── Quest Card ───────────────────────────────────────────────────────────────

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

// ─── Quest Modal ──────────────────────────────────────────────────────────────

const QuestModal = ({ quest, onClose, onComplete }: { quest: Quest; onClose: () => void; onComplete: (q: Quest) => void }) => (
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
      <div className="parchment-bg rounded p-3 mb-5 border" style={{ borderColor: "hsl(var(--quest-gold) / 0.2)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Icon name="Gift" size={14} color="hsl(var(--quest-gold))" />
          <span className="font-oswald text-xs tracking-widest uppercase text-muted-foreground">Награда</span>
        </div>
        <p className="font-crimson text-sm">{quest.reward}</p>
        <p className="font-oswald text-xs mt-1" style={{ color: "hsl(var(--quest-gold))" }}>+{quest.xp} XP</p>
      </div>
      <div className="flex gap-3">
        <button className="flex-1 py-2.5 rounded border font-oswald text-sm tracking-wider uppercase transition-colors hover:bg-secondary"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }} onClick={onClose}>
          Закрыть
        </button>
        {quest.status === "active" && (
          <button className="flex-1 py-2.5 rounded font-cinzel text-sm font-semibold tracking-wider uppercase transition-opacity hover:opacity-90 animate-glow"
            style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}
            onClick={() => onComplete(quest)}>
            ✓ Выполнено
          </button>
        )}
      </div>
    </div>
  </div>
);

// ─── Admin Panel ──────────────────────────────────────────────────────────────

const ICONS = ["Star", "Sword", "Shield", "Target", "Swords", "Moon", "MapPin", "Map", "Anchor", "Globe", "Compass", "Wrench", "FlaskConical", "Sparkles", "Crown", "Trophy", "UserPlus", "ShoppingBag", "Flag", "Hammer", "Users", "Gift", "Zap", "Flame", "Heart"];
const COLORS = ["#c0392b", "#2980b9", "#8e44ad", "#27ae60", "#e67e22", "#16a085", "#d35400", "#2c3e50", "#c0a830"];

function AdminPanel({ branches, adminKey, onRefresh, onClose }: {
  branches: Branch[];
  adminKey: string;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const [activeBranch, setActiveBranch] = useState<Branch | null>(branches[0] ?? null);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Quest>>({});
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({});

  const withLoad = async (fn: () => Promise<void>) => {
    setLoading(true);
    await fn();
    await onRefresh();
    setLoading(false);
  };

  // Branch actions
  const addBranch = () => withLoad(async () => {
    const res = await apiFetch("/branches", { method: "POST", body: JSON.stringify({ title: "Новая ветка", icon: "Star", color: "#c0a830", description: "" }) }, adminKey);
    if (res.id) {
      const newBranch = { id: res.id, title: "Новая ветка", icon: "Star", color: "#c0a830", description: "", sort_order: 99, quests: [] };
      setActiveBranch(newBranch);
      setEditingBranch(newBranch);
      setBranchForm(newBranch);
    }
  });

  const saveBranch = (b: Branch) => withLoad(async () => {
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

  // Quest actions
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

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "hsl(var(--background))" }}>
      {/* Sidebar */}
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
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-oswald text-xs tracking-widest uppercase text-muted-foreground">Ветки</span>
            <button className="p-1 rounded hover:bg-secondary" onClick={addBranch} title="Добавить ветку">
              <Icon name="Plus" size={14} color="hsl(var(--quest-gold))" />
            </button>
          </div>
          {branches.map(b => (
            <div key={b.id}
              className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer mb-1 group transition-colors ${activeBranch?.id === b.id ? "bg-secondary" : "hover:bg-secondary/50"}`}
              onClick={() => setActiveBranch(b)}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
              <span className="font-oswald text-sm flex-1 truncate">{b.title}</span>
              <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-secondary"
                onClick={e => { e.stopPropagation(); startEditBranch(b); }}>
                <Icon name="Pencil" size={12} color="hsl(var(--quest-gold))" />
              </button>
              <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-secondary"
                onClick={e => { e.stopPropagation(); removeBranch(b); }}>
                <Icon name="Trash2" size={12} color="hsl(var(--destructive))" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Branch edit bar */}
        {editingBranch && (
          <div className="border-b p-4 flex items-end gap-3 flex-wrap animate-fade-in" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
            <div>
              <label className="block font-oswald text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Название ветки</label>
              <input className="bg-background border rounded px-2 py-1.5 font-crimson text-sm outline-none w-44"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                value={branchForm.title ?? ""} onChange={e => setBranchForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="block font-oswald text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Описание</label>
              <input className="bg-background border rounded px-2 py-1.5 font-crimson text-sm outline-none w-56"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                value={branchForm.description ?? ""} onChange={e => setBranchForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="block font-oswald text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Иконка</label>
              <select className="bg-background border rounded px-2 py-1.5 font-oswald text-sm outline-none"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                value={branchForm.icon ?? "Star"} onChange={e => setBranchForm(p => ({ ...p, icon: e.target.value }))}>
                {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-oswald text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Цвет</label>
              <div className="flex gap-1">
                {COLORS.map(c => (
                  <button key={c} className="w-6 h-6 rounded border-2 transition-transform hover:scale-110"
                    style={{ background: c, borderColor: branchForm.color === c ? "hsl(var(--quest-gold))" : "transparent" }}
                    onClick={() => setBranchForm(p => ({ ...p, color: c }))} />
                ))}
              </div>
            </div>
            <div className="flex gap-2 ml-auto">
              <button className="px-3 py-1.5 rounded border font-oswald text-xs tracking-wider uppercase hover:bg-secondary"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                onClick={() => setEditingBranch(null)}>Отмена</button>
              <button className="px-3 py-1.5 rounded font-oswald text-xs tracking-wider uppercase"
                style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}
                onClick={() => saveBranch(editingBranch)}>Сохранить</button>
            </div>
          </div>
        )}

        {/* Quest list */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentBranch ? (
            <>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${currentBranch.color}22` }}>
                    <Icon name={currentBranch.icon} size={20} color={currentBranch.color} fallback="Star" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-lg font-bold">{currentBranch.title}</h3>
                    <p className="font-crimson text-xs italic text-muted-foreground">{currentBranch.description}</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded font-oswald text-sm tracking-wide"
                  style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}
                  onClick={addQuest}>
                  <Icon name="Plus" size={15} color="hsl(var(--primary-foreground))" />
                  Добавить квест
                </button>
              </div>

              <div className="grid gap-3 max-w-2xl">
                {/* New quest form */}
                {editingQuest?.id === 0 && (
                  <QuestFormCard form={form} setForm={setForm} onSave={saveNewQuest} onCancel={() => setEditingQuest(null)} isNew />
                )}

                {(currentBranch.quests ?? []).map(q => (
                  <div key={q.id}>
                    {editingQuest?.id === q.id ? (
                      <QuestFormCard form={form} setForm={setForm} onSave={() => saveQuest(q)} onCancel={() => setEditingQuest(null)} />
                    ) : (
                      <div className="parchment-bg rounded border p-3 flex items-start gap-3 group"
                        style={{ borderColor: "hsl(var(--border))" }}>
                        <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
                          style={{ background: "hsl(var(--muted))" }}>
                          <Icon name={q.icon} size={18} fallback="Star" color="hsl(var(--quest-gold))" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-cinzel text-sm font-semibold truncate">{q.title}</span>
                            <RarityBadge rarity={q.rarity} />
                            <span className="font-oswald text-xs ml-auto" style={{ color: "hsl(var(--quest-gold))" }}>+{q.xp} XP</span>
                          </div>
                          <p className="text-xs font-crimson text-muted-foreground truncate">{q.description}</p>
                          <p className="text-xs font-crimson text-muted-foreground truncate">🎁 {q.reward}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
                          <button className="p-1.5 rounded hover:bg-secondary" onClick={() => startEditQuest(q)}>
                            <Icon name="Pencil" size={14} color="hsl(var(--quest-gold))" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-secondary" onClick={() => removeQuest(q)}>
                            <Icon name="Trash2" size={14} color="hsl(var(--destructive))" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {(currentBranch.quests ?? []).length === 0 && editingQuest?.id !== 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Icon name="ScrollText" size={40} color="hsl(var(--muted-foreground))" />
                    <p className="font-crimson text-sm mt-3 italic">В этой ветке нет квестов</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p className="font-crimson text-lg italic">Выберите ветку или создайте новую</p>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "hsl(var(--background) / 0.5)" }}>
          <div className="font-cinzel text-sm animate-pulse" style={{ color: "hsl(var(--quest-gold))" }}>Сохранение...</div>
        </div>
      )}
    </div>
  );
}

function QuestFormCard({ form, setForm, onSave, onCancel, isNew }: {
  form: Partial<Quest>;
  setForm: (fn: (p: Partial<Quest>) => Partial<Quest>) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew?: boolean;
}) {
  const ICONS_LIST = ["Star", "Sword", "Shield", "Target", "Swords", "Moon", "MapPin", "Map", "Anchor", "Globe", "Compass", "Wrench", "FlaskConical", "Sparkles", "Crown", "Trophy", "UserPlus", "ShoppingBag", "Flag", "Hammer", "Zap", "Flame", "Heart", "Gift"];
  const inp = "bg-background border rounded px-2 py-1.5 font-crimson text-sm outline-none w-full";
  const st = { borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" };

  return (
    <div className="parchment-bg rounded border p-4 animate-fade-in" style={{ borderColor: "hsl(var(--quest-gold) / 0.4)" }}>
      <p className="font-cinzel text-xs mb-3" style={{ color: "hsl(var(--quest-gold))" }}>{isNew ? "Новый квест" : "Редактирование"}</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block font-oswald text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Название</label>
          <input className={inp} style={st} value={form.title ?? ""} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>
        <div>
          <label className="block font-oswald text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Награда</label>
          <input className={inp} style={st} value={form.reward ?? ""} onChange={e => setForm(p => ({ ...p, reward: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="block font-oswald text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Описание</label>
          <input className={inp} style={st} value={form.description ?? ""} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div>
          <label className="block font-oswald text-[10px] tracking-wider uppercase text-muted-foreground mb-1">XP</label>
          <input type="number" className={inp} style={st} value={form.xp ?? 100} onChange={e => setForm(p => ({ ...p, xp: parseInt(e.target.value) || 0 }))} />
        </div>
        <div>
          <label className="block font-oswald text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Редкость</label>
          <select className={inp} style={st} value={form.rarity ?? "common"} onChange={e => setForm(p => ({ ...p, rarity: e.target.value as Rarity }))}>
            <option value="common">Обычный</option>
            <option value="rare">Редкий</option>
            <option value="epic">Эпик</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block font-oswald text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Иконка</label>
          <div className="flex flex-wrap gap-1.5">
            {ICONS_LIST.map(ic => (
              <button key={ic} className="w-8 h-8 rounded border flex items-center justify-center transition-colors"
                style={{ borderColor: form.icon === ic ? "hsl(var(--quest-gold))" : "hsl(var(--border))", background: form.icon === ic ? "hsl(var(--quest-gold) / 0.15)" : "hsl(var(--muted))" }}
                onClick={() => setForm(p => ({ ...p, icon: ic }))}>
                <Icon name={ic} size={14} fallback="Star" color={form.icon === ic ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))"} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="px-3 py-1.5 rounded border font-oswald text-xs tracking-wider uppercase hover:bg-secondary"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }} onClick={onCancel}>Отмена</button>
        <button className="px-4 py-1.5 rounded font-oswald text-xs tracking-wider uppercase"
          style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }} onClick={onSave}>Сохранить</button>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

const LoginScreen = ({ onLogin, onAdmin }: { onLogin: (nick: string) => void; onAdmin: (key: string) => void }) => {
  const [nick, setNick] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [adminKey, setAdminKey] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <img src="https://cdn.poehali.dev/projects/d5e86919-d370-406c-a721-817de003fa32/files/2aaf2152-2c19-4345-9b41-e69234d4b1e1.jpg"
            alt="Quest Book" className="w-28 h-28 object-cover rounded-lg border-2 mx-auto mb-4"
            style={{ borderColor: "hsl(var(--quest-gold) / 0.5)", boxShadow: "0 0 30px hsl(var(--quest-gold) / 0.2)" }} />
          <h1 className="font-cinzel text-4xl font-black mb-2 gold-shimmer">Quest Book</h1>
          <p className="font-crimson text-lg italic text-muted-foreground">Книга приключений</p>
        </div>

        <div className="parchment-bg rounded-lg border p-6" style={{ borderColor: "hsl(var(--quest-gold) / 0.35)" }}>
          <div className="ornament mb-5"><span>{adminMode ? "АДМИНИСТРАТОР" : "ВХОД"}</span></div>

          {!adminMode ? (
            <>
              <label className="block font-oswald text-xs tracking-widest uppercase text-muted-foreground mb-2">Ваш ник</label>
              <input type="text" placeholder="Steve..."
                value={nick} onChange={e => setNick(e.target.value)}
                onKeyDown={e => e.key === "Enter" && nick.trim() && onLogin(nick.trim())}
                className="w-full bg-transparent border rounded px-3 py-2.5 font-crimson text-base mb-5 outline-none transition-colors"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }} autoFocus />
              <button disabled={!nick.trim()} onClick={() => nick.trim() && onLogin(nick.trim())}
                className="w-full py-3 rounded font-cinzel text-sm font-bold tracking-widest uppercase transition-opacity disabled:opacity-40 hover:opacity-90"
                style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}>
                Открыть книгу
              </button>
            </>
          ) : (
            <>
              <label className="block font-oswald text-xs tracking-widest uppercase text-muted-foreground mb-2">Пароль</label>
              <input type="password" placeholder="••••••"
                value={adminKey} onChange={e => setAdminKey(e.target.value)}
                onKeyDown={e => e.key === "Enter" && adminKey && onAdmin(adminKey)}
                className="w-full bg-transparent border rounded px-3 py-2.5 font-crimson text-base mb-5 outline-none"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }} autoFocus />
              <button disabled={!adminKey} onClick={() => adminKey && onAdmin(adminKey)}
                className="w-full py-3 rounded font-cinzel text-sm font-bold tracking-widest uppercase transition-opacity disabled:opacity-40 hover:opacity-90"
                style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}>
                Войти в админку
              </button>
            </>
          )}
        </div>

        <button className="w-full mt-3 py-2 font-oswald text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setAdminMode(m => !m)}>
          {adminMode ? "← Вернуться" : "Вход для администратора"}
        </button>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Index() {
  const [player, setPlayer] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<number | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBranches = useCallback(async () => {
    const data = await apiFetch("/");
    setBranches(Array.isArray(data) ? data : []);
    if (Array.isArray(data) && data.length > 0 && !activeBranchId) {
      setActiveBranchId(data[0].id);
    }
  }, [activeBranchId]);

  const loadProgress = useCallback(async (nick: string) => {
    const data = await apiFetch(`/progress?nick=${encodeURIComponent(nick)}`);
    setCompletedIds(data.completed_quest_ids ?? []);
  }, []);

  useEffect(() => {
    loadBranches().finally(() => setLoading(false));
  }, []);

  const handleLogin = (nick: string) => {
    setPlayer(nick);
    loadProgress(nick);
  };

  const handleAdmin = (key: string) => {
    setAdminKey(key);
    setShowAdmin(true);
  };

  const handleComplete = async (quest: Quest) => {
    if (!player) return;
    const res = await apiFetch("/progress", { method: "POST", body: JSON.stringify({ nick: player, quest_id: quest.id }) });
    if (res.success) {
      setCompletedIds(prev => [...prev, quest.id]);
      setSelectedQuest(null);
      setNotification(`✓ «${quest.title}» выполнено! +${quest.xp} XP`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  const getQuestStatus = (q: Quest, idx: number, allQuests: Quest[]): "completed" | "active" | "locked" => {
    if (completedIds.includes(q.id)) return "completed";
    if (idx === 0) return "active";
    const prev = allQuests[idx - 1];
    if (completedIds.includes(prev.id)) return "active";
    return "locked";
  };

  if (!player && !showAdmin) return <LoginScreen onLogin={handleLogin} onAdmin={handleAdmin} />;

  if (showAdmin && adminKey) return (
    <AdminPanel
      branches={branches}
      adminKey={adminKey}
      onRefresh={loadBranches}
      onClose={() => { setShowAdmin(false); setAdminKey(null); }}
    />
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-cinzel text-lg animate-pulse" style={{ color: "hsl(var(--quest-gold))" }}>Загрузка книги...</p>
    </div>
  );

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
            <div className="hidden sm:flex items-center gap-2 parchment-bg border rounded px-3 py-1.5">
              <Icon name="Trophy" size={14} color="hsl(var(--quest-gold))" />
              <span className="font-oswald text-xs tracking-wider" style={{ color: "hsl(var(--quest-gold))" }}>{totalXP} XP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-cinzel text-sm font-bold"
                style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}>
                {player?.[0]?.toUpperCase() ?? "A"}
              </div>
              <span className="hidden sm:block font-oswald text-sm tracking-wide">{player}</span>
            </div>
            <button className="p-1.5 rounded hover:bg-secondary" onClick={() => setPlayer(null)} title="Выйти">
              <Icon name="LogOut" size={15} color="hsl(var(--muted-foreground))" />
            </button>
          </div>
        </div>
      </header>

      {/* XP bar */}
      <div className="border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1"><XPBar total={maxXP} earned={totalXP} /></div>
          <div className="flex-shrink-0">
            <p className="font-oswald text-xs tracking-wider text-muted-foreground">{completedCount}/{allQuests.length}</p>
          </div>
        </div>
      </div>

      {/* Branch tabs */}
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

      {/* Content */}
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
                {[{ label: "Выполнено", icon: "CheckCircle", color: "hsl(var(--quest-green-bright))" },
                  { label: "Активно", icon: "Circle", color: "hsl(var(--quest-gold))" },
                  { label: "Заблокировано", icon: "Lock", color: "hsl(var(--muted-foreground))" }
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

        {branches.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="font-cinzel text-xl" style={{ color: "hsl(var(--quest-gold))" }}>Книга пуста</p>
            <p className="font-crimson text-muted-foreground mt-2 italic">Войдите как администратор, чтобы создать первые квесты</p>
          </div>
        )}
      </main>

      {activeSelectedQuest && (
        <QuestModal quest={activeSelectedQuest} onClose={() => setSelectedQuest(null)} onComplete={handleComplete} />
      )}
    </div>
  );
}
