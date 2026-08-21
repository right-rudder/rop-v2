"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

/**
 * The signature: a radar scope watching for flight schools. Concentric range
 * rings and compass ticks around the sectional-chart airport glyph, a rotating
 * sweep, and seeded "contacts" that ping as the sweep crosses them.
 *
 * Stroke color comes from `currentColor` — set text-accent on it. Callers
 * size and position the root (it must be positioned: every call site passes
 * `absolute`). Rings grow in on mount (.ring-in).
 *
 * With `animate` (default) the scope is live: sweep + pings run in CSS;
 * contacts fade in and out at random, each tagged with an airport code
 * (`codes`, or a built-in ICAO list) that shows when the cursor locks it or
 * when a random reveal picks it. A single rAF-throttled pointermove on window
 * drives a parallax drift, a cursor reticle inside the scope, and the lock.
 * Under prefers-reduced-motion everything but the CSS rings is skipped; on
 * no-hover devices only the pointer logic is skipped. `animate={false}`
 * keeps the scope "in use" — sweep and pings still run in CSS — but drops
 * the grow-in, the contact lifecycle, labels, timers and listeners.
 */

const SIZE = 720;
const C = SIZE / 2;
const RINGS = [90, 170, 250, 330];
const OUTER = RINGS[RINGS.length - 1];
const CONTACT_COUNT = 16;
const DETECT_RADIUS = 90; // viewBox units around the cursor that light a contact
const PARALLAX_PX = 14;
const MIN_ON = 6;
const MAX_ON = 13;
const LABEL_MS = 2400;
const MAX_LABELS = 2;

/** Fallback codes for surfaces that can't fetch (error.tsx is a client component). */
const DEFAULT_CODES = [
  "KFFZ", "KDVT", "KPHX", "KCHD", "KTUS", "KCPS", "KSTL", "KMKC", "KOJC",
  "KIXD", "KFXE", "KOPF", "KPMP", "KMYF", "KCRQ", "KLAX", "KBNA", "KCHA",
];

