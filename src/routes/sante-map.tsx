import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Locate, ArrowLeft, Hospital, Stethoscope, HeartPulse, Pill } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientOnlyHealthMap, type Facility, TYPE_COLORS, TYPE_LABEL, distanceKm } from "@/components/HealthMap";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/sante-map")({
  head: () => ({
    meta: [
      { title: "Carte de santé — JammCare" },
      { name: "description", content: "Trouvez hôpitaux, centres de santé, postes de santé et pharmacies au Sénégal." },
    ],
  }),
  component: SanteMapPage,
});

const TYPE_ICON = {
  hospital: Hospital,
  health_center: Stethoscope,
  health_post: HeartPulse,
  pharmacy: Pill,
} as const;

function SanteMapPage() {
  const [all, setAll] = useState<Facility[]>([]);
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<Facility["type"]>>(
    new Set(["hospital", "health_center", "health_post", "pharmacy"])
  );
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("health_facilities")
        .select("id,name,type,address,city,region,phone,hours,lat,lng")
        .order("name");
      if (error) {
        toast.error("Impossible de charger les établissements");
        return;
      }
      setAll((data ?? []) as Facility[]);
    })();
  }, []);

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation non disponible");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setUserPos([p.coords.latitude, p.coords.longitude]);
        toast.success("Position détectée");
      },
      () => toast.error("Impossible d'obtenir votre position"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = all
      .filter((f) => activeTypes.has(f.type))
      .filter((f) =>
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.city?.toLowerCase().includes(q) ||
        f.region?.toLowerCase().includes(q)
      )
      .map((f) => ({
        ...f,
        distance: userPos ? distanceKm(userPos, [f.lat, f.lng]) : undefined,
      }));
    if (userPos) list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    return list;
  }, [all, search, activeTypes, userPos]);

  const toggleType = (t: Facility["type"]) => {
    setActiveTypes((prev) => {
      const n = new Set(prev);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
          <h1 className="text-display text-lg sm:text-xl">Carte de santé</h1>
          <Button onClick={locate} size="sm" variant="outline">
            <Locate className="mr-1.5 h-4 w-4" /> Ma position
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-4 px-4 py-4 lg:grid-cols-[360px_1fr] lg:px-8">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par ville, région…"
                className="pl-9"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(Object.keys(TYPE_LABEL) as Facility["type"][]).map((t) => {
                const active = activeTypes.has(t);
                const Icon = TYPE_ICON[t];
                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                      active ? "border-transparent text-white" : "border-border bg-surface text-muted-foreground"
                    }`}
                    style={active ? { background: TYPE_COLORS[t] } : undefined}
                  >
                    <Icon className="h-3 w-3" />
                    {TYPE_LABEL[t]}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{filtered.length} résultat(s)</p>
          </div>

          <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-soft lg:max-h-[calc(100vh-280px)]">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Aucun établissement</p>
            ) : (
              filtered.map((f) => {
                const Icon = TYPE_ICON[f.type];
                return (
                  <button
                    key={f.id}
                    onClick={() => setFocusId(f.id)}
                    className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition hover:bg-secondary ${
                      focusId === f.id ? "bg-secondary" : ""
                    }`}
                  >
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ background: TYPE_COLORS[f.type] }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {f.city ?? "—"}{f.region ? ` · ${f.region}` : ""}
                      </p>
                      {typeof f.distance === "number" && (
                        <p className="mt-0.5 text-xs font-medium text-success">À {f.distance.toFixed(1)} km</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Map */}
        <div className="h-[60vh] lg:h-[calc(100vh-120px)]">
          <ClientOnlyHealthMap facilities={filtered} userPos={userPos} focusId={focusId} />
        </div>
      </div>
    </div>
  );
}
