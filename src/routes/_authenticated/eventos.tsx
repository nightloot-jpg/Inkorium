import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Gamepad2,
  Heart,
  Landmark,
  MapPin,
  Music,
  PartyPopper,
  Search,
  Sparkles,
  Trophy,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

import { SideMenu } from "@/components/SideMenu";

export const Route = createFileRoute("/_authenticated/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos — nocturno" },
      {
        name: "description",
        content:
          "Conciertos, festivales, fiestas y quedadas: descubre los eventos a los que van tus amigos.",
      },
      { property: "og:title", content: "Eventos — nocturno" },
      {
        property: "og:description",
        content: "Conciertos, festivales, fiestas y quedadas con tus amigos en nocturno.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventosPage,
});

const CATEGORIES: { Icon: LucideIcon; label: string; count: string }[] = [
  { Icon: Music, label: "Conciertos", count: "124 eventos" },
  { Icon: Sparkles, label: "Festivales", count: "32 eventos" },
  { Icon: PartyPopper, label: "Fiestas", count: "47 eventos" },
  { Icon: Landmark, label: "Cultura", count: "26 eventos" },
  { Icon: Trophy, label: "Deporte", count: "18 eventos" },
  { Icon: Gamepad2, label: "Gaming", count: "15 eventos" },
  { Icon: MoreHorizontal, label: "Otros", count: "9 eventos" },
];

const RECOMMENDED: {
  title: string;
  when: string;
  place: string;
  people: number;
  color: string;
  day: string;
  month: string;
  Icon: LucideIcon;
}[] = [
  { title: "Concierto de Arde Bogotá", when: "Sábado, 25 Mayo · 21:00", place: "La Riviera, Madrid", people: 45, color: "linear-gradient(140deg, oklch(0.5 0.15 25), oklch(0.38 0.12 350))", day: "25", month: "MAY", Icon: Music },
  { title: "Festival Tomavistas 2026", when: "Viernes, 24 Mayo · 18:00", place: "Parque Tierno Galván, Madrid", people: 89, color: "linear-gradient(140deg, oklch(0.72 0.14 95), oklch(0.55 0.15 55))", day: "24", month: "MAY", Icon: Sparkles },
  { title: "Noche Remember 90s", when: "Sábado, 25 Mayo · 23:30", place: "Sala But, Madrid", people: 36, color: "linear-gradient(140deg, oklch(0.55 0.19 330), oklch(0.38 0.15 300))", day: "25", month: "MAY", Icon: PartyPopper },
  { title: "Partido: Real Madrid vs Barça", when: "Domingo, 26 Mayo · 18:30", place: "Santiago Bernabéu, Madrid", people: 102, color: "linear-gradient(140deg, oklch(0.6 0.15 150), oklch(0.42 0.12 190))", day: "26", month: "MAY", Icon: Trophy },
  { title: "Expo: Banksy Madrid", when: "Hasta 30 Mayo", place: "CentroCentro, Madrid", people: 27, color: "linear-gradient(140deg, oklch(0.48 0.06 20), oklch(0.32 0.04 40))", day: "30", month: "MAY", Icon: Landmark },
  { title: "Fiesta Universitaria", when: "Viernes, 24 Mayo · 00:00", place: "Sala Opium, Madrid", people: 76, color: "linear-gradient(140deg, oklch(0.52 0.16 290), oklch(0.38 0.14 265))", day: "24", month: "MAY", Icon: PartyPopper },
  { title: "Torneo FIFA 26", when: "Sábado, 25 Mayo · 16:00", place: "Game Center Madrid", people: 24, color: "linear-gradient(140deg, oklch(0.55 0.16 145), oklch(0.4 0.13 165))", day: "25", month: "MAY", Icon: Gamepad2 },
  { title: "Monólogos en Gran Vía", when: "Domingo, 26 Mayo · 21:00", place: "Teatro Capitol, Madrid", people: 31, color: "linear-gradient(140deg, oklch(0.42 0.06 260), oklch(0.3 0.05 280))", day: "26", month: "MAY", Icon: Sparkles },
];

const UPCOMING = [
  { title: "Concierto Indie en Madrid", when: "24 Mayo · 21:00", place: "La Riviera", dot: "oklch(0.6 0.2 20)" },
  { title: "Fiesta Universitaria", when: "24 Mayo · 00:00", place: "Sala Opium", dot: "oklch(0.75 0.15 70)" },
  { title: "Partido: Real Madrid vs Barça", when: "26 Mayo · 18:30", place: "Santiago Bernabéu", dot: "oklch(0.55 0.18 290)" },
  { title: "Monólogos en Gran Vía", when: "26 Mayo · 21:00", place: "Teatro Capitol", dot: "oklch(0.55 0.15 250)" },
];

