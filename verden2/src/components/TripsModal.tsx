import { useState } from "react";
import { Loader2, Plus, Users, MapPin, X, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";
import { useTrips } from "@/hooks/useTrips";

interface TripsModalProps {
  onClose: () => void;
}

export default function TripsModal({ onClose }: TripsModalProps) {
  const trips = useTrips();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md overflow-y-auto animate-scaleIn">
      {/* Top Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-eco flex items-center justify-center text-white shadow-eco">
            <RouteIcon size={18} />
          </div>
          <span className="font-display font-bold text-lg">Trips</span>
        </div>
        <button
          onClick={onClose}
          type="button"
          aria-label="Close Trips"
          className="grid h-9 w-9 place-items-center rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer"
        >
          <X size={18} />
        </button>
      </header>

      <div className="mx-auto w-full max-w-4xl space-y-8 p-6 md:p-10 flex-1">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Plan together
          </p>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Trips</h1>
        </div>

        {trips.loading ? (
          <div className="grid min-h-[40vh] place-items-center">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : (
          <>
            <section className="glass space-y-3 rounded-3xl p-5">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value.slice(0, 80))}
                  placeholder="Name your trip"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (!name.trim()) return toast.error("Give the trip a name.");
                    setBusy(true);
                    try {
                      await trips.create({ name: name.trim() });
                      setName("");
                      toast.success("Trip created.");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not create trip.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground disabled:opacity-60 cursor-pointer"
                >
                  <Plus size={16} /> Create
                </button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 12))}
                  placeholder="Join with an invite code"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await trips.joinByCode(code);
                      setCode("");
                      toast.success("Joined the trip.");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Invalid code.");
                    }
                  }}
                  className="rounded-xl bg-secondary hover:bg-secondary/80 px-5 py-2.5 font-display text-xs font-bold cursor-pointer transition"
                >
                  Join
                </button>
              </div>
            </section>

            {trips.trips.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No trips yet — create one above.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {trips.trips.map((trip) => (
                  <li key={trip.id} className="glass space-y-2 rounded-3xl p-5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{trip.coverEmoji}</span>
                      <div className="min-w-0">
                        <p className="truncate font-display font-semibold">{trip.name}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {trip.status} · {trip.visibility}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users size={13} /> {trip.memberCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={13} /> {trip.placeCount} stops
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
