import { useState } from "react";
import { Code2, Mic, NotebookPen } from "lucide-react";
import { api } from "../api/client";
import { useHub } from "../hooks/useHub";
import type { Hackathon, Task } from "../types";
import { iso, localInput } from "../utils/format";
import {
  FormError,
  FormFooter,
  Input,
  Modal,
  Select,
  SubmitForm,
  Textarea,
  useMutation,
} from "./ui";
export function TaskForm({
  event,
  onClose,
  onSaved,
}: {
  event: Hackathon;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const hub = useHub();
  const [form, setForm] = useState({
    title: "",
    description: "",
    taskType: "CODING" as Task["taskType"],
    deadline: localInput(event.submissionDeadline),
    durationMinutes: 5,
    questionCount: 10,
  });
  const mutation = useMutation(async () => {
    await onSaved();
    hub.toast("Task created.");
    onClose();
  });
  return (
    <Modal
      title="Create Task"
      description="Select a task type and configure its requirements."
      onClose={onClose}
    >
      <SubmitForm
        onSubmit={() =>
          void mutation.run(() =>
            api.post(`/hackathons/${event.id}/tasks`, {
              ...form,
              deadline: iso(form.deadline),
              durationMinutes:
                form.taskType === "PITCH" ? Number(form.durationMinutes) : null,
              questionCount:
                form.taskType === "QUIZ" ? Number(form.questionCount) : null,
            }),
          )
        }
      >
        <FormError error={mutation.error} />
        <Select
          label="Task type"
          value={form.taskType}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              taskType: e.target.value as Task["taskType"],
            }))
          }
        >
          <option value="CODING">Coding</option>
          <option value="PITCH">Pitch</option>
          <option value="QUIZ">Quiz</option>
        </Select>
        <div className="info-box">
          {form.taskType === "CODING" ? (
            <>
              <Code2 size={16} aria-hidden="true" /> Coding challenges need a
              brief of at least 20 characters.
            </>
          ) : form.taskType === "PITCH" ? (
            <>
              <Mic size={16} aria-hidden="true" /> Pitch sessions can be 1–30
              minutes long.
            </>
          ) : (
            <>
              <NotebookPen size={16} aria-hidden="true" /> Quizzes can include
              1–100 questions.
            </>
          )}
        </div>
        <Input
          label="Task title"
          required
          maxLength={160}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          error={mutation.error?.errors.title}
        />
        <Textarea
          label="Task description"
          required
          maxLength={3000}
          minLength={form.taskType === "CODING" ? 20 : 1}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
        <Input
          label="Deadline"
          required
          type="datetime-local"
          min={localInput(event.startDate)}
          max={localInput(event.submissionDeadline)}
          value={form.deadline}
          onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
        />
        {form.taskType === "PITCH" && (
          <Input
            label="Duration (minutes)"
            type="number"
            required
            min="1"
            max="30"
            value={form.durationMinutes}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                durationMinutes: Number(e.target.value),
              }))
            }
          />
        )}
        {form.taskType === "QUIZ" && (
          <Input
            label="Number of questions"
            type="number"
            required
            min="1"
            max="100"
            value={form.questionCount}
            onChange={(e) =>
              setForm((f) => ({ ...f, questionCount: Number(e.target.value) }))
            }
          />
        )}
        <FormFooter
          busy={mutation.busy}
          onClose={onClose}
          label="Create task"
        />
      </SubmitForm>
    </Modal>
  );
}
