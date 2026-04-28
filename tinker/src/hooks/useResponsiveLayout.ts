import { useEffect, useState } from "react";

interface ResponsiveLayoutState {
  isTabletLayout: boolean;
  isCompactLayout: boolean;
  isCoarsePointer: boolean;
}

function getResponsiveLayoutState(): ResponsiveLayoutState {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return {
      isTabletLayout: false,
      isCompactLayout: false,
      isCoarsePointer: false,
    };
  }

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const compactWidth = window.matchMedia("(max-width: 767px)").matches;
  const tabletWidth = window.matchMedia("(max-width: 1100px)").matches;

  return {
    isTabletLayout: tabletWidth || coarsePointer,
    isCompactLayout: compactWidth,
    isCoarsePointer: coarsePointer,
  };
}

export function useResponsiveLayout() {
  const [state, setState] = useState<ResponsiveLayoutState>(() => getResponsiveLayoutState());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const tabletQuery = window.matchMedia("(max-width: 1100px)");
    const compactQuery = window.matchMedia("(max-width: 767px)");
    const coarseQuery = window.matchMedia("(pointer: coarse)");
    const update = () => {
      const nextState = getResponsiveLayoutState();
      setState((current) => {
        if (
          current.isTabletLayout === nextState.isTabletLayout &&
          current.isCompactLayout === nextState.isCompactLayout &&
          current.isCoarsePointer === nextState.isCoarsePointer
        ) {
          return current;
        }

        return nextState;
      });
    };

    update();

    const queries = [tabletQuery, compactQuery, coarseQuery];
    for (const query of queries) {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", update);
      } else {
        query.addListener(update);
      }
    }

    window.addEventListener("resize", update);

    return () => {
      for (const query of queries) {
        if (typeof query.removeEventListener === "function") {
          query.removeEventListener("change", update);
        } else {
          query.removeListener(update);
        }
      }
      window.removeEventListener("resize", update);
    };
  }, []);

  return state;
}
