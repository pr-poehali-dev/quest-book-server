import { useState, useEffect, useCallback } from "react";
import { apiFetch, Branch } from "@/components/quest/types";
import LoginScreen from "@/components/quest/LoginScreen";
import AdminPanel from "@/components/quest/AdminPanel";
import QuestBook from "@/components/quest/QuestBook";

export default function Index() {
  const [player, setPlayer] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBranches = useCallback(async () => {
    const data = await apiFetch("/");
    setBranches(Array.isArray(data) ? data : []);
  }, []);

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

  if (!player && !showAdmin) {
    return <LoginScreen onLogin={handleLogin} onAdmin={handleAdmin} />;
  }

  if (showAdmin && adminKey) {
    return (
      <AdminPanel
        branches={branches}
        adminKey={adminKey}
        onRefresh={loadBranches}
        onClose={() => { setShowAdmin(false); setAdminKey(null); }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-cinzel text-lg animate-pulse" style={{ color: "hsl(var(--quest-gold))" }}>Загрузка книги...</p>
      </div>
    );
  }

  return (
    <QuestBook
      player={player ?? ""}
      branches={branches}
      completedIds={completedIds}
      onLogout={() => setPlayer(null)}
    />
  );
}