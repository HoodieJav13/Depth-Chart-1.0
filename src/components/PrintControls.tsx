import { useState, type FormEvent } from "react";

interface PrintControlsProps {
  defaultTitle: string;
  onClose: () => void;
  onPrint: (title: string, date: string) => void;
}

export const PrintControls = ({ defaultTitle, onClose, onPrint }: PrintControlsProps) => {
  const [title, setTitle] = useState(defaultTitle);
  const [date, setDate] = useState(() => new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onPrint(title.trim(), date.trim());
  };

  return (
    <div className="dialog-backdrop workflow-overlay" role="presentation" onMouseDown={onClose}>
      <section className="workflow-dialog" role="dialog" aria-modal="true" aria-labelledby="print-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-heading">
          <h2 id="print-title">Print depth chart</h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={submit}>
          <label htmlFor="print-chart-title">Title</label>
          <input id="print-chart-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <label htmlFor="print-chart-date">Date</label>
          <input id="print-chart-date" value={date} onChange={(event) => setDate(event.target.value)} />
          <button className="dialog-submit" type="submit">Open print dialog</button>
        </form>
      </section>
    </div>
  );
};
