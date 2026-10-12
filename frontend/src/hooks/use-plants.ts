import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Plant } from "@/lib/plants";
import { errorMessage } from "@/lib/utils";

/** The whole catalogue, loaded once; filtering happens in the browser. */
export function usePlants() {
  const [plants, setPlants] = useState<Plant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setPlants(await api<Plant[]>("/api/plants"));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const upsert = useCallback((plant: Plant) => {
    setPlants((list) => {
      const rest = (list ?? []).filter((p) => p.id !== plant.id);
      return [...rest, plant];
    });
  }, []);

  const remove = useCallback((id: number) => {
    setPlants((list) => (list ?? []).filter((p) => p.id !== id));
  }, []);

  return { plants, error, reload, upsert, remove };
}