/** Tiny seeded PRNG so server and client lay out identical contacts. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Contact = { x: number; y: number; bearing: number; r: number; on: boolean };

const CONTACTS: Contact[] = (() => {
  const rnd = mulberry32(1013);
  const out: Contact[] = [];
  for (let i = 0; i < CONTACT_COUNT; i++) {
    const bearing = rnd() * 360; // clockwise from north, matches the sweep
    const dist = 56 + Math.sqrt(rnd()) * (OUTER - 76); // sqrt → even area spread
    const rad = ((bearing - 90) * Math.PI) / 180;
    out.push({
      x: +(C + Math.cos(rad) * dist).toFixed(1),
      y: +(C + Math.sin(rad) * dist).toFixed(1),
      bearing: +bearing.toFixed(1),
      r: +(3 + rnd() * 2.2).toFixed(1),
      on: rnd() < 0.66,
    });
  }
  // Keep the seeded starting population inside the live range.
  let on = out.filter((c) => c.on).length;
  for (const c of out) {
    if (on >= MIN_ON) break;
    if (!c.on) {
      c.on = true;
      on++;
    }
  }
  for (const c of out) {
    if (on <= MAX_ON) break;
    if (c.on) {
      c.on = false;
      on--;
    }
  }
  return out;
})();

const TICKS = Array.from({ length: 36 }, (_, i) => i * 10);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export function SectionalMotif({
  className,
  animate = true,
  codes = DEFAULT_CODES,
}: {
  className?: string;
  animate?: boolean;
  /** Airport codes shown on contacts; cycled as contacts reappear. */
  codes?: string[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<SVGGElement>(null);
  const rangeRef = useRef<SVGLineElement>(null);
  const codeList = codes.length ? codes : DEFAULT_CODES;
  // Latest codes for the timers without restarting the lifecycle on re-render.
  const codesRef = useRef(codeList);
  useEffect(() => {
    codesRef.current = codeList;
  }, [codeList]);

  useEffect(() => {
    if (!animate) return;
    const root = rootRef.current;
    const scope = scopeRef.current;
    const reticle = reticleRef.current;
    const range = rangeRef.current;
    if (!root || !scope || !reticle || !range) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const contactEls = Array.from(root.querySelectorAll<SVGGElement>("[data-contact]"));
    const labelEls = contactEls.map((el) => el.querySelector<SVGTextElement>(".radar-label"));
    const on = CONTACTS.map((c) => c.on);
    const hot = CONTACTS.map(() => false);
    const labelT = CONTACTS.map(() => 0);
    const shown = new Set<string>();
    labelEls.forEach((el, i) => {
      if (on[i] && el?.textContent) shown.add(el.textContent);
    });
    const indices = CONTACTS.map((_, i) => i);

    const setHot = (i: number, v: boolean) => {
      if (hot[i] === v) return;
      hot[i] = v;
      contactEls[i].toggleAttribute("data-hot", v);
    };
    const clearLabel = (i: number) => {
      if (!labelT[i]) return;
      window.clearTimeout(labelT[i]);
      labelT[i] = 0;
      contactEls[i].removeAttribute("data-label");
    };
    const pickCode = () => {
      const all = codesRef.current;
      const free = all.filter((c) => !shown.has(c));
      return pick(free.length ? free : all);
    };
    const setOn = (i: number, v: boolean) => {
      on[i] = v;
      contactEls[i].toggleAttribute("data-on", v);
      const label = labelEls[i];
      if (v) {
        const code = pickCode();
        if (label) label.textContent = code;
        shown.add(code);
      } else {
        setHot(i, false);
        clearLabel(i);
        if (label?.textContent) shown.delete(label.textContent);
      }
    };

    // Contacts drift in and out of detection at random, within a live range.
    let lifeT = 0;
    const life = () => {
      const count = on.filter(Boolean).length;
      const candidates = indices.filter((i) =>
        on[i] ? count > MIN_ON && !hot[i] && !labelT[i] : count < MAX_ON,
      );
      if (candidates.length) {
        const i = pick(candidates);
        setOn(i, !on[i]);
      }
      lifeT = window.setTimeout(life, rand(900, 2200));
    };
    lifeT = window.setTimeout(life, rand(900, 2200));

    // Every few seconds a visible contact announces its code on its own.
    let revealT = 0;
    const reveal = () => {
      if (labelT.filter(Boolean).length < MAX_LABELS) {
        const candidates = indices.filter((i) => on[i] && !hot[i] && !labelT[i]);
        if (candidates.length) {
          const i = pick(candidates);
          contactEls[i].setAttribute("data-label", "");
          labelT[i] = window.setTimeout(() => {
            labelT[i] = 0;
            contactEls[i].removeAttribute("data-label");
          }, LABEL_MS);
        }
      }
      revealT = window.setTimeout(reveal, rand(2500, 4500));
    };
    revealT = window.setTimeout(reveal, rand(1200, 2500));

    // Pointer: parallax, reticle, lock. Skipped where there's no hover.
    let cleanupPointer: (() => void) | undefined;
    if (!window.matchMedia("(hover: none)").matches) {
      const target = { px: 0, py: 0, rx: C, ry: C };
      const cur = { px: 0, py: 0, rx: C, ry: C };
      let raf = 0;

      const tick = () => {
        raf = 0;
        const k = 0.14;
        cur.px += (target.px - cur.px) * k;
        cur.py += (target.py - cur.py) * k;
        cur.rx += (target.rx - cur.rx) * k;
        cur.ry += (target.ry - cur.ry) * k;

        scope.style.transform = `translate3d(${cur.px.toFixed(2)}px, ${cur.py.toFixed(2)}px, 0)`;
        reticle.setAttribute("transform", `translate(${cur.rx.toFixed(1)} ${cur.ry.toFixed(1)})`);
        range.setAttribute("x2", (C - cur.rx).toFixed(1));
        range.setAttribute("y2", (C - cur.ry).toFixed(1));

        const settled =
          Math.abs(target.px - cur.px) +
            Math.abs(target.py - cur.py) +
            Math.abs(target.rx - cur.rx) +
            Math.abs(target.ry - cur.ry) <
          0.1;
        if (!settled) raf = requestAnimationFrame(tick);
      };
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(tick);
      };

      const onMove = (e: PointerEvent) => {
        const rect = root.getBoundingClientRect();
        if (rect.width === 0) return;

        // Parallax: drift toward the cursor, normalized by viewport size.
        const nx = clamp((e.clientX - (rect.left + rect.width / 2)) / window.innerWidth, -1, 1);
        const ny = clamp((e.clientY - (rect.top + rect.height / 2)) / window.innerHeight, -1, 1);
        target.px = nx * PARALLAX_PX * 2;
        target.py = ny * PARALLAX_PX * 2;

        // Cursor in viewBox units; tracked only while inside the outer ring.
        const vx = ((e.clientX - rect.left) / rect.width) * SIZE;
        const vy = ((e.clientY - rect.top) / rect.height) * SIZE;
        const inside = Math.hypot(vx - C, vy - C) <= OUTER;
        root.toggleAttribute("data-tracking", inside);
        if (inside) {
          target.rx = vx;
          target.ry = vy;
        }
        for (let i = 0; i < CONTACTS.length; i++) {
          const c = CONTACTS[i];
          setHot(i, inside && on[i] && Math.hypot(c.x - vx, c.y - vy) < DETECT_RADIUS);
        }
        schedule();
      };

      const onLeave = () => {
        target.px = 0;
        target.py = 0;
        root.removeAttribute("data-tracking");
        for (let i = 0; i < hot.length; i++) setHot(i, false);
        schedule();
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("mouseleave", onLeave);
      cleanupPointer = () => {
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("mouseleave", onLeave);
        if (raf) cancelAnimationFrame(raf);
      };
    }

    return () => {
      window.clearTimeout(lifeT);
      window.clearTimeout(revealT);
      labelT.forEach((t) => t && window.clearTimeout(t));
      cleanupPointer?.();
    };
  }, [animate]);

  const ringIn = (i: number) =>
    animate ? { className: "ring-in", style: { "--i": i } as CSSProperties } : {};

  return (
    <div ref={rootRef} aria-hidden className={cn("text-accent", className)}>
      <div ref={scopeRef} className="absolute inset-0 will-change-transform">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} fill="none" className="absolute inset-0 h-full w-full">
          <g stroke="currentColor" strokeLinecap="round">
            {/* crosshairs */}
            <g strokeWidth="1" opacity="0.3" {...ringIn(2)}>
              <line x1={C} y1={C - OUTER} x2={C} y2={C - 28} />
              <line x1={C} y1={C + 28} x2={C} y2={C + OUTER} />
              <line x1={C - OUTER} y1={C} x2={C - 28} y2={C} />
              <line x1={C + 28} y1={C} x2={C + OUTER} y2={C} />
            </g>

            {/* range rings — outer solid, inner fine-dashed, one sectional dash */}
            {RINGS.map((r, i) => {
              const outer = i === RINGS.length - 1;
              return (
                <circle
                  key={r}
                  cx={C}
                  cy={C}
                  r={r}
                  strokeWidth={outer ? 1.5 : 1.25}
                  strokeDasharray={outer ? undefined : i === 1 ? "14 10" : "2 8"}
                  opacity={outer ? 0.9 : 0.8 - i * 0.15}
                  {...ringIn(i + 1)}
                />
              );
            })}

            {/* compass ticks on the outer ring */}
            <g strokeWidth="1.25" opacity="0.55" {...ringIn(5)}>
              {TICKS.map((deg) => (
                <line
                  key={deg}
                  x1={C}
                  y1={C - OUTER - 16}
                  x2={C}
                  y2={deg % 90 === 0 ? C - OUTER + 4 : deg % 30 === 0 ? C - OUTER - 4 : C - OUTER - 10}
                  transform={`rotate(${deg} ${C} ${C})`}
                />
              ))}
            </g>

            {/* contacts: airports on the scope */}
            <g {...ringIn(3)}>
              {CONTACTS.map((c, i) => {
                const right = c.x > C;
                return (
                  <g
                    key={i}
                    data-contact
                    data-on={c.on || !animate ? "" : undefined}
                    className="radar-contact"
                    style={{ "--a": c.bearing } as CSSProperties}
                  >
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={c.r}
                      fill="currentColor"
                      stroke="none"
                      opacity="0.5"
                      className="radar-blip"
                    />
                    <circle cx={c.x} cy={c.y} r={c.r + 8} strokeWidth="1" className="radar-lock" />
                    {animate && (
                      <text
                        className="radar-label font-mono"
                        x={right ? c.x - c.r - 10 : c.x + c.r + 10}
                        y={c.y + 4.5}
                        textAnchor={right ? "end" : "start"}
                        fontSize="13"
                        letterSpacing="0.1em"
                        fill="currentColor"
                        stroke="none"
                      >
                        {codeList[i % codeList.length]}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* cursor reticle: the visitor as a tracked contact */}
            {animate && (
              <g
                ref={reticleRef}
                className="radar-reticle"
                strokeWidth="1.5"
                transform={`translate(${C} ${C})`}
              >
                <line ref={rangeRef} x1="0" y1="0" x2="0" y2="0" strokeDasharray="3 6" opacity="0.6" />
                <path d="M-16 -8 V-16 H-8 M8 -16 H16 V-8 M16 8 V16 H8 M-8 16 H-16 V8" />
                <circle r="2.5" fill="currentColor" stroke="none" />
              </g>
            )}

            {/* airport glyph: our station */}
            <g strokeWidth="2.5" {...ringIn(0)}>
              <circle cx={C} cy={C} r="18" />
              <line x1={C} y1={C - 34} x2={C} y2={C - 20} />
              <line x1={C} y1={C + 20} x2={C} y2={C + 34} />
              <line x1={C - 34} y1={C} x2={C - 20} y2={C} />
              <line x1={C + 20} y1={C} x2={C + 34} y2={C} />
            </g>
          </g>
        </svg>

        <div className="radar-sweep" />
      </div>
    </div>
  );
}
