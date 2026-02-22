import Icon from "@/components/ui/icon";
import { Rarity } from "./types";

export interface ProofEntry {
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

interface AdminProofsTabProps {
  proofs: ProofEntry[];
  proofsTab: "pending" | "approved" | "rejected";
  proofsLoading: boolean;
  onApprove: (proof: ProofEntry, action: "approve" | "reject") => void;
}

export default function AdminProofsTab({ proofs, proofsTab, proofsLoading, onApprove }: AdminProofsTabProps) {
  return (
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
                  {proofsTab === "pending" && (
                    <div className="flex border-t" style={{ borderColor: "hsl(var(--border))" }}>
                      <button
                        className="flex-1 py-2.5 font-oswald text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                        style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}
                        onClick={() => onApprove(proof, "reject")}>
                        <Icon name="X" size={14} />
                        Отклонить
                      </button>
                      <div className="w-px" style={{ background: "hsl(var(--border))" }} />
                      <button
                        className="flex-1 py-2.5 font-oswald text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                        style={{ background: "hsl(var(--quest-gold) / 0.15)", color: "hsl(var(--quest-gold))" }}
                        onClick={() => onApprove(proof, "approve")}>
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
  );
}
