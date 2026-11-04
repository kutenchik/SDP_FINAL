import { useState } from "react";
import { api } from "../api/client";
import { useHub } from "../hooks/useHub";
import type { Hackathon, Submission, Strategy } from "../types";
import { Button, FormError, useMutation } from "./ui";
const models: { value: Strategy; title: string; description: string }[] = [
  {
    value: "STANDARD",
    title: "Standard average",
    description:
      "Every criterion counts equally. Average the normalized scores from all judges.",
  },
  {
    value: "OLYMPIC",
    title: "Olympic average",
    description:
      "With 3+ judges, remove one highest and lowest total, then average. Otherwise use the standard mean.",
  },
  {
    value: "WEIGHTED",
    title: "Weighted criteria",
    description: "Apply criterion weights and average judge totals.",
  },
];
export function StrategyPanel({
  event,
  onSaved,
}: {
  event: Hackathon;
  onSaved: () => Promise<void>;
}) {
  const hub = useHub();
  const allowed =
    hub.role === "Organizer" &&
    event.status !== "COMPLETED" &&
    event.status !== "CANCELLED";
  const mutation = useMutation(async () => {
    await hub.refresh();
    await onSaved();
    hub.toast("Scoring model updated. Rankings recalculated.");
  });
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Scoring Strategy</h2>
          <p>Select the scoring algorithm.</p>
        </div>
      </div>
      <div className="panel-body">
        <FormError error={mutation.error} />
        <fieldset
          disabled={!allowed || mutation.busy}
          style={{ border: 0, padding: 0, margin: 0 }}
        >
          <legend className="sr-only">Scoring model</legend>
          <div className="strategy-options">
            {models.map((m) => (
              <label className="strategy-option" key={m.value}>
                <input
                  type="radio"
                  name="strategy"
                  value={m.value}
                  checked={event.scoringStrategy === m.value}
                  onChange={() =>
                    void mutation.run(() =>
                      api.put(`/hackathons/${event.id}/strategy`, {
                        strategy: m.value,
                      }),
                    )
                  }
                />
                <div>
                  <strong>{m.title}</strong>
                  <p>{m.description}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="strategy-note" aria-live="polite">
          {mutation.busy
            ? "Recalculating rankings…"
            : allowed
              ? "Changes recalculate the rankings while preserving every original judge evaluation."
              : "The Organizer controls the scoring model. Original evaluations are always preserved."}
        </p>
      </div>
    </section>
  );
}
export function ModifierPanel({
  submission,
  event,
  onSaved,
}: {
  submission: Submission;
  event: Hackathon;
  onSaved: () => Promise<void>;
}) {
  const hub = useHub();
  const allowed =
    hub.role === "Organizer" &&
    event.status !== "COMPLETED" &&
    event.status !== "CANCELLED";
  const [values, setValues] = useState({
    earlyBonus: submission.earlyBonus,
    latePenalty: submission.latePenalty,
    originalityBonus: submission.originalityBonus,
  });
  const mutation = useMutation(async () => {
    await hub.refresh();
    await onSaved();
    hub.toast("Score adjustments updated.");
  });
  const dirty =
    values.earlyBonus !== submission.earlyBonus ||
    values.latePenalty !== submission.latePenalty ||
    values.originalityBonus !== submission.originalityBonus;
  const items = [
    {
      key: "earlyBonus" as const,
      title: "Early submission",
      amount: "+5",
      hint: "Submitted at least 6 hours before the deadline.",
    },
    {
      key: "originalityBonus" as const,
      title: "Originality bonus",
      amount: "+5",
      hint: "Organizer-approved originality adjustment.",
    },
    {
      key: "latePenalty" as const,
      title: "Late deliverables",
      amount: "−10",
      hint: "Discretionary penalty for late supporting materials.",
    },
  ];
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Score Adjustments</h2>
          <p>Configure applicable bonuses and penalties.</p>
        </div>
      </div>
      <div className="panel-body">
        <FormError error={mutation.error} />
        {items.map((item) => (
          <div className="modifier" key={item.key}>
            <div>
              <strong>
                {item.title}
                <span
                  className={`modifier-value ${item.key === "latePenalty" ? "negative" : ""}`}
                >
                  {item.amount}
                </span>
              </strong>
              <small>{item.hint}</small>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                aria-label={item.title}
                checked={values[item.key]}
                disabled={!allowed || mutation.busy}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setValues((v) => ({
                    ...v,
                    [item.key]: checked,
                    ...(item.key === "earlyBonus" && checked
                      ? { latePenalty: false }
                      : {}),
                    ...(item.key === "latePenalty" && checked
                      ? { earlyBonus: false }
                      : {}),
                  }));
                }}
              />
              <span />
            </label>
          </div>
        ))}
        <p className="strategy-note">
          Early and late adjustments are mutually exclusive. Final scores stay
          within 0–100. Unreviewed projects receive no bonuses until scored.
        </p>
        {allowed && (
          <Button
            variant="secondary"
            busy={mutation.busy}
            disabled={!dirty}
            style={{ width: "100%", marginTop: 16 }}
            onClick={() =>
              void mutation.run(() =>
                api.put(`/submissions/${submission.id}/modifiers`, values),
              )
            }
          >
            Apply adjustments
          </Button>
        )}
      </div>
    </section>
  );
}
