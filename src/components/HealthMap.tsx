import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Phone, MapPin, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Facility {
  id: string;
  name: string;
  type: "hospital" | "health_center" | "health_post" | "pharmacy";
  address: string | null;
  city: string | null;
  region: string | null;
  phone: string | null;
  hours: string | null;
  lat: number;
  lng: number;
  distance?: number;
}

const TYPE_COLORS: Record<Facility["type"], string> = {
  hospital: "#dc2626",
  health_center: "#2563eb",
  health_post: "#16a34a",
  pharmacy: "#9333ea",
};

const TYPE_LABEL: Record<Facility["type"], string> = {
  hospital: "Hôpital",
  health_center: "Centre de santé",
  health_post: "Poste de santé",
  pharmacy: "Pharmacie",
};

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

function userIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="background:#0ea5e9;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(14,165,233,.3)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function Recenter({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView(pos, 13);
  }, [pos, map]);
  return null;
}

export function HealthMap({
  facilities,
  userPos,
  focusId,
}: {
  facilities: Facility[];
  userPos: [number, number] | null;
  focusId?: string | null;
}) {
  const [center, setCenter] = useState<[number, number]>([14.6928, -17.4467]); // Dakar
  const focus = facilities.find((f) => f.id === focusId);
  const target: [number, number] | null = focus ? [focus.lat, focus.lng] : userPos;

  const icons = useMemo(
    () => ({
      hospital: makeIcon(TYPE_COLORS.hospital),
      health_center: makeIcon(TYPE_COLORS.health_center),
      health_post: makeIcon(TYPE_COLORS.health_post),
      pharmacy: makeIcon(TYPE_COLORS.pharmacy),
    }),
    []
  );

  useEffect(() => {
    if (userPos) setCenter(userPos);
  }, [userPos]);

  return (
    <MapContainer center={center} zoom={12} className="h-full w-full rounded-2xl" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter pos={target} />
      {userPos && (
        <Marker position={userPos} icon={userIcon()}>
          <Popup>Vous êtes ici</Popup>
        </Marker>
      )}
      {facilities.map((f) => (
        <Marker key={f.id} position={[f.lat, f.lng]} icon={icons[f.type]}>
          <Popup>
            <div className="min-w-[200px] space-y-1.5 text-sm">
              <p className="font-semibold leading-tight">{f.name}</p>
              <p className="text-xs text-muted-foreground">{TYPE_LABEL[f.type]}</p>
              {f.address && (
                <p className="flex items-start gap-1 text-xs">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{f.address}, {f.city}</span>
                </p>
              )}
              {f.phone && (
                <a href={`tel:${f.phone}`} className="flex items-center gap-1 text-xs text-primary">
                  <Phone className="h-3 w-3" /> {f.phone}
                </a>
              )}
              {f.hours && (
                <p className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" /> {f.hours}
                </p>
              )}
              {typeof f.distance === "number" && (
                <p className="text-xs font-medium text-success">À {f.distance.toFixed(1)} km</p>
              )}
              <div className="flex gap-1.5 pt-1">
                {userPos && (
                  <a
                    href={`https://www.openstreetmap.org/directions?from=${userPos[0]},${userPos[1]}&to=${f.lat},${f.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] text-primary-foreground"
                  >
                    <Navigation className="h-3 w-3" /> Itinéraire
                  </a>
                )}
                {f.type !== "pharmacy" && (
                  <a
                    href="/patient/appointments"
                    className="inline-flex items-center rounded-md border border-border px-2 py-1 text-[11px]"
                  >
                    Prendre RDV
                  </a>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export function ClientOnlyHealthMap(props: Parameters<typeof HealthMap>[0]) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="flex h-full w-full items-center justify-center rounded-2xl bg-secondary text-sm text-muted-foreground">Chargement de la carte…</div>;
  }
  return <HealthMap {...props} />;
}

export { TYPE_COLORS, TYPE_LABEL, distanceKm };
