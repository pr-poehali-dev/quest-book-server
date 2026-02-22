import { useState } from "react";

interface LoginScreenProps {
  onLogin: (nick: string) => void;
  onAdmin: (key: string) => void;
}

export default function LoginScreen({ onLogin, onAdmin }: LoginScreenProps) {
  const [nick, setNick] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [adminKey, setAdminKey] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <img
            src="https://cdn.poehali.dev/projects/d5e86919-d370-406c-a721-817de003fa32/files/2aaf2152-2c19-4345-9b41-e69234d4b1e1.jpg"
            alt="Quest Book"
            className="w-28 h-28 object-cover rounded-lg border-2 mx-auto mb-4"
            style={{ borderColor: "hsl(var(--quest-gold) / 0.5)", boxShadow: "0 0 30px hsl(var(--quest-gold) / 0.2)" }}
          />
          <h1 className="font-cinzel text-4xl font-black mb-2 gold-shimmer">Quest Book</h1>
          <p className="font-crimson text-lg italic text-muted-foreground">Книга приключений</p>
        </div>

        <div className="parchment-bg rounded-lg border p-6" style={{ borderColor: "hsl(var(--quest-gold) / 0.35)" }}>
          <div className="ornament mb-5"><span>{adminMode ? "АДМИНИСТРАТОР" : "ВХОД"}</span></div>

          {!adminMode ? (
            <>
              <label className="block font-oswald text-xs tracking-widest uppercase text-muted-foreground mb-2">Ваш ник</label>
              <input
                type="text"
                placeholder="Steve..."
                value={nick}
                onChange={e => setNick(e.target.value)}
                onKeyDown={e => e.key === "Enter" && nick.trim() && onLogin(nick.trim())}
                className="w-full bg-transparent border rounded px-3 py-2.5 font-crimson text-base mb-5 outline-none transition-colors"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                autoFocus
              />
              <button
                disabled={!nick.trim()}
                onClick={() => nick.trim() && onLogin(nick.trim())}
                className="w-full py-3 rounded font-cinzel text-sm font-bold tracking-widest uppercase transition-opacity disabled:opacity-40 hover:opacity-90"
                style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}
              >
                Открыть книгу
              </button>
            </>
          ) : (
            <>
              <label className="block font-oswald text-xs tracking-widest uppercase text-muted-foreground mb-2">Пароль</label>
              <input
                type="password"
                placeholder="••••••"
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
                onKeyDown={e => e.key === "Enter" && adminKey && onAdmin(adminKey)}
                className="w-full bg-transparent border rounded px-3 py-2.5 font-crimson text-base mb-5 outline-none"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                autoFocus
              />
              <button
                disabled={!adminKey}
                onClick={() => adminKey && onAdmin(adminKey)}
                className="w-full py-3 rounded font-cinzel text-sm font-bold tracking-widest uppercase transition-opacity disabled:opacity-40 hover:opacity-90"
                style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))" }}
              >
                Войти в админку
              </button>
            </>
          )}
        </div>

        <button
          className="w-full mt-3 py-2 font-oswald text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setAdminMode(m => !m)}
        >
          {adminMode ? "← Вернуться" : "Вход для администратора"}
        </button>
      </div>
    </div>
  );
}
