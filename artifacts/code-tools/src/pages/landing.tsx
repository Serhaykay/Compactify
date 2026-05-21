import * as React from "react";
import { Link } from "wouter";
import { SplitSquareHorizontal, Wand2, Minimize2, ArrowRight, Code2 } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   Canvas 2D particle-network animation
   Works everywhere — no WebGL / GPU required
───────────────────────────────────────────────────────────────── */
const PARTICLE_COUNT = 150;
const CONNECT_DIST   = 120;   // px
const SPEED          = 0.35;

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;   // radius
  alpha: number;
}

function useParticleNetwork(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const particles: Particle[] = [];
    let mx = -9999, my = -9999;
    let raf = 0;

    const resize = () => {
      w = canvas.width  = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };

    const spawn = () => {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * SPEED,
          vy: (Math.random() - 0.5) * SPEED,
          r: Math.random() < 0.12 ? 2.2 : 1.2,
          alpha: 0.5 + Math.random() * 0.5,
        });
      }
    };

    resize();
    spawn();

    const onResize = () => { resize(); };
    const onMouse  = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const onLeave  = () => { mx = -9999; my = -9999; };
    window.addEventListener("resize",      onResize);
    window.addEventListener("mousemove",   onMouse);
    window.addEventListener("mouseleave",  onLeave);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);

      /* move particles */
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      /* connections */
      ctx.lineWidth = 0.7;
      for (let a = 0; a < particles.length; a++) {
        const pa = particles[a];
        for (let b = a + 1; b < particles.length; b++) {
          const pb = particles[b];
          const dx = pa.x - pb.x, dy = pa.y - pb.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            const t = 1 - d / CONNECT_DIST;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59,130,246,${t * 0.45})`;
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }

        /* mouse proximity glow */
        const mdx = pa.x - mx, mdy = pa.y - my;
        const md  = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < CONNECT_DIST * 1.4) {
          const t = 1 - md / (CONNECT_DIST * 1.4);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(147,197,253,${t * 0.35})`;
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
      }

      /* dots */
      for (const p of particles) {
        const isStar = p.r > 1.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = isStar
          ? `rgba(255,255,255,${p.alpha})`
          : `rgba(96,165,250,${p.alpha})`;
        if (isStar) {
          ctx.shadowBlur  = 6;
          ctx.shadowColor = "rgba(147,197,253,0.8)";
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize",     onResize);
      window.removeEventListener("mousemove",  onMouse);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);
}

