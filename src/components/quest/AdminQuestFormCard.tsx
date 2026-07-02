import Icon from "@/components/ui/icon";
import { Quest, Rarity } from "./types";

const ICONS_LIST = ["Star", "Sword", "Shield", "Target", "Swords", "Moon", "MapPin", "Map", "Anchor", "Globe", "Compass", "Wrench", "FlaskConical", "Sparkles", "Crown", "Trophy", "UserPlus", "ShoppingBag", "Flag", "Hammer", "Zap", "Flame", "Heart", "Gift"];

export const RarityBadge = ({ rarity }: { rarity: Rarity }) => {
  const labels = { common: "Обычный", rare: "Редкий", epic: "Легендарный" };
  return (
    <span className={`text-[10px] font-oswald tracking-widest uppercase px-2 py-0.5 rounded border badge-${rarity}`}>
      {labels[rarity]}
    </span>
  );
};

interface QuestFormCardProps {
  form: Partial<Quest>;
  setForm: (fn: (p: Partial<Quest>) => Partial<Quest>) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew?: boolean;
}

export default function AdminQuestFormCard({ form, setForm, onSave, onCancel, isNew }: QuestFormCardProps) {
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
          <label className="block font-oswald text-[10px] tracking-wider uppercase text-muted-foreground mb-1">Редкость</label>
          <select className={inp} style={st} value={form.rarity ?? "common"} onChange={e => setForm(p => ({ ...p, rarity: e.target.value as Rarity }))}>
            <option value="common">Обычный</option>
            <option value="rare">Редкий</option>
            <option value="epic">Легендарный</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 accent-amber-600 rounded"
              checked={!!form.unlocked}
              onChange={e => setForm(p => ({ ...p, unlocked: e.target.checked }))} />
            <span className="font-oswald text-[10px] tracking-wider uppercase text-muted-foreground">Открыт для всех</span>
            <span className="font-crimson text-[11px] text-muted-foreground italic ml-1">(не требует прохождения предыдущего)</span>
          </label>
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