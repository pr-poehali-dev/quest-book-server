import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Branch, Quest, Rarity, apiFetch } from "./types";

interface ProofEntry {
  id: number;
  player_nick: string;
  quest_id: number;
  quest_title: string;
  xp: number;
  rarity: Rarity;
  icon: string;
  proof_url: string | null;
  status: "pending" | "approved" | "rejected";
  completed_at: string | null;
}

type AdminTab = "quests" | "proofs";

const ICONS = ["Star", "Sword", "Shield", "Target", "Swords", "Moon", "MapPin", "Map", "Anchor", "Globe", "Compass", "Wrench", "FlaskConical", "Sparkles", "Crown", "Trophy", "UserPlus", "ShoppingBag", "Flag", "Hammer", "Users", "Gift", "Zap", "Flame", "Heart"];
const COLORS = ["#c0392b", "#2980b9", "#8e44ad", "#27ae60", "#e67e22", "#16a085", "#d35400", "#2c3e50", "#c0a830"];

const RarityBadge = ({ rarity }: { rarity: Rarity }) => {
  const labels = { common: "Обычный", rare: "Редкий", epic: "Эпик" };
  return (
    <span className={`text-[10px] font-oswald tracking-widest uppercase px-2 py-0.5 rounded border badge-${rarity}`}>
      {labels[rarity]}
    </span>
  );
};

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
              <button key={ic}
                className="w-8 h-8 rounded border flex items-center justify-center transition-colors"
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

interface AdminPanelProps {
  branches: Branch[];
  adminKey: string;
  onRefresh: () => void;
  onClose: () => void;
}

