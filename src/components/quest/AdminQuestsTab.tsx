import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Branch, Quest } from "./types";
import AdminQuestFormCard, { RarityBadge } from "./AdminQuestFormCard";

const ICONS = ["Star", "Sword", "Shield", "Target", "Swords", "Moon", "MapPin", "Map", "Anchor", "Globe", "Compass", "Wrench", "FlaskConical", "Sparkles", "Crown", "Trophy", "UserPlus", "ShoppingBag", "Flag", "Hammer", "Users", "Gift", "Zap", "Flame", "Heart"];
const COLORS = ["#c0392b", "#2980b9", "#8e44ad", "#27ae60", "#e67e22", "#16a085", "#d35400", "#2c3e50", "#c0a830"];

interface AdminQuestsTabProps {
  currentBranch: Branch | null;
  editingBranch: Branch | null;
  editingQuest: Quest | null;
  branchForm: Partial<Branch>;
  form: Partial<Quest>;
  setBranchForm: (fn: (p: Partial<Branch>) => Partial<Branch>) => void;
  setForm: (fn: (p: Partial<Quest>) => Partial<Quest>) => void;
  onSaveBranch: (b: Branch) => void;
  onCancelBranch: () => void;
  onAddQuest: () => void;
  onSaveNewQuest: () => void;
  onSaveQuest: (q: Quest) => void;
  onCancelQuest: () => void;
  onStartEditQuest: (q: Quest) => void;
  onRemoveQuest: (q: Quest) => void;
  onReorderQuests: (ids: number[]) => void;
}

export default function AdminQuestsTab({
  currentBranch, editingBranch, editingQuest,
  branchForm, form,
  setBranchForm, setForm,
  onSaveBranch, onCancelBranch,
  onAddQuest, onSaveNewQuest, onSaveQuest, onCancelQuest,
  onStartEditQuest, onRemoveQuest, onReorderQuests,
}: AdminQuestsTabProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const quests = currentBranch?.quests ?? [];

  const handleDragStart = (idx: number, e: React.DragEvent<HTMLDivElement>) => {
    setDragIdx(idx);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.style.opacity = "0.4";
  };

  const handleDragEnd = () => {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const reordered = [...quests];
      const [moved] = reordered.splice(dragIdx, 1);
      reordered.splice(overIdx, 0, moved);
      onReorderQuests(reordered.map(q => q.id));
    }
    setDragIdx(null);
    setOverIdx(null);
    dragNode.current = null;
  };

  const handleDragOver = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overIdx !== idx) setOverIdx(idx);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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
              onClick={onCancelBranch}>Отмена</button>
            <button className="px-3 py-1.5 rounded font-oswald text-xs tracking-wider uppercase"
              style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}
              onClick={() => onSaveBranch(editingBranch)}>Сохранить</button>
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
                onClick={onAddQuest}>
                <Icon name="Plus" size={15} color="hsl(var(--primary-foreground))" />
                Добавить квест
              </button>
            </div>

            <div className="grid gap-3 max-w-2xl">
              {editingQuest?.id === 0 && (
                <AdminQuestFormCard form={form} setForm={setForm} onSave={onSaveNewQuest} onCancel={onCancelQuest} isNew />
              )}
              {quests.map((q, idx) => (
                <div key={q.id}>
                  {editingQuest?.id === q.id ? (
                    <AdminQuestFormCard form={form} setForm={setForm} onSave={() => onSaveQuest(q)} onCancel={onCancelQuest} />
                  ) : (
                    <div
                      draggable
                      onDragStart={e => handleDragStart(idx, e)}
                      onDragEnd={handleDragEnd}
                      onDragOver={e => handleDragOver(idx, e)}
                      className={`parchment-bg rounded border p-3 flex items-start gap-3 group cursor-grab active:cursor-grabbing transition-all ${
                        dragIdx !== null && overIdx === idx && dragIdx !== idx
                          ? "border-dashed scale-[1.02]"
                          : ""
                      }`}
                      style={{
                        borderColor: dragIdx !== null && overIdx === idx && dragIdx !== idx
                          ? "hsl(var(--quest-gold))"
                          : "hsl(var(--border))",
                      }}>
                      <div className="flex-shrink-0 flex flex-col items-center justify-center text-muted-foreground mr-0.5 select-none">
                        <Icon name="GripVertical" size={16} color="hsl(var(--muted-foreground))" />
                      </div>
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
                        <button className="p-1.5 rounded hover:bg-secondary" onClick={() => onStartEditQuest(q)}>
                          <Icon name="Pencil" size={14} color="hsl(var(--quest-gold))" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-secondary" onClick={() => onRemoveQuest(q)}>
                          <Icon name="Trash2" size={14} color="hsl(var(--destructive))" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {quests.length === 0 && editingQuest?.id !== 0 && (
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
  );
}
