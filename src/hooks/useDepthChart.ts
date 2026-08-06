import { useEffect, useState } from "react";
import type { DepthChartState, StoreStatus } from "../domain/types";
import type { DepthChartStore } from "../store/DepthChartStore";
import { createEmptyState } from "../store/stateModel";

export const useDepthChart = (store: DepthChartStore) => {
  const [state, setState] = useState<DepthChartState>(createEmptyState());
  const [status, setStatus] = useState<StoreStatus>({
    phase: "loading",
    canUndo: false,
    canRetry: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribeState = store.subscribe((next) => {
      if (active) setState(next);
    });
    const unsubscribeStatus = store.subscribeStatus((next) => {
      if (active) setStatus(next);
    });

    void store.loadLineup().then((next) => {
      if (!active) return;
      setState(next);
      setIsLoading(false);
    }).catch((error: unknown) => {
      if (!active) return;
      setStatus({
        phase: "error",
        canUndo: false,
        canRetry: true,
        message: error instanceof Error ? error.message : "Depth chart failed to load.",
      });
      setIsLoading(false);
    });

    return () => {
      active = false;
      unsubscribeState();
      unsubscribeStatus();
    };
  }, [store]);

  return { state, status, isLoading };
};
