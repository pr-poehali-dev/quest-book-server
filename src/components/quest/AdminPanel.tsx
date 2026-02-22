import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Branch, Quest, apiFetch } from "./types";
import { ProofEntry } from "./AdminProofsTab";
import AdminProofsTab from "./AdminProofsTab";
import AdminQuestsTab from "./AdminQuestsTab";

type AdminTab = "quests" | "proofs";

interface AdminPanelProps {
  branches: Branch[];
  adminKey: string;
  onRefresh: () => void;
  onClose: () => void;
}

export default function AdminPanel({ branches, adminKey, onRefresh, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("quests");
  const [tgStatus, setTgStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [tgError, setTgError] = useState<string | null>(null);

  const setupTelegram = async () => {
    setTgStatus("loading");
    setTgError(null);
    try {
      const res = await apiFetch("/tgsetup", { method: "POST" }, adminKey);
      if (res?.webhook_set) {
        setTgStatus("ok");
      } else {
        setTgStatus("err");
        setTgError(res?.error ?? "Проверь TELEGRAM_BOT_TOKEN в секретах");
      }
    } catch {
      setTgStatus("err");
      setTgError("Нет соединения с сервером");
    }
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

  useEffect(() => { loadPendingCount(); }, [loadPendingCount]);
  useEffect(() => { if (activeTab === "proofs") loadProofs(proofsTab); }, [activeTab, proofsTab, loadProofs]);

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
            <p className="font-crimson text-xs text-muted-foreground">
              {tgStatus === "ok" ? "✅ Telegram подключён" : tgStatus === "err" && tgError ? `⚠️ ${tgError}` : "Управление квестами"}
            </p>
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

      {/* Main area */}
      {activeTab === "proofs" && (
        <AdminProofsTab
          proofs={proofs}
          proofsTab={proofsTab}
          proofsLoading={proofsLoading}
          onApprove={approveProof}
        />
      )}

      {activeTab === "quests" && (
        <AdminQuestsTab
          currentBranch={currentBranch ?? null}
          editingBranch={editingBranch}
          editingQuest={editingQuest}
          branchForm={branchForm}
          form={form}
          setBranchForm={setBranchForm}
          setForm={setForm}
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

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "hsl(var(--background) / 0.5)" }}>
          <div className="font-cinzel text-sm animate-pulse" style={{ color: "hsl(var(--quest-gold))" }}>Сохранение...</div>
        </div>
      )}
    </div>
  );
}