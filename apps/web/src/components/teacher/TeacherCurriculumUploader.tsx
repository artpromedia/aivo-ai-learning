"use client";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";

interface ConnectedLearner {
  id: string;
  name: string;
}

const SUBJECTS = ["math", "ela", "science", "history", "coding", "speech", "sel", "art", "other"] as const;
type Subject = typeof SUBJECTS[number];

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function TeacherCurriculumUploader({
  learners,
  accessToken,
}: {
  learners: ConnectedLearner[];
  accessToken: string | null;
}) {
  const t = useTranslations("curriculum");
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState<Subject>("math");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleLearner = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const selectAll = () => setSelectedIds(learners.map((l) => l.id));
  const clearAll = () => setSelectedIds([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (selectedIds.length === 0) {
      setError(t("err_select_learners"));
      return;
    }
    if (!text.trim() && !file) {
      setError(t("err_need_content"));
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      setError(t("err_file_too_large"));
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        applyToLearnerIds: selectedIds,
        subject,
        title: title.trim() || undefined,
        text: text.trim() || undefined,
        weekStart: weekStart || undefined,
        weekEnd: weekEnd || undefined,
      };
      if (file) {
        body.imageBase64 = await fileToBase64(file);
        body.mimeType = file.type || "application/octet-stream";
        body.fileName = file.name;
      }
      const res = await fetch("/api/tutors/curriculum/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || t("err_upload_failed"));
      }
      const data = await res.json();
      setSuccess(t("success_uploaded_n", { count: data.learnerCount || selectedIds.length }));
      setTitle("");
      setText("");
      setFile(null);
      setWeekStart("");
      setWeekEnd("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      setError(err.message || t("err_upload_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="vi-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left px-6 py-4 flex items-center justify-between"
      >
        <div>
          <h2 className="font-heading font-bold vi-text">{t("teacher_section_title")}</h2>
          <p className="text-xs vi-text-muted mt-0.5">{t("teacher_section_desc")}</p>
        </div>
        <span className="text-sm vi-text-muted">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 border-t vi-border pt-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold vi-text">{t("apply_to_learners")}</span>
              <div className="flex gap-2 text-xs">
                <button type="button" onClick={selectAll} className="vi-text-muted hover:underline">
                  {t("select_all")}
                </button>
                <button type="button" onClick={clearAll} className="vi-text-muted hover:underline">
                  {t("clear")}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-auto">
              {learners.length === 0 && (
                <p className="text-xs vi-text-muted">{t("no_connected_learners")}</p>
              )}
              {learners.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => toggleLearner(l.id)}
                  className={`text-xs rounded-full px-3 py-1.5 border ${
                    selectedIds.includes(l.id)
                      ? "bg-[hsl(var(--visual-primary))] text-white border-transparent"
                      : "vi-border vi-text"
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium vi-text">{t("subject_label")}</span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="mt-1 block w-full rounded-lg border vi-border bg-transparent px-3 py-2 vi-text"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {t(`subject.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium vi-text">{t("title_label")}</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder={t("title_placeholder")}
                className="mt-1 block w-full rounded-lg border vi-border bg-transparent px-3 py-2 vi-text"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium vi-text">{t("week_start_label")}</span>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="mt-1 block w-full rounded-lg border vi-border bg-transparent px-3 py-2 vi-text"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium vi-text">{t("week_end_label")}</span>
              <input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                className="mt-1 block w-full rounded-lg border vi-border bg-transparent px-3 py-2 vi-text"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium vi-text">{t("text_label")}</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              maxLength={32000}
              placeholder={t("text_placeholder")}
              className="mt-1 block w-full rounded-lg border vi-border bg-transparent px-3 py-2 vi-text font-mono text-sm"
            />
          </label>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-sm vi-text-muted">{t("or_upload_file")}</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-sm vi-text"
            />
            {file && (
              <span className="text-xs vi-text-muted">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </span>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[hsl(var(--visual-primary))] px-5 py-2 text-white font-semibold disabled:opacity-50"
            >
              {submitting ? t("submitting") : t("submit")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
