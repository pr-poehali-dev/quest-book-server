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
          <h1 className="stencil text-4xl mb-2 gold-shimmer text-glow" style={{ letterSpacing: "0.18em" }}>QUEST BOOK RPM</h1>
          <p className="font-oswald text-sm tracking-widest uppercase text-muted-foreground">Книга Армии RPM</p>

          <div className="chevron-divider mt-4 max-w-[220px] mx-auto">
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M1 9L7 1L13 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="parchment-bg riveted rounded p-6 camo-bg" style={{ borderColor: "hsl(var(--quest-gold) / 0.35)" }}>
          <div className="chevron-divider mb-5">
            <span className="font-oswald text-[10px] tracking-[0.3em] uppercase px-2">
              {adminMode ? "★ ШТАБ ★" : "★ ПРОПУСК ★"}
            </span>
          </div>

          {!adminMode ? (
            <>
              <label className="block font-oswald text-xs tracking-widest uppercase text-muted-foreground mb-2">Позывной</label>
              <input
                type="text"
                placeholder="БОЕЦ..."
                value={nick}
                onChange={e => setNick(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && nick.trim()) onLogin(nick.trim()); }}
                className="w-full bg-transparent border rounded-sm px-3 py-2.5 font-oswald text-base tracking-wider uppercase mb-5 outline-none transition-all duration-300"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                autoFocus
              />
              <button
                disabled={!nick.trim()}
                onClick={() => { if (nick.trim()) onLogin(nick.trim()); }}
                className="btn-military-gold w-full py-3 rounded-sm stencil text-sm transition-all duration-200 disabled:opacity-40"
              >
                ★ Заступить на службу ★
              </button>
            </>
          ) : (
            <>
              <label className="block font-oswald text-xs tracking-widest uppercase text-muted-foreground mb-2">Код доступа</label>
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
                className="w-full bg-transparent border rounded-sm px-3 py-2.5 font-oswald text-base tracking-wider outline-none transition-all duration-300"
                style={{ borderColor: adminError ? "hsl(0 70% 50%)" : "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                autoFocus
              />
              {adminError && (
                <p className="font-oswald text-xs tracking-wider uppercase mt-1.5 mb-3 animate-fade-in" style={{ color: "hsl(0 70% 50%)" }}>⚠ Доступ запрещён</p>
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
                className="btn-military-gold w-full py-3 rounded-sm stencil text-sm transition-all duration-200 disabled:opacity-40"
              >
                {adminLoading ? "Проверка..." : "★ Вход в Штаб ★"}
              </button>
            </>
          )}
        </div>

        <button
          className="w-full mt-3 py-2 font-oswald text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-300"
          onClick={() => setAdminMode(m => !m)}
        >
          {adminMode ? "◄ Назад в строй" : "[ Командование ]"}
        </button>

        <p className="text-center mt-6 font-oswald text-[10px] tracking-[0.3em] uppercase text-muted-foreground/40">
          ★ ВЕРНОСТЬ · ДОЛГ · ЧЕСТЬ ★
        </p>
      </div>
    </div>
  );
}