"use client";
import { useState, useEffect, useRef } from "react";
import type { Beat, FunctioningLevel, SensoryAdaptations } from "./types";
import { CHOICE_COUNTS } from "./types";

interface ResponseZoneProps {
  beat: Beat | null;
  functioningLevel: FunctioningLevel;
  adaptations: SensoryAdaptations;
  onAnswer: (correct: boolean) => void;
  accentColor: string;
}

export function ResponseZone({ beat, functioningLevel, adaptations, onAnswer, accentColor }: ResponseZoneProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [droppedItems, setDroppedItems] = useState<Record<string, string>>({});
  const prevBeatId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (beat?.id !== prevBeatId.current) {
      setSelected(null);
      setFeedback(null);
      setDraggedId(null);
      setDroppedItems({});
      prevBeatId.current = beat?.id;
    }
  }, [beat?.id]);

  const interaction = beat?.interaction;
  if (!interaction) return null;

  const maxChoices = CHOICE_COUNTS[functioningLevel];

  const handleChoice = (choiceId: string, isCorrect: boolean) => {
    if (selected) return;
    setSelected(choiceId);
    setFeedback(isCorrect ? "correct" : "incorrect");
    onAnswer(isCorrect);
    setTimeout(() => {
      setSelected(null);
      setFeedback(null);
    }, 1500);
  };

  const handleDragStart = (itemId: string) => {
    setDraggedId(itemId);
  };

  const handleDrop = (zoneId: string) => {
    if (!draggedId || !interaction.dragItems) return;
    const item = interaction.dragItems.find(d => d.id === draggedId);
    if (!item) return;
    const newDropped = { ...droppedItems, [draggedId]: zoneId };
    setDroppedItems(newDropped);
    setDraggedId(null);

    if (Object.keys(newDropped).length === interaction.dragItems.length) {
      const allCorrect = interaction.dragItems.every(d => newDropped[d.id] === d.targetZone);
      onAnswer(allCorrect);
    }
  };

  if (interaction.type === "multiple_choice" && interaction.choices) {
    const choices = interaction.choices.slice(0, maxChoices);
    const isLargeTarget = functioningLevel !== "STANDARD";

    return (
      <div className="w-full px-4 md:px-12" role="group" aria-label="Answer choices">
        {interaction.prompt && (
          <p className="vi-text-muted text-center text-sm font-body mb-3" id="mc-prompt">{interaction.prompt}</p>
        )}
        <div className={`grid gap-3 ${choices.length <= 2 ? "grid-cols-2" : choices.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`} aria-describedby={interaction.prompt ? "mc-prompt" : undefined}>
          {choices.map((choice) => {
            const isSelected = selected === choice.id;
            const showCorrect = feedback === "correct" && isSelected;
            const showIncorrect = feedback === "incorrect" && isSelected;

            return (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id, choice.isCorrect)}
                disabled={!!selected}
                aria-label={`${choice.label}${showCorrect ? ", correct" : showIncorrect ? ", try again" : ""}`}
                className={`relative rounded-2xl border-2 transition-all duration-300 font-heading font-extrabold text-center
                  ${isLargeTarget ? "py-6 px-4 text-lg" : "py-4 px-3 text-base"}
                  ${showCorrect ? "bg-[hsl(var(--visual-science)/0.16)] border-[hsl(var(--visual-science))] scale-105 ring-4 ring-[hsl(var(--visual-science)/0.4)]" :
                    showIncorrect ? "bg-[hsl(var(--visual-math)/0.16)] border-[hsl(var(--visual-math))] scale-95 ring-4 ring-[hsl(var(--visual-math)/0.4)]" :
                    isSelected ? "opacity-50" :
                    "bg-white vi-border hover:vi-surface-soft hover:scale-105 active:scale-95 shadow-sm"
                  } focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(var(--visual-primary))]`}
              >
                {choice.emoji && <span className="text-3xl block mb-1" aria-hidden="true">{choice.emoji}</span>}
                {choice.image && <span className="text-4xl block mb-1" aria-hidden="true">{choice.image}</span>}
                <span className="text-slate-900">{choice.label}</span>
                {showCorrect && (
                  <span className="absolute -top-2 -right-2 text-2xl animate-bounce" aria-hidden="true">⭐</span>
                )}
                {showIncorrect && (
                  <span className="absolute -top-2 -right-2 text-xl" aria-hidden="true">💭</span>
                )}
              </button>
            );
          })}
        </div>
        <div aria-live="polite" className="sr-only">
          {feedback === "correct" && "Correct answer!"}
          {feedback === "incorrect" && "Not quite, try again!"}
        </div>
      </div>
    );
  }

  if (interaction.type === "drag_drop" && interaction.dragItems && interaction.dragZones) {
    return (
      <div className="w-full px-4 md:px-12">
        {interaction.prompt && (
          <p className="vi-text-muted text-center text-sm font-body mb-3">{interaction.prompt}</p>
        )}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          <div className="flex gap-2 flex-wrap justify-center">
            {interaction.dragItems.filter(d => !droppedItems[d.id]).map((item) => (
              <div
                key={item.id}
                role="listitem"
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onTouchStart={() => handleDragStart(item.id)}
                className="bg-white vi-border border-2 rounded-xl px-4 py-3 cursor-grab active:cursor-grabbing hover:vi-surface-soft hover:scale-105 transition-all text-slate-900 font-heading font-extrabold shadow-sm"
              >
                {item.emoji && <span className="mr-1">{item.emoji}</span>}
                {item.label}
              </div>
            ))}
          </div>

          <div className="vi-text-muted text-2xl">→</div>

          <div className="flex gap-3 flex-wrap justify-center">
            {interaction.dragZones.map((zone) => (
              <div
                key={zone.id}
                role="listitem"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(zone.id)}
                onTouchEnd={() => handleDrop(zone.id)}
                className="w-28 h-20 rounded-xl border-2 border-dashed vi-border flex items-center justify-center vi-text-muted text-sm font-body vi-surface-soft hover:bg-white transition-all"
                style={{ borderColor: draggedId ? accentColor : undefined }}
              >
                {Object.entries(droppedItems).find(([_, z]) => z === zone.id)?.[0]
                  ? <span className="text-slate-900 font-extrabold">✓</span>
                  : zone.label
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (interaction.type === "voice") {
    return (
      <div className="w-full flex flex-col items-center gap-3">
        {interaction.prompt && (
          <p className="vi-text-muted text-center text-sm font-body">{interaction.prompt}</p>
        )}
        <button
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl bg-white vi-border border-[3px] hover:vi-surface-soft hover:scale-110 active:scale-95 transition-all shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(var(--visual-primary))]"
          style={{ boxShadow: `0 4px 14px ${accentColor}33` }}
          onClick={() => onAnswer(true)}
          aria-label="Tap to speak your answer"
        >
          <span aria-hidden="true">🎤</span>
        </button>
        <p className="vi-text-muted text-xs font-body" aria-hidden="true">Tap to speak your answer</p>
      </div>
    );
  }

  if (interaction.type === "tap") {
    return (
      <div className="w-full flex justify-center">
        <button
          onClick={() => onAnswer(true)}
          className="px-8 py-4 rounded-2xl bg-white vi-border border-2 text-slate-900 font-heading font-extrabold text-lg hover:vi-surface-soft hover:scale-105 active:scale-95 transition-all shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(var(--visual-primary))]"
          style={{ boxShadow: `0 4px 14px ${accentColor}30` }}
        >
          {interaction.prompt || "Tap to continue"}
        </button>
      </div>
    );
  }

  return null;
}
