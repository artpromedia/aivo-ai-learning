/**
 * Demo beat generator for the lesson stage page.
 *
 * Beats are short scripted lesson sequences played for tutors that don't
 * yet have a real curriculum-driven flow. To support every locale the
 * `@aivo/web` app ships, all human-readable strings (narrations, card
 * titles, choice/drag labels, prompts) are looked up via a
 * `next-intl` translator passed in by the call site — never hard-coded
 * here. This file owns only the *structure* of each beat (visuals,
 * positions, interaction shape, isCorrect flags). Adding a new tutor
 * means appending a new branch below and adding the matching keys to
 * `apps/web/src/i18n/messages/{locale}.json` under `demoBeats.<key>`.
 */
import { TUTORS, type TutorKey } from "@aivo/brand";
import type { Beat, FunctioningLevel } from "@/components/stage/types";

/**
 * Minimal subset of next-intl's `useTranslations()` return shape we
 * actually depend on — accepts an optional values dict for ICU
 * placeholder substitution. Typed loosely so tests can pass plain
 * functions in.
 */
export type DemoBeatsTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function generateDemoBeats(
  tutorKey: string,
  learnerName: string,
  level: FunctioningLevel,
  t: DemoBeatsTranslator,
): Beat[] {
  const tutor = TUTORS[tutorKey as TutorKey];
  if (!tutor) return [];
  const tutorName = tutor.name;
  const domain = tutor.domain;

  const beatSets: Record<string, Beat[]> = {
    nova: [
      { id: "open", type: "narration", tutorState: "speaking", narration: t("nova.open.narration", { name: learnerName }), visuals: [
        { id: "v1", type: "card", content: t("nova.open.card_today_mission"), emoji: "🚀", animation: "bounce", position: { x: 50, y: 30 } },
      ] },
      { id: "warmup", type: "interaction", tutorState: "encouraging", narration: t("nova.warmup.narration"), visuals: [
        { id: "v2", type: "card", content: t("nova.warmup.card_quick_quiz"), emoji: "🪐", animation: "fade_in", position: { x: 50, y: 20 } },
      ], interaction: { type: "multiple_choice", prompt: t("nova.warmup.prompt"), choices: [
        { id: "a", label: t("nova.warmup.choice_jupiter"), emoji: "🟤", isCorrect: false },
        { id: "b", label: t("nova.warmup.choice_saturn"), emoji: "🪐", isCorrect: true },
        { id: "c", label: t("nova.warmup.choice_earth"), emoji: "🌍", isCorrect: false },
        { id: "d", label: t("nova.warmup.choice_mars"), emoji: "🔴", isCorrect: false },
      ] } },
      { id: "core1", type: "demonstration", tutorState: "pointing", narration: t("nova.core1.narration"), visuals: [
        { id: "v3", type: "card", content: t("nova.core1.card_fraction_explorer"), emoji: "🌕", animation: "slide_in", position: { x: 50, y: 25 } },
        { id: "v4", type: "manipulative", content: "🌕,🌗,🌑", animation: "bounce", position: { x: 50, y: 55 } },
      ] },
      { id: "core2", type: "interaction", tutorState: "encouraging", narration: t("nova.core2.narration"), visuals: [
        { id: "v5", type: "card", content: t("nova.core2.card_pizza_fractions"), emoji: "🍕", animation: "fade_in", position: { x: 50, y: 20 } },
      ], interaction: { type: "multiple_choice", prompt: t("nova.core2.prompt"), choices: [
        { id: "a", label: "3/4", emoji: "🍕", isCorrect: true },
        { id: "b", label: "1/4", emoji: "🍕", isCorrect: false },
        { id: "c", label: "2/4", emoji: "🍕", isCorrect: false },
        { id: "d", label: "4/4", emoji: "🍕", isCorrect: false },
      ] } },
      { id: "core3", type: "interaction", tutorState: "thinking", narration: t("nova.core3.narration"), visuals: [
        { id: "v6", type: "card", content: t("nova.core3.card_sort_fractions"), emoji: "📊", animation: "slide_in", position: { x: 50, y: 20 } },
      ], interaction: { type: "drag_drop", prompt: t("nova.core3.prompt"), dragItems: [
        { id: "d1", label: "3/4", emoji: "🔵", targetZone: "z3" },
        { id: "d2", label: "1/4", emoji: "🟢", targetZone: "z1" },
        { id: "d3", label: "1/2", emoji: "🟡", targetZone: "z2" },
      ], dragZones: [
        { id: "z1", label: t("nova.core3.zone_smallest") },
        { id: "z2", label: t("nova.core3.zone_middle") },
        { id: "z3", label: t("nova.core3.zone_largest") },
      ] } },
      { id: "check", type: "interaction", tutorState: "encouraging", narration: t("nova.check.narration"), visuals: [
        { id: "v7", type: "card", content: t("nova.check.card_star_challenge"), emoji: "⭐", animation: "glow", position: { x: 50, y: 20 } },
      ], interaction: { type: "multiple_choice", prompt: t("nova.check.prompt"), choices: [
        { id: "a", label: "3/4", emoji: "✨", isCorrect: true },
        { id: "b", label: "2/4", emoji: "💫", isCorrect: false },
        { id: "c", label: "1/6", emoji: "🌟", isCorrect: false },
      ] } },
      { id: "close", type: "celebration", tutorState: "celebrating", narration: t("nova.close.narration", { name: learnerName }), visuals: [
        { id: "v8", type: "card", content: t("nova.close.card_mission_complete"), emoji: "🏆", animation: "bounce", position: { x: 50, y: 30 } },
      ] },
    ],
    sage: [
      { id: "open", type: "narration", tutorState: "speaking", narration: t("sage.open.narration", { name: learnerName }), visuals: [
        { id: "v1", type: "card", content: t("sage.open.card_story_time"), emoji: "📖", animation: "fade_in", position: { x: 50, y: 30 } },
      ] },
      { id: "warmup", type: "interaction", tutorState: "encouraging", narration: t("sage.warmup.narration"), visuals: [
        { id: "v2", type: "card", content: t("sage.warmup.card_word_power"), emoji: "✏️", animation: "slide_in", position: { x: 50, y: 20 } },
      ], interaction: { type: "multiple_choice", prompt: t("sage.warmup.prompt"), choices: [
        { id: "a", label: t("sage.warmup.choice_joyful"), emoji: "😊", isCorrect: true },
        { id: "b", label: t("sage.warmup.choice_angry"), emoji: "😠", isCorrect: false },
        { id: "c", label: t("sage.warmup.choice_tired"), emoji: "😴", isCorrect: false },
      ] } },
      { id: "core1", type: "demonstration", tutorState: "pointing", narration: t("sage.core1.narration"), visuals: [
        { id: "v3", type: "card", content: t("sage.core1.card_story_elements"), emoji: "🎭", animation: "bounce", position: { x: 50, y: 20 } },
        { id: "v4", type: "shape", content: "👤", emoji: "👤", animation: "slide_in", position: { x: 20, y: 50 }, color: "#10B981" },
        { id: "v5", type: "shape", content: "🏰", emoji: "🏰", animation: "slide_in", position: { x: 50, y: 50 }, color: "#3B82F6" },
        { id: "v6", type: "shape", content: "⚡", emoji: "⚡", animation: "slide_in", position: { x: 80, y: 50 }, color: "#F59E0B" },
      ] },
      { id: "core2", type: "interaction", tutorState: "thinking", narration: t("sage.core2.narration"), visuals: [
        { id: "v7", type: "card", content: t("sage.core2.card_reading_detective"), emoji: "🔍", animation: "fade_in", position: { x: 50, y: 20 } },
      ], interaction: { type: "multiple_choice", prompt: t("sage.core2.prompt"), choices: [
        { id: "a", label: t("sage.core2.choice_cottage"), emoji: "🏠", isCorrect: true },
        { id: "b", label: t("sage.core2.choice_spaceship"), emoji: "🚀", isCorrect: false },
        { id: "c", label: t("sage.core2.choice_school"), emoji: "🏫", isCorrect: false },
      ] } },
      { id: "check", type: "interaction", tutorState: "encouraging", narration: t("sage.check.narration"), visuals: [
        { id: "v8", type: "card", content: t("sage.check.card_match_game"), emoji: "🧩", animation: "glow", position: { x: 50, y: 20 } },
      ], interaction: { type: "drag_drop", prompt: t("sage.check.prompt"), dragItems: [
        { id: "d1", label: t("sage.check.item_character"), emoji: "👤", targetZone: "z1" },
        { id: "d2", label: t("sage.check.item_setting"), emoji: "🏰", targetZone: "z2" },
        { id: "d3", label: t("sage.check.item_plot"), emoji: "⚡", targetZone: "z3" },
      ], dragZones: [
        { id: "z1", label: t("sage.check.zone_who") },
        { id: "z2", label: t("sage.check.zone_where") },
        { id: "z3", label: t("sage.check.zone_what_happens") },
      ] } },
      { id: "close", type: "celebration", tutorState: "celebrating", narration: t("sage.close.narration", { name: learnerName }), visuals: [
        { id: "v9", type: "card", content: t("sage.close.card_chapter_complete"), emoji: "📚", animation: "bounce", position: { x: 50, y: 30 } },
      ] },
    ],
  };

  const defaultBeats: Beat[] = [
    { id: "open", type: "narration", tutorState: "speaking", narration: t("default.open.narration", { name: learnerName, tutorName }), visuals: [
      { id: "v1", type: "card", content: t("default.open.card_welcome", { tutorName }), emoji: tutor.icon, animation: "bounce", position: { x: 50, y: 30 } },
    ] },
    { id: "warmup", type: "interaction", tutorState: "encouraging", narration: t("default.warmup.narration"), visuals: [
      { id: "v2", type: "card", content: t("default.warmup.card_warmup"), emoji: "⚡", animation: "slide_in", position: { x: 50, y: 20 } },
    ], interaction: { type: "multiple_choice", prompt: t("default.warmup.prompt", { tutorName }), choices: [
      { id: "a", label: domain, emoji: tutor.icon, isCorrect: true },
      { id: "b", label: t("default.warmup.choice_swimming"), emoji: "🏊", isCorrect: false },
      { id: "c", label: t("default.warmup.choice_cooking"), emoji: "🍳", isCorrect: false },
    ] } },
    { id: "core1", type: "demonstration", tutorState: "pointing", narration: t("default.core1.narration", { domain }), visuals: [
      { id: "v3", type: "card", content: t("default.core1.card_exploring", { domain }), emoji: tutor.icon, animation: "fade_in", position: { x: 50, y: 25 } },
      { id: "v4", type: "text", content: t("default.core1.text_curiosity"), animation: "slide_in", position: { x: 50, y: 55 } },
    ] },
    { id: "core2", type: "interaction", tutorState: "thinking", narration: t("default.core2.narration"), visuals: [
      { id: "v5", type: "card", content: t("default.core2.card_your_turn"), emoji: "🎯", animation: "bounce", position: { x: 50, y: 20 } },
    ], interaction: { type: "tap", prompt: t("default.core2.prompt") } },
    { id: "check", type: "interaction", tutorState: "encouraging", narration: t("default.check.narration"), visuals: [
      { id: "v6", type: "card", content: t("default.check.card_final_challenge"), emoji: "⭐", animation: "glow", position: { x: 50, y: 20 } },
    ], interaction: { type: "multiple_choice", prompt: t("default.check.prompt"), choices: [
      { id: "a", label: t("default.check.choice_yes"), emoji: "🎉", isCorrect: true },
      { id: "b", label: t("default.check.choice_great"), emoji: "⭐", isCorrect: true },
    ] } },
    { id: "close", type: "celebration", tutorState: "celebrating", narration: t("default.close.narration", { name: learnerName }), visuals: [
      { id: "v7", type: "card", content: t("default.close.card_session_complete"), emoji: "🏆", animation: "bounce", position: { x: 50, y: 30 } },
    ] },
  ];

  let beats = beatSets[tutorKey] || defaultBeats;

  if (level === "LOW_VERBAL" || level === "NON_VERBAL" || level === "PRE_SYMBOLIC") {
    beats = beats.map((b) => ({
      ...b,
      visuals: b.visuals.slice(0, 2),
      interaction: b.interaction ? {
        ...b.interaction,
        choices: b.interaction.choices?.slice(0, 2),
      } : undefined,
    }));
  }

  return beats;
}