/* ─────────────────────────────────────────────────────────────────
   Feature data
───────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: SplitSquareHorizontal,
    title: "Code Diff",
    href: "/diff",
    desc: "Side-by-side or inline diff viewer with syntax highlighting. Hover any highlighted line to see a word-level explanation of exactly what changed.",
    tags: ["Side-by-side", "Inline mode", "Hover tooltips", "Whitespace-aware"],
  },
  {
    icon: Wand2,
    title: "Beautify / Minify",
    href: "/beautify",
    desc: "Auto-formats code the moment you paste it, then shows a full-screen highlighted output. 12 fine-grained options, or one-click minify to strip whitespace and comments.",
    tags: ["Auto-format", "Syntax highlight", "12 options", "Safe minifier"],
  },
];

const LANG_BADGES = ["JavaScript", "TypeScript", "HTML", "CSS", "JSON", "Python", "Java"];

/* ─────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  useParticleNetwork(canvasRef);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ minHeight: "100dvh", background: "#000" }}
    >
      {/* animated canvas — fills background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />

      {/* soft central glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 48%, rgba(37,99,235,0.09) 0%, transparent 70%)",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-20 min-h-[100dvh] text-center">

        {/* eyebrow */}
        <div
          className="flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase mb-7 px-4 py-1.5 rounded-full"
          style={{
            color: "rgba(147,197,253,0.75)",
            border: "1px solid rgba(59,130,246,0.2)",
            background: "rgba(59,130,246,0.06)",
          }}
        >
          <Code2 className="w-3.5 h-3.5" />
          Developer Code Utilities
        </div>

        {/* hero title */}
        <h1
          className="font-dancing font-bold leading-none select-none mb-5"
          style={{
            fontSize: "clamp(3.8rem, 11vw, 8.5rem)",
            background: "linear-gradient(140deg, #93c5fd 0%, #ffffff 48%, #93c5fd 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 45px rgba(59,130,246,0.4))",
          }}
        >
          Compactify
        </h1>

        {/* sub-headline */}
        <p
          className="text-lg md:text-xl font-light mb-3 max-w-lg"
          style={{ color: "rgba(219,234,254,0.72)" }}
        >
          Format, compare, and compress code — beautifully.
        </p>
        <p
          className="text-sm mb-14 max-w-[38rem] leading-relaxed"
          style={{ color: "rgba(147,197,253,0.42)" }}
        >
          Two precision tools for developers: a smart diff viewer and a
          configurable code beautifier, both with full syntax highlighting and
          designed for daily use.
        </p>

        {/* feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl mb-12">
          {FEATURES.map(({ icon: Icon, title, href, desc, tags }) => (
            <Link key={href} href={href}>
              <div
                className="group relative rounded-2xl p-6 text-left transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(59,130,246,0.14)",
                  backdropFilter: "blur(14px)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background    = "rgba(59,130,246,0.07)";
                  el.style.borderColor   = "rgba(96,165,250,0.32)";
                  el.style.boxShadow     = "0 0 30px rgba(37,99,235,0.12)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background    = "rgba(255,255,255,0.025)";
                  el.style.borderColor   = "rgba(59,130,246,0.14)";
                  el.style.boxShadow     = "none";
                }}
              >
                {/* status dot */}
                <div
                  className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#3b82f6",
                    boxShadow: "0 0 7px #3b82f6",
                  }}
                />

                <div
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg mb-4"
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.18)",
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" style={{ color: "#60a5fa" }} />
                </div>

                <h2
                  className="text-base font-semibold mb-2"
                  style={{ color: "rgba(219,234,254,0.92)" }}
                >
                  {title}
                </h2>
                <p
                  className="text-sm leading-relaxed mb-4"
                  style={{ color: "rgba(147,197,253,0.5)" }}
                >
                  {desc}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        color: "rgba(147,197,253,0.65)",
                        background: "rgba(59,130,246,0.07)",
                        border: "1px solid rgba(59,130,246,0.13)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: "rgba(96,165,250,0.5)" }}
                >
                  Open tool <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link href="/diff">
          <button
            className="flex items-center gap-3 px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
              color: "#eff6ff",
              border: "1px solid rgba(96,165,250,0.35)",
              boxShadow: "0 0 28px rgba(37,99,235,0.4), 0 1px 0 rgba(255,255,255,0.06) inset",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.boxShadow   = "0 0 44px rgba(37,99,235,0.6), 0 1px 0 rgba(255,255,255,0.08) inset";
              el.style.transform   = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.boxShadow   = "0 0 28px rgba(37,99,235,0.4), 0 1px 0 rgba(255,255,255,0.06) inset";
              el.style.transform   = "translateY(0)";
            }}
          >
            <Minimize2 className="w-4 h-4" />
            Launch App
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>

        {/* language badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-12">
          {LANG_BADGES.map((lang) => (
            <span
              key={lang}
              className="text-xs px-3 py-1 rounded-full font-mono"
              style={{
                color: "rgba(147,197,253,0.35)",
                border: "1px solid rgba(59,130,246,0.1)",
              }}
            >
              {lang}
            </span>
          ))}
        </div>

        {/* footer note */}
        <p className="mt-8 text-xs" style={{ color: "rgba(96,165,250,0.22)" }}>
          Runs entirely in your browser — no server, no tracking.
        </p>
      </div>
    </div>
  );
}
