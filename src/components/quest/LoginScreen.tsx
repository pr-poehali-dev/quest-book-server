import { useState, useEffect, useRef } from "react";

interface LoginScreenProps {
  onLogin: (nick: string) => void;
  onAdmin: (key: string) => Promise<boolean>;
}

const FloatingParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; size: number; speed: number; opacity: number; drift: number; phase: number }[] = [];
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speed: Math.random() * 0.4 + 0.15,
        opacity: Math.random() * 0.5 + 0.1,
        drift: Math.random() * 0.5 - 0.25,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y -= p.speed;
        p.x += Math.sin(p.phase) * p.drift;
        p.phase += 0.01;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        gradient.addColorStop(0, `hsla(43, 74%, 58%, ${p.opacity})`);
        gradient.addColorStop(1, `hsla(43, 74%, 58%, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", handleResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", handleResize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

export default function LoginScreen({ onLogin, onAdmin }: LoginScreenProps) {
  const [nick, setNick] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 vignette relative">
      <FloatingParticles />

      <div className="w-full max-w-sm animate-scale-in relative z-10">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute -inset-3 rounded-2xl animate-breathe"
              style={{ background: "radial-gradient(circle, hsl(var(--quest-gold) / 0.15) 0%, transparent 70%)" }} />
            <img
              src="https://cdn.poehali.dev/projects/d5e86919-d370-406c-a721-817de003fa32/files/2aaf2152-2c19-4345-9b41-e69234d4b1e1.jpg"
              alt="Quest Book RPM"
              className="relative w-28 h-28 object-cover rounded-lg border-2"
              style={{ borderColor: "hsl(var(--quest-gold) / 0.5)", boxShadow: "0 0 30px hsl(var(--quest-gold) / 0.2), 0 8px 32px hsl(0 0% 0% / 0.4)" }}
            />
          </div>
          <h1 className="font-cinzel text-4xl font-black mb-2 gold-shimmer text-glow">Quest Book RPM</h1>
          <p className="font-crimson text-lg italic text-muted-foreground">Книга Мэрии RPM</p>

          <div className="diamond-divider mt-4 max-w-[200px] mx-auto">
            <div className="diamond" />
          </div>
        </div>

        <div className="parchment-bg rounded-lg border p-6 corner-decor" style={{ borderColor: "hsl(var(--quest-gold) / 0.35)" }}>
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
                className="w-full bg-transparent border rounded px-3 py-2.5 font-crimson text-base mb-5 outline-none transition-all duration-300"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                autoFocus
              />
              <button
                disabled={!nick.trim()}
                onClick={() => nick.trim() && onLogin(nick.trim())}
                className="w-full py-3 rounded font-cinzel text-sm font-bold tracking-widest uppercase transition-all duration-200 disabled:opacity-40 hover:opacity-90 hover:shadow-lg"
                style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))", boxShadow: nick.trim() ? "0 4px 16px hsl(var(--quest-gold) / 0.3)" : "none" }}
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
                onChange={e => { setAdminKey(e.target.value); setAdminError(false); }}
                onKeyDown={async e => {
                  if (e.key === "Enter" && adminKey && !adminLoading) {
                    setAdminLoading(true);
                    const success = await onAdmin(adminKey);
                    if (!success) { setAdminError(true); setAdminLoading(false); }
                  }
                }}
                className="w-full bg-transparent border rounded px-3 py-2.5 font-crimson text-base outline-none transition-all duration-300"
                style={{ borderColor: adminError ? "hsl(0 70% 50%)" : "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                autoFocus
              />
              {adminError && (
                <p className="font-crimson text-sm mt-1.5 mb-3 animate-fade-in" style={{ color: "hsl(0 70% 50%)" }}>Неверный пароль</p>
              )}
              {!adminError && <div className="mb-5" />}
              <button
                disabled={!adminKey || adminLoading}
                onClick={async () => {
                  if (!adminKey || adminLoading) return;
                  setAdminLoading(true);
                  const success = await onAdmin(adminKey);
                  if (!success) { setAdminError(true); setAdminLoading(false); }
                }}
                className="w-full py-3 rounded font-cinzel text-sm font-bold tracking-widest uppercase transition-all duration-200 disabled:opacity-40 hover:opacity-90"
                style={{ background: "hsl(var(--quest-gold))", color: "hsl(var(--primary-foreground))", boxShadow: adminKey ? "0 4px 16px hsl(var(--quest-gold) / 0.3)" : "none" }}
              >
                {adminLoading ? "Проверка..." : "Войти в админку"}
              </button>
            </>
          )}
        </div>

        <button
          className="w-full mt-3 py-2 font-oswald text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors duration-300"
          onClick={() => setAdminMode(m => !m)}
        >
          {adminMode ? "← Вернуться" : "Вход для администратора"}
        </button>

        <p className="text-center mt-6 font-crimson text-xs text-muted-foreground/40 italic">
          «Каждое великое путешествие начинается с первого шага»
        </p>
      </div>
    </div>
  );
}
