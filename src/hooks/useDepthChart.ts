import { useEffect, useState } from "react";
import type { DepthChartState } from "../domain/types";
import type { DepthChartStore } from "../store/DepthChartStore";

const emptyState: DepthChartState = {
  version: 1,
  assignments: {},
  addedPlayers: [],
};

export const useDepthChart = (store: DepthChartStore) => {
  const [state, setState] = useState<DepthChartState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = store.subscribe((next) => {
      if (active) setState(next);
    });

    void store.loadLineup().then((next) => {
      if (!active) return;
      setState(next);
      setIsLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [store]);

  return { state, isLoading };
};