export default function AdminPanel({ branches, adminKey, onRefresh, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("quests");
  const [tgStatus, setTgStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  const setupTelegram = async () => {
    setTgStatus("loading");
    const res = await apiFetch("/tgsetup", { method: "POST" }, adminKey);
    setTgStatus(res?.webhook_set ? "ok" : "err");
  };
  const [activeBranch, setActiveBranch] = useState<Branch | null>(branches[0] ?? null);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Quest>>({});
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({});
  const [proofs, setProofs] = useState<ProofEntry[]>([]);
  const [proofsTab, setProofsTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [proofsLoading, setProofsLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const loadProofs = useCallback(async (status: "pending" | "approved" | "rejected") => {
    setProofsLoading(true);
    const data = await apiFetch(`/proofs?status=${status}`, { method: "GET" }, adminKey);
    setProofs(Array.isArray(data) ? data : []);
    setProofsLoading(false);
  }, [adminKey]);

  const loadPendingCount = useCallback(async () => {
    const data = await apiFetch("/proofs?status=pending", { method: "GET" }, adminKey);
    setPendingCount(Array.isArray(data) ? data.length : 0);
  }, [adminKey]);

  useEffect(() => {
    loadPendingCount();
  }, [loadPendingCount]);

  useEffect(() => {
    if (activeTab === "proofs") loadProofs(proofsTab);
  }, [activeTab, proofsTab, loadProofs]);

  const approveProof = async (proof: ProofEntry, action: "approve" | "reject") => {
    await apiFetch("/proofs/approve", { method: "POST", body: JSON.stringify({ id: proof.id, action }) }, adminKey);
    await loadProofs(proofsTab);
    await loadPendingCount();
    if (action === "approve") await onRefresh();
  };

  const withLoad = async (fn: () => Promise<void>) => {
    setLoading(true);
    await fn();
    await onRefresh();
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

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "hsl(var(--background))" }}>
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "hsl(var(--border))" }}>
          <div>
            <h2 className="font-cinzel text-sm font-bold" style={{ color: "hsl(var(--quest-gold))" }}>Админка</h2>
            <p className="font-crimson text-xs text-muted-foreground">Управление квестами</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              title={tgStatus === "ok" ? "Telegram подключён" : "Подключить Telegram-уведомления"}
              className="p-1.5 rounded hover:bg-secondary transition-colors"
              onClick={setupTelegram}
              disabled={tgStatus === "loading"}>
              <Icon
                name={tgStatus === "ok" ? "CheckCircle" : tgStatus === "err" ? "AlertCircle" : "Send"}
                size={15}
                color={tgStatus === "ok" ? "#27ae60" : tgStatus === "err" ? "hsl(var(--destructive))" : "hsl(var(--quest-gold))"}
              />
            </button>
            <button className="p-1.5 rounded hover:bg-secondary" onClick={onClose}>
              <Icon name="X" size={16} color="hsl(var(--muted-foreground))" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <button
            className="flex-1 py-2.5 font-oswald text-xs tracking-wider uppercase transition-colors"
            style={{ color: activeTab === "quests" ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))", borderBottom: activeTab === "quests" ? "2px solid hsl(var(--quest-gold))" : "2px solid transparent" }}
            onClick={() => setActiveTab("quests")}>
            <Icon name="ScrollText" size={13} />
            <span className="ml-1">Квесты</span>
          </button>
          <button
            className="flex-1 py-2.5 font-oswald text-xs tracking-wider uppercase transition-colors relative"
            style={{ color: activeTab === "proofs" ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))", borderBottom: activeTab === "proofs" ? "2px solid hsl(var(--quest-gold))" : "2px solid transparent" }}
            onClick={() => setActiveTab("proofs")}>
            <Icon name="ClipboardCheck" size={13} />
            <span className="ml-1">Заявки</span>
            {pendingCount > 0 && (
              <span className="absolute top-1.5 right-2 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--destructive))", color: "#fff" }}>{pendingCount}</span>
            )}
          </button>
        </div>

        {activeTab === "quests" && (
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
        )}

        {activeTab === "proofs" && (
          <div className="flex-1 overflow-y-auto p-3">
            <span className="font-oswald text-xs tracking-widest uppercase text-muted-foreground">Статус</span>
            <div className="flex gap-1 mt-2">
              {(["pending", "approved", "rejected"] as const).map(s => (
                <button key={s}
                  className="flex-1 py-1 rounded font-oswald text-[10px] tracking-wider uppercase transition-colors"
                  style={{ background: proofsTab === s ? "hsl(var(--quest-gold) / 0.15)" : "transparent", color: proofsTab === s ? "hsl(var(--quest-gold))" : "hsl(var(--muted-foreground))", border: `1px solid ${proofsTab === s ? "hsl(var(--quest-gold) / 0.5)" : "hsl(var(--border))"}` }}
                  onClick={() => setProofsTab(s)}>
                  {s === "pending" ? "Ждут" : s === "approved" ? "Принятые" : "Откл."}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main area — Proofs tab */}
      {activeTab === "proofs" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b px-6 py-4 flex items-center gap-3" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
            <Icon name="ClipboardCheck" size={20} color="hsl(var(--quest-gold))" />
            <div>
              <h3 className="font-cinzel text-base font-bold">Заявки на проверку</h3>
              <p className="font-crimson text-xs text-muted-foreground italic">Доказательства выполнения квестов от игроков</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {proofsLoading ? (
              <div className="text-center py-20">
                <p className="font-crimson text-sm italic text-muted-foreground animate-pulse">Загрузка заявок...</p>
              </div>
            ) : proofs.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Icon name="ClipboardCheck" size={40} color="hsl(var(--muted-foreground))" />
                <p className="font-crimson text-sm mt-3 italic">
                  {proofsTab === "pending" ? "Нет заявок, ожидающих проверки" : proofsTab === "approved" ? "Нет принятых заявок" : "Нет отклонённых заявок"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 max-w-3xl">
                {proofs.map(proof => {
                  const isImage = proof.proof_url && !proof.proof_url.match(/\.(mp4|mov|webm)$/i);
                  const rarityColor = { common: "#aaa", rare: "#2980b9", epic: "#8e44ad" }[proof.rarity] ?? "#aaa";
                  return (
                    <div key={proof.id} className="parchment-bg rounded border overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
                      <div className="flex gap-4 p-4">
                        {/* Превью */}
                        {proof.proof_url && (
                          <a href={proof.proof_url} target="_blank" rel="noreferrer" className="flex-shrink-0">
                            {isImage ? (
                              <img src={proof.proof_url} alt="proof" className="w-24 h-24 object-cover rounded border" style={{ borderColor: "hsl(var(--border))" }} />
                            ) : (
                              <div className="w-24 h-24 rounded border flex items-center justify-center" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted))" }}>
                                <Icon name="Video" size={28} color="hsl(var(--muted-foreground))" />
                              </div>
                            )}
                          </a>
                        )}
                        {/* Инфо */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <Icon name={proof.icon} size={16} fallback="Star" color={rarityColor} />
                              <span className="font-cinzel text-sm font-semibold truncate">{proof.quest_title}</span>
                              <span className={`text-[10px] font-oswald tracking-widest uppercase px-1.5 py-0.5 rounded border badge-${proof.rarity}`}>{proof.rarity}</span>
                            </div>
                            <span className="font-oswald text-xs flex-shrink-0" style={{ color: "hsl(var(--quest-gold))" }}>+{proof.xp} XP</span>
                          </div>
                          <p className="font-oswald text-sm font-semibold mb-0.5">{proof.player_nick}</p>
                          {proof.completed_at && (
                            <p className="text-[11px] font-crimson text-muted-foreground">
                              {new Date(proof.completed_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                          {proof.proof_url && (
                            <a href={proof.proof_url} target="_blank" rel="noreferrer"
                              className="text-[11px] font-crimson underline mt-1 inline-block" style={{ color: "hsl(var(--quest-gold))" }}>
                              Открыть {isImage ? "скриншот" : "видео"}
                            </a>
                          )}
                        </div>
                      </div>
                      {/* Кнопки действий */}
                      {proofsTab === "pending" && (
                        <div className="flex border-t" style={{ borderColor: "hsl(var(--border))" }}>
                          <button
                            className="flex-1 py-2.5 font-oswald text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                            style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}
                            onClick={() => approveProof(proof, "reject")}>
                            <Icon name="X" size={14} />
                            Отклонить
                          </button>
                          <div className="w-px" style={{ background: "hsl(var(--border))" }} />
                          <button
                            className="flex-1 py-2.5 font-oswald text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                            style={{ background: "hsl(var(--quest-gold) / 0.15)", color: "hsl(var(--quest-gold))" }}
                            onClick={() => approveProof(proof, "approve")}>
                            <Icon name="Check" size={14} />
                            Принять
                          </button>
                        </div>
                      )}
                      {proofsTab !== "pending" && (
                        <div className="px-4 py-2 border-t flex items-center gap-2" style={{ borderColor: "hsl(var(--border))" }}>
                          <Icon name={proofsTab === "approved" ? "CheckCircle" : "XCircle"} size={14} color={proofsTab === "approved" ? "#27ae60" : "hsl(var(--destructive))"} />
                          <span className="font-oswald text-xs tracking-wider uppercase" style={{ color: proofsTab === "approved" ? "#27ae60" : "hsl(var(--destructive))" }}>
                            {proofsTab === "approved" ? "Принято" : "Отклонено"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main area — Quests tab */}
      {activeTab === "quests" && <div className="flex-1 flex flex-col overflow-hidden">
        {editingBranch && (
          <div className="border-b p-4 flex items-end gap-3 flex-wrap animate-fade-in"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
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
                        <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--muted))" }}>
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
      </div>}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "hsl(var(--background) / 0.5)" }}>
          <div className="font-cinzel text-sm animate-pulse" style={{ color: "hsl(var(--quest-gold))" }}>Сохранение...</div>
        </div>
      )}
    </div>
  );
}