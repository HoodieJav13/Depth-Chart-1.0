export type RightSurfaceMode = "collapsed" | "roster" | "position";

export interface RightSurfaceState {
  mode: RightSurfaceMode;
  previousMode: RightSurfaceMode;
  dragRestoreMode: RightSurfaceMode | null;
}

export const createRightSurfaceState = (): RightSurfaceState => ({
  mode: "collapsed",
  previousMode: "collapsed",
  dragRestoreMode: null,
});

export const setRosterOpen = (
  state: RightSurfaceState,
  open: boolean,
): RightSurfaceState => ({
  ...state,
  mode: open ? "roster" : "collapsed",
  previousMode: open ? "roster" : "collapsed",
  dragRestoreMode: null,
});

export const beginFieldDrag = (state: RightSurfaceState): RightSurfaceState => ({
  ...state,
  mode: "roster",
  dragRestoreMode: state.mode,
});

export const completeFieldDrag = (
  state: RightSurfaceState,
  droppedOnRoster: boolean,
): RightSurfaceState => ({
  ...state,
  mode: droppedOnRoster ? "roster" : (state.dragRestoreMode ?? state.mode),
  previousMode: droppedOnRoster ? "roster" : state.previousMode,
  dragRestoreMode: null,
});

export const openPositionDetail = (state: RightSurfaceState): RightSurfaceState => ({
  ...state,
  mode: "position",
  previousMode: state.mode === "position" ? state.previousMode : state.mode,
  dragRestoreMode: null,
});

export const closePositionDetail = (state: RightSurfaceState): RightSurfaceState => ({
  ...state,
  mode: state.previousMode === "position" ? "collapsed" : state.previousMode,
  dragRestoreMode: null,
});
