"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { CoreQuestion } from "@/lib/types/leadgen";

export function NextQuestionCard({
  question,
  onMarkAnswered,
  onSkip,
  onSellerDoesntKnow,
}: {
  question: CoreQuestion | null;
  onMarkAnswered: (primaryField: string, value: string) => void;
  onSkip: (id: number) => void;
  onSellerDoesntKnow: (primaryField: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(question?.question ?? "");
  const [answering, setAnswering] = useState(false);
  const [answerText, setAnswerText] = useState("");

  useEffect(() => {
    setEditedText(question?.question ?? "");
    setEditing(false);
    setAnswering(false);
    setAnswerText("");
  }, [question]);

  if (!question) {
    return (
      <Card className="border-success/40 bg-success/5">
        <CardTitle>Next best question</CardTitle>
        <p className="mt-2 text-sm text-navy">All 10 core questions have an answer. Nice work -- check the strategy router below.</p>
      </Card>
    );
  }

  return (
    <Card className="border-primary-blue/50 bg-soft-blue">
      <div className="flex items-center justify-between">
        <CardTitle className="text-navy">Next best question</CardTitle>
        <span className="text-xs font-medium text-text-secondary">Question {question.id} of 10</span>
      </div>

      {editing ? (
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          rows={2}
          className="mt-2 w-full rounded-card border border-primary-blue/40 bg-canvas px-3 py-2 text-sm"
        />
      ) : (
        <p className="mt-2 text-lg font-semibold text-navy">{editedText}</p>
      )}

      <p className="mt-2 text-xs text-text-secondary"><strong>Why we need this:</strong> {question.purpose}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => navigator.clipboard.writeText(editedText).catch(() => {})}>Copy question</Button>
        <Button variant="secondary" onClick={() => setEditing((e) => !e)}>{editing ? "Done editing" : "Edit"}</Button>
        <Button variant="secondary" onClick={() => setAnswering((a) => !a)}>Mark answered</Button>
        <Button variant="secondary" onClick={() => onSkip(question.id)}>Skip</Button>
        <Button variant="secondary" onClick={() => onSellerDoesntKnow(question.fields[0]!)}>Seller doesn&apos;t know</Button>
      </div>

      {answering && (
        <div className="mt-3 flex gap-2">
          <input
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="What did the seller say?"
            className="flex-1 rounded-card border border-primary-blue/40 bg-canvas px-3 py-2 text-sm"
          />
          <Button
            onClick={() => {
              if (!answerText.trim()) return;
              onMarkAnswered(question.fields[0]!, answerText.trim());
              setAnswering(false);
              setAnswerText("");
            }}
          >
            Save
          </Button>
        </div>
      )}
    </Card>
  );
}
