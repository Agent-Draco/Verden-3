import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CAR_ID, VEHICLES } from "@/lib/vehicles";

export type GarageVehicle = {
  id: string;
  name: string;
  modelKey: string;
  color: string;
  isDefault: boolean;
  category: string;
};

/** The Garage is the source of truth for the map puck and convoy avatars. */
export function useGarage() {
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        if (mounted) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("garage_vehicles")
        .select("id,name,model_key,color,is_default,category")
        .eq("user_id", u.user.id)
        .order("is_default", { ascending: false });
      if (!mounted) return;
      setVehicles(
        (data ?? []).map((v) => ({
          id: v.id,
          name: v.name,
          modelKey: v.model_key,
          color: v.color,
          isDefault: v.is_default,
          category: v.category,
        })),
      );
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const active = vehicles.find((v) => v.isDefault) ?? vehicles[0] ?? null;

  return {
    vehicles,
    active,
    activeModelKey: active?.modelKey ?? DEFAULT_CAR_ID,
    loading,
    async setDefault(id: string) {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      await supabase.from("garage_vehicles").update({ is_default: false }).eq("user_id", u.user.id);
      await supabase.from("garage_vehicles").update({ is_default: true }).eq("id", id);
      setVehicles((prev) => prev.map((v) => ({ ...v, isDefault: v.id === id })));
    },
    async addVehicle(modelKey: string) {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const spec = VEHICLES.find((v) => v.id === modelKey);
      const { data } = await supabase
        .from("garage_vehicles")
        .insert({
          user_id: u.user.id,
          name: spec?.name ?? "Vehicle",
          category: "car",
          color: "#22c55e",
          model_key: modelKey,
          is_default: false,
        })
        .select("id,name,model_key,color,is_default,category")
        .maybeSingle();
      if (data) {
        setVehicles((prev) => [
          ...prev,
          {
            id: data.id,
            name: data.name,
            modelKey: data.model_key,
            color: data.color,
            isDefault: data.is_default,
            category: data.category,
          },
        ]);
      }
    },
  };
}
