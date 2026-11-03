import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { useHub } from "../hooks/useHub";
import type { Criterion } from "../types";
import { Button, FormError, Input, Modal, SubmitForm, useMutation } from "./ui";
export function CriteriaEditor({
  eventId,
  criteria,
  onClose,
  onSaved,
}: {
  eventId: number;
  criteria: Criterion[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const hub = useHub();
  const [rows, setRows] = useState(
    criteria.map((c) => ({
      name: c.name,
      description: c.description,
      weight: c.weight * 100,
      maxScore: c.maxScore,
    })),
  );
  const total = rows.reduce((n, c) => n + Number(c.weight), 0);
  const valid = Math.abs(total - 100) < 0.0001 && rows.length > 0;
  const mutation = useMutation(async () => {
    await onSaved();
    await hub.refresh();
    hub.toast("Evaluation criteria updated.");
    onClose();
  });
  const change = (index: number, key: string, value: string | number) =>
    setRows((r) => r.map((c, i) => (i === index ? { ...c, [key]: value } : c)));
  return (
    <Modal
      wide
      title="Evaluation Criteria"
      description="Configure criteria and weights. Weights must total 100%; scores are normalized to a 100-point scale."
      onClose={onClose}
    >
      <SubmitForm
        onSubmit={() => {
          if (valid)
            void mutation.run(() =>
              api.put(`/hackathons/${eventId}/criteria`, {
                criteria: rows.map((c) => ({
                  ...c,
                  weight: Number(c.weight) / 100,
                  maxScore: Number(c.maxScore),
                })),
              }),
            );
        }}
      >
        <FormError error={mutation.error} />
        {rows.map((c, i) => (
          <div className="criterion-editor" key={i}>
            <div className="criterion-editor-top">
              <span>CRITERION {i + 1}</span>
              <button
                type="button"
                className="icon-btn danger"
                aria-label={`Remove criterion ${i + 1}`}
                onClick={() =>
                  setRows((r) => r.filter((_, index) => index !== i))
                }
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
            <Input
              label="Name"
              required
              maxLength={100}
              value={c.name}
              onChange={(e) => change(i, "name", e.target.value)}
            />
            <Input
              label="Description"
              maxLength={1000}
              value={c.description}
              onChange={(e) => change(i, "description", e.target.value)}
            />
            <div className="form-grid">
              <Input
                label="Weight (%)"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                required
                value={c.weight}
                onChange={(e) => change(i, "weight", e.target.value)}
              />
              <Input
                label="Maximum score"
                type="number"
                min="1"
                max="1000"
                required
                value={c.maxScore}
                onChange={(e) => change(i, "maxScore", e.target.value)}
              />
            </div>
          </div>
        ))}
        <Button
          variant="secondary"
          disabled={rows.length >= 12}
          onClick={() =>
            setRows((r) => [
              ...r,
              { name: "", description: "", weight: 0, maxScore: 10 },
            ])
          }
        >
          <Plus size={16} aria-hidden="true" />
          Add criterion
        </Button>
        <div
          className={`criterion-total ${valid ? "" : "invalid"}`}
          style={{ marginTop: 16 }}
          aria-live="polite"
        >
          <span>Total weight</span>
          <strong>{Number(total.toFixed(2))}% / 100%</strong>
        </div>
        {!valid && (
          <p className="field-error">
            Adjust the weights to total exactly 100% before saving.
          </p>
        )}
        <div className="form-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!valid} busy={mutation.busy}>
            Save criteria
          </Button>
        </div>
      </SubmitForm>
    </Modal>
  );
}