const ATTENDING = [
  { name: "Bárbara", detail: "Asiste a 2 eventos" },
  { name: "alberto.andres.ri", detail: "Asiste a 1 evento" },
  { name: "Laura", detail: "Asiste a 1 evento" },
  { name: "Carlos1998", detail: "Asiste a 1 evento" },
  { name: "Pablo", detail: "Asiste a 1 evento" },
];

const POPULAR = ["Indie", "Electrónica", "Rock", "Pop", "Reggaeton", "Hip Hop", "Fiestas", "Deporte"];

const RANGES = ["Hoy", "Esta semana", "Este mes"];

function EventosPage() {
  const [range, setRange] = useState("Hoy");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);

  const toggleSave = (title: string) =>
    setSaved((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]));

  const list = RECOMMENDED.filter((e) =>
    e.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="t-shell min-h-screen">
      <main className="mx-auto grid max-w-6xl gap-3 px-3 py-4 lg:grid-cols-[230px_1fr_240px]">
        {/* Columna izquierda */}
        <aside className="space-y-3">
          <SideMenu active="eventos" />
        </aside>

        {/* Columna central */}
        <section className="space-y-3">
          <div className="t-panel p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-2">
                <Calendar size={22} className="mt-0.5 text-[var(--t-blue)]" />
                <div>
                  <h1 className="text-[16px] font-bold text-[var(--t-ink)]">Eventos</h1>
                  <p className="text-[11px] text-[var(--t-ink-soft)]">
                    Descubre conciertos, festivales, quedadas y mucho más.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="t-btn shrink-0"
                onClick={() => toast.success("Pronto podrás crear tus propios eventos")}
              >
                + Crear evento
              </button>
            </div>
          </div>

          <div className="t-panel p-3">
            <label className="flex items-center gap-2 border border-[var(--t-line)] px-2 py-1.5">
              <Search size={14} className="text-[var(--t-ink-soft)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar eventos, artistas, lugares..."
                className="w-full bg-transparent text-[12px] outline-none placeholder:text-[var(--t-ink-soft)]"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={
                    r === range
                      ? "t-btn"
                      : "border border-[var(--t-line)] bg-white px-3 py-1 text-[11px] text-[var(--t-ink)]"
                  }
                >
                  {r}
                </button>
              ))}
              <span className="border border-[var(--t-line)] bg-white px-3 py-1 text-[11px] text-[var(--t-ink-soft)]">
                Madrid
              </span>
              <span className="border border-[var(--t-line)] bg-white px-3 py-1 text-[11px] text-[var(--t-ink-soft)]">
                Todas las categorías
              </span>
            </div>
          </div>

          {/* Destacado */}
          <div className="t-panel overflow-hidden">
            <div
              className="p-4 text-white"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.35 0.12 290), oklch(0.45 0.15 330) 60%, oklch(0.4 0.12 25))",
              }}
            >
              <span className="bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Destacado
              </span>
              <h2 className="mt-2 text-[22px] font-bold leading-tight">Concierto Indie en Madrid</h2>
              <p className="text-[12px] opacity-90">
                Vetusta Morla · Love of Lesbian · Miss Caffeina
              </p>
              <ul className="mt-2 space-y-1 text-[11px] opacity-90">
                <li className="flex items-center gap-1.5">
                  <Calendar size={13} /> Viernes, 24 de Mayo de 2026
                </li>
                <li className="flex items-center gap-1.5">
                  <Clock size={13} /> 21:00
                </li>
                <li className="flex items-center gap-1.5">
                  <MapPin size={13} /> La Riviera, Madrid
                </li>
              </ul>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  className="border border-white/60 bg-white/15 px-3 py-1 text-[12px] font-bold"
                  onClick={() => toast.success("Te has apuntado al evento")}
                >
                  Ver evento
                </button>
                <span className="text-[11px] opacity-90">184 personas asistirán</span>
              </div>
            </div>
          </div>

          {/* Categorías */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {CATEGORIES.map((c) => (
              <button
                key={c.label}
                type="button"
                className="t-panel flex flex-col items-center gap-1 p-2 text-center"
                onClick={() => setQuery("")}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.93_0.03_245)]">
                  <c.Icon size={17} className="text-[var(--t-blue)]" />
                </span>
                <span className="text-[11px] font-bold text-[var(--t-ink)]">{c.label}</span>
                <span className="text-[10px] text-[var(--t-ink-soft)]">{c.count}</span>
              </button>
            ))}
          </div>

          {/* Recomendados */}
          <div className="t-panel">
            <div className="t-panel-head flex items-center justify-between">
              <h2 className="text-[15px] font-normal">Eventos recomendados</h2>
              <span className="t-link text-[11px]">Ver todos</span>
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
              {list.length === 0 ? (
                <p className="col-span-full py-6 text-center text-[12px] text-[var(--t-ink-soft)]">
                  No hay eventos que coincidan con tu búsqueda.
                </p>
              ) : (
                list.map((e) => (
                  <article key={e.title} className="border border-[var(--t-line)] bg-white">
                    <div
                      className="relative flex h-24 items-center justify-center"
                      style={{ background: e.color }}
                    >
                      <e.Icon size={30} className="text-white/45" aria-hidden />
                      <span className="absolute left-1.5 top-1.5 bg-white/90 px-1.5 py-0.5 text-center leading-none">
                        <span className="block text-[12px] font-bold text-[var(--t-ink)]">{e.day}</span>
                        <span className="block text-[8px] font-bold text-[var(--t-ink-soft)]">
                          {e.month}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label="Guardar evento"
                        onClick={() => toggleSave(e.title)}
                        className="absolute right-1.5 top-1.5 bg-white/85 p-1"
                      >
                        <Heart
                          size={13}
                          className={
                            saved.includes(e.title)
                              ? "fill-[var(--t-green)] text-[var(--t-green)]"
                              : "text-[var(--t-ink-soft)]"
                          }
                        />
                      </button>
                    </div>
                    <div className="p-2">
                      <h3 className="text-[12px] font-bold leading-snug text-[var(--t-ink)]">
                        {e.title}
                      </h3>
                      <p className="mt-1 text-[10px] text-[var(--t-ink-soft)]">{e.when}</p>
                      <p className="text-[10px] text-[var(--t-ink-soft)]">{e.place}</p>
                      <p className="mt-1 text-[10px] font-bold text-[var(--t-green)]">
                        +{e.people} asistentes
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Columna derecha */}
        <aside className="space-y-3">
          <div className="t-panel p-3">
            <h2 className="mb-2 flex items-center justify-between border-b border-[var(--t-line)] pb-1.5 text-[13px] font-bold">
              <span>Próximos eventos</span>
              <span className="t-link text-[11px] font-normal">Ver calendario</span>
            </h2>
            <ul className="space-y-2.5">
              {UPCOMING.map((u) => (
                <li key={u.title} className="flex gap-2">
                  <span
                    className="mt-0.5 h-8 w-8 shrink-0 border border-[var(--t-line)]"
                    style={{ background: u.dot }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="t-link truncate text-[11px] font-bold">{u.title}</p>
                    <p className="text-[10px] text-[var(--t-ink-soft)]">{u.when}</p>
                    <p className="text-[10px] text-[var(--t-ink-soft)]">{u.place}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="t-panel p-3">
            <h2 className="mb-2 border-b border-[var(--t-line)] pb-1.5 text-[13px] font-bold">
              Amigos que asistirán
            </h2>
            <ul className="space-y-2">
              {ATTENDING.map((a) => (
                <li key={a.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--t-green)]" aria-hidden />
                  <div className="min-w-0">
                    <p className="t-link truncate text-[11px] font-bold">{a.name}</p>
                    <p className="text-[10px] text-[var(--t-ink-soft)]">{a.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/amigos" className="t-link mt-2 inline-block text-[11px]">
              Ver todos »
            </Link>
          </div>

          <div className="t-panel p-3">
            <h2 className="mb-2 border-b border-[var(--t-line)] pb-1.5 text-[13px] font-bold">
              Categorías populares
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR.map((p) => (
                <span
                  key={p}
                  className="border border-[var(--t-line)] bg-white px-2 py-0.5 text-[10px] text-[var(--t-ink)]"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="t-panel p-3 text-center">
            <h2 className="mb-2 border-b border-[var(--t-line)] pb-1.5 text-left text-[13px] font-bold">
              Crea tu evento
            </h2>
            <p className="text-[11px] font-bold text-[var(--t-ink)]">¿Tienes algo planeado?</p>
            <p className="mt-1 text-[11px] text-[var(--t-ink-soft)]">
              Crea tu evento y compártelo con tus amigos.
            </p>
            <button
              type="button"
              className="t-btn mt-2"
              onClick={() => toast.success("Pronto podrás crear tus propios eventos")}
            >
              Crear evento
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
