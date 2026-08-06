interface UndoBarProps {
  canUndo: boolean;
  onUndo: () => void;
}

export const UndoBar = ({ canUndo, onUndo }: UndoBarProps) =>
  canUndo ? (
    <div className="undo-bar" role="status">
      <span>Last change saved</span>
      <button type="button" onClick={onUndo}>
        Undo
      </button>
    </div>
  ) : null;
