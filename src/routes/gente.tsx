import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { searchProfiles } from "@/lib/api";
import { UserAvatar } from "@/components/UserAvatar";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/gente")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"].slice(0, 40) : "",
  }),
  head: () => ({
    meta: [
      { title: "Buscar gente — nocturno" },
      {
        name: "description",
        content: "Encuentra a tus amigos por nombre o usuario y añádelos a tu red en nocturno.",
      },
      { property: "og:title", content: "Buscar gente — nocturno" },
      { property: "og:description", content: "Encuentra a tus amigos por nombre o usuario." },
    ],
  }),
  component: PeoplePage,
});

function PeoplePage() {
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q);

  const results = useQuery({
    queryKey: ["search-profiles", term],
    queryFn: () => searchProfiles(term),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Buscar gente</h1>
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Nombre o usuario…"
        maxLength={40}
        className="mt-4"
        aria-label="Buscar por nombre o usuario"
      />

      <ul className="mt-6 space-y-2">
        {results.isLoading ? (
          <li className="text-sm text-muted-foreground">Buscando…</li>
        ) : (results.data ?? []).length === 0 ? (
          <li className="text-sm text-muted-foreground">No hemos encontrado a nadie.</li>
        ) : (
          (results.data ?? []).map((p) => (
            <li key={p.id} className="panel flex items-center gap-3 p-3">
              <UserAvatar
                username={p.username}
                displayName={p.display_name}
                avatarPath={p.avatar_url}
                accent={p.accent_color}
              />
              <div className="min-w-0">
                <Link
                  to="/perfil/$username"
                  params={{ username: p.username }}
                  className="block truncate font-semibold hover:text-accent"
                >
                  {p.display_name}
                </Link>
                <p className="truncate text-xs text-muted-foreground">@{p.username}</p>
              </div>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}