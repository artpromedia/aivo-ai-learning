"use client";
import { useState, useCallback, useRef } from "react";
import type {
  DiscoveryState,
  AdventurePhase,
  DifficultyTier,
  ChapterResult,
  ChapterActivities,
  Activity,
  AdventureChapter,
  FunctioningLevel,
} from "./types";
import { ADVENTURE_CHAPTERS, FUNCTIONING_LEVEL_CONFIG } from "./types";

const FALLBACK_ACTIVITIES: Record<string, ChapterActivities> = {
  sage_story_garden: {
    easy: [
      { id: "ela_e1", title: "The Word Garden", narration: "Welcome to my garden! These trees grow the most beautiful words. Let me show you!", tutorLine: "Which word tells us what the cat is doing?", interaction: "tap_image", choices: [{ id: "a", label: "Sleeping", emoji: "😴", isCorrect: false }, { id: "b", label: "Running", emoji: "🏃", isCorrect: true }, { id: "c", label: "Eating", emoji: "🍽️", isCorrect: false }], sceneEmoji: "🌳", difficulty: "easy", brainMeasures: ["vocabulary"] },
      { id: "ela_e2", title: "Story Stream", narration: "Look! A story is floating down the stream. Let me read it to you!", tutorLine: "The bird flew to the tree. Where did the bird go?", interaction: "tap_image", choices: [{ id: "a", label: "Tree", emoji: "🌲", isCorrect: true }, { id: "b", label: "House", emoji: "🏠", isCorrect: false }, { id: "c", label: "Lake", emoji: "🏊", isCorrect: false }], sceneEmoji: "🌊", difficulty: "easy", brainMeasures: ["comprehension"] },
      { id: "ela_e3", title: "Rhyme Time", narration: "The flowers in my garden love to rhyme! Can you find the rhyming word?", tutorLine: "Which word rhymes with 'cat'?", interaction: "tap_word", choices: [{ id: "a", label: "Hat", emoji: "🎩", isCorrect: true }, { id: "b", label: "Dog", emoji: "🐕", isCorrect: false }, { id: "c", label: "Cup", emoji: "☕", isCorrect: false }], sceneEmoji: "🌸", difficulty: "easy", brainMeasures: ["phonics"] },
    ],
    medium: [
      { id: "ela_m1", title: "Word Garden", narration: "These special trees grow bigger words! Let's explore them together.", tutorLine: "What does the word 'enormous' mean?", interaction: "tap_image", choices: [{ id: "a", label: "Very small", emoji: "🐜", isCorrect: false }, { id: "b", label: "Very big", emoji: "🦕", isCorrect: true }, { id: "c", label: "Very fast", emoji: "⚡", isCorrect: false }, { id: "d", label: "Very quiet", emoji: "🤫", isCorrect: false }], sceneEmoji: "🌳", difficulty: "medium", brainMeasures: ["vocabulary"] },
      { id: "ela_m2", title: "Story Detective", narration: "A mysterious story appeared in the garden! Can you figure out what happened?", tutorLine: "Sam was sad because his kite got stuck. What happened to the kite?", interaction: "tap_image", choices: [{ id: "a", label: "It flew away", emoji: "🦅", isCorrect: false }, { id: "b", label: "It got stuck", emoji: "🌳", isCorrect: true }, { id: "c", label: "It broke", emoji: "💔", isCorrect: false }, { id: "d", label: "It landed", emoji: "🛬", isCorrect: false }], sceneEmoji: "🔍", difficulty: "medium", brainMeasures: ["comprehension"] },
    ],
    hard: [
      { id: "ela_h1", title: "Advanced Word Garden", narration: "The rarest words in my garden are blooming! These are special.", tutorLine: "Choose the word that means 'to make something better':", interaction: "tap_word", choices: [{ id: "a", label: "Improve", emoji: "⬆️", isCorrect: true }, { id: "b", label: "Destroy", emoji: "💥", isCorrect: false }, { id: "c", label: "Ignore", emoji: "🙈", isCorrect: false }, { id: "d", label: "Delay", emoji: "⏰", isCorrect: false }], sceneEmoji: "🌺", difficulty: "hard", brainMeasures: ["vocabulary", "inference"] },
    ],
  },
  nova_number_galaxy: {
    easy: [
      { id: "math_e1", title: "Star Counting", narration: "Look at all these beautiful stars! Let's count them together!", tutorLine: "How many stars do you see? ⭐⭐⭐⭐⭐", interaction: "tap_image", choices: [{ id: "a", label: "3", emoji: "3️⃣", isCorrect: false }, { id: "b", label: "5", emoji: "5️⃣", isCorrect: true }, { id: "c", label: "7", emoji: "7️⃣", isCorrect: false }], sceneEmoji: "🌌", difficulty: "easy", brainMeasures: ["number sense"] },
      { id: "math_e2", title: "Planet Puzzles", narration: "A planet with 3 moons met a planet with 2 moons!", tutorLine: "How many moons are there altogether?", interaction: "tap_image", choices: [{ id: "a", label: "4", emoji: "4️⃣", isCorrect: false }, { id: "b", label: "5", emoji: "5️⃣", isCorrect: true }, { id: "c", label: "6", emoji: "6️⃣", isCorrect: false }], sceneEmoji: "🪐", difficulty: "easy", brainMeasures: ["addition"] },
      { id: "math_e3", title: "Asteroid Shapes", narration: "The asteroids come in different shapes! Can you find the right one?", tutorLine: "Which shape has 3 sides?", interaction: "tap_image", choices: [{ id: "a", label: "Triangle", emoji: "🔺", isCorrect: true }, { id: "b", label: "Square", emoji: "⬛", isCorrect: false }, { id: "c", label: "Circle", emoji: "⚪", isCorrect: false }], sceneEmoji: "☄️", difficulty: "easy", brainMeasures: ["geometry"] },
    ],
    medium: [
      { id: "math_m1", title: "Star Clusters", narration: "These stars are arranged in a special pattern. Can you figure it out?", tutorLine: "There are 3 rows of 4 stars. How many stars total?", interaction: "tap_image", choices: [{ id: "a", label: "7", emoji: "7️⃣", isCorrect: false }, { id: "b", label: "10", emoji: "🔟", isCorrect: false }, { id: "c", label: "12", emoji: "1️⃣2️⃣", isCorrect: true }, { id: "d", label: "15", emoji: "1️⃣5️⃣", isCorrect: false }], sceneEmoji: "✨", difficulty: "medium", brainMeasures: ["multiplication"] },
    ],
    hard: [
      { id: "math_h1", title: "Galaxy Equations", narration: "The deepest part of the galaxy has the trickiest challenges!", tutorLine: "If 24 stars are shared equally among 6 planets, how many stars per planet?", interaction: "tap_image", choices: [{ id: "a", label: "3", emoji: "3️⃣", isCorrect: false }, { id: "b", label: "4", emoji: "4️⃣", isCorrect: true }, { id: "c", label: "5", emoji: "5️⃣", isCorrect: false }, { id: "d", label: "6", emoji: "6️⃣", isCorrect: false }], sceneEmoji: "🌠", difficulty: "hard", brainMeasures: ["division"] },
    ],
  },
  spark_discovery_lab: {
    easy: [
      { id: "sci_e1", title: "Sorting Station", narration: "My lab is a mess! Can you help me figure out which ones are living things?", tutorLine: "Which one is alive?", interaction: "tap_image", choices: [{ id: "a", label: "Rock", emoji: "🪨", isCorrect: false }, { id: "b", label: "Flower", emoji: "🌻", isCorrect: true }, { id: "c", label: "Cup", emoji: "☕", isCorrect: false }], sceneEmoji: "🧪", difficulty: "easy", brainMeasures: ["classification"] },
      { id: "sci_e2", title: "Weather Window", narration: "Look out the window! What do you see happening outside?", tutorLine: "What kind of weather do you see? ☁️💧", interaction: "tap_image", choices: [{ id: "a", label: "Sunny", emoji: "☀️", isCorrect: false }, { id: "b", label: "Rainy", emoji: "🌧️", isCorrect: true }, { id: "c", label: "Snowy", emoji: "❄️", isCorrect: false }], sceneEmoji: "🌤️", difficulty: "easy", brainMeasures: ["observation"] },
    ],
    medium: [
      { id: "sci_m1", title: "The Experiment", narration: "Let's do an experiment! If I push this ball off the table...", tutorLine: "What will happen to the ball?", interaction: "tap_image", choices: [{ id: "a", label: "It flies up", emoji: "⬆️", isCorrect: false }, { id: "b", label: "It falls down", emoji: "⬇️", isCorrect: true }, { id: "c", label: "It disappears", emoji: "💨", isCorrect: false }, { id: "d", label: "Nothing", emoji: "🤷", isCorrect: false }], sceneEmoji: "⚗️", difficulty: "medium", brainMeasures: ["cause and effect"] },
    ],
    hard: [
      { id: "sci_h1", title: "Deep Discovery", narration: "Time for advanced science! The water cycle is fascinating.", tutorLine: "When water heats up and turns into vapor, what is that called?", interaction: "tap_word", choices: [{ id: "a", label: "Evaporation", emoji: "💨", isCorrect: true }, { id: "b", label: "Condensation", emoji: "💧", isCorrect: false }, { id: "c", label: "Precipitation", emoji: "🌧️", isCorrect: false }, { id: "d", label: "Collection", emoji: "🏊", isCorrect: false }], sceneEmoji: "🔬", difficulty: "hard", brainMeasures: ["scientific vocabulary"] },
    ],
  },
  harmony_feelings_treehouse: {
    easy: [
      { id: "sel_e1", title: "Emotion Mirror", narration: "Welcome to my cozy treehouse! Let's talk about feelings.", tutorLine: "This person dropped their ice cream. How do they feel?", interaction: "emotion_pick", choices: [{ id: "a", label: "Happy", emoji: "😊", isCorrect: false }, { id: "b", label: "Sad", emoji: "😢", isCorrect: true }, { id: "c", label: "Angry", emoji: "😠", isCorrect: false }], sceneEmoji: "🪞", difficulty: "easy", brainMeasures: ["emotion recognition"] },
      { id: "sel_e2", title: "Story Scenarios", narration: "Let me tell you about Alex and Jordan. They both want the same toy.", tutorLine: "What is a kind thing they could do?", interaction: "tap_image", choices: [{ id: "a", label: "Take turns", emoji: "🔄", isCorrect: true }, { id: "b", label: "Grab it", emoji: "✊", isCorrect: false }, { id: "c", label: "Walk away angry", emoji: "😤", isCorrect: false }], sceneEmoji: "🧸", difficulty: "easy", brainMeasures: ["social reasoning"] },
    ],
    medium: [
      { id: "sel_m1", title: "Feelings Check", narration: "Sometimes big feelings can be hard to handle. That's totally normal!", tutorLine: "When you feel angry, what is a helpful thing to do?", interaction: "tap_image", choices: [{ id: "a", label: "Take deep breaths", emoji: "🌬️", isCorrect: true }, { id: "b", label: "Yell at someone", emoji: "😡", isCorrect: false }, { id: "c", label: "Break something", emoji: "💥", isCorrect: false }, { id: "d", label: "Hide forever", emoji: "🫥", isCorrect: false }], sceneEmoji: "💛", difficulty: "medium", brainMeasures: ["self-regulation"] },
    ],
    hard: [
      { id: "sel_h1", title: "Empathy Explorer", narration: "Understanding others is a superpower!", tutorLine: "Your friend seems quiet today and isn't playing. What might help?", interaction: "tap_image", choices: [{ id: "a", label: "Ask if they're okay", emoji: "💬", isCorrect: true }, { id: "b", label: "Ignore them", emoji: "🙈", isCorrect: false }, { id: "c", label: "Tell them to be happy", emoji: "😁", isCorrect: false }, { id: "d", label: "Laugh at them", emoji: "🤣", isCorrect: false }], sceneEmoji: "🤝", difficulty: "hard", brainMeasures: ["empathy", "perspective-taking"] },
    ],
  },
  echo_sound_studio: {
    easy: [
      { id: "sp_e1", title: "Sound Safari", narration: "Welcome to my studio! Let's listen to some sounds.", tutorLine: "Which animal makes a 'moo' sound?", interaction: "tap_image", choices: [{ id: "a", label: "Dog", emoji: "🐕", isCorrect: false }, { id: "b", label: "Cow", emoji: "🐄", isCorrect: true }, { id: "c", label: "Cat", emoji: "🐱", isCorrect: false }], sceneEmoji: "🎤", difficulty: "easy", brainMeasures: ["sound discrimination"] },
      { id: "sp_e2", title: "Word Builder", narration: "Let's play with words! Some words start with the same sound.", tutorLine: "Which word starts with the same sound as 'ball'?", interaction: "tap_image", choices: [{ id: "a", label: "Bear", emoji: "🐻", isCorrect: true }, { id: "b", label: "Cat", emoji: "🐱", isCorrect: false }, { id: "c", label: "Fish", emoji: "🐟", isCorrect: false }], sceneEmoji: "🔤", difficulty: "easy", brainMeasures: ["phonemic awareness"] },
    ],
    medium: [
      { id: "sp_m1", title: "Syllable Beats", narration: "Words have beats just like music! Let's clap them out.", tutorLine: "How many syllables in 'butterfly'? 🦋", interaction: "tap_image", choices: [{ id: "a", label: "2", emoji: "2️⃣", isCorrect: false }, { id: "b", label: "3", emoji: "3️⃣", isCorrect: true }, { id: "c", label: "4", emoji: "4️⃣", isCorrect: false }, { id: "d", label: "1", emoji: "1️⃣", isCorrect: false }], sceneEmoji: "🎵", difficulty: "medium", brainMeasures: ["syllable awareness"] },
    ],
    hard: [
      { id: "sp_h1", title: "Language Lab", narration: "You're ready for the advanced studio! Let's explore expressions.", tutorLine: "What does 'break a leg' mean?", interaction: "tap_word", choices: [{ id: "a", label: "Good luck!", emoji: "🍀", isCorrect: true }, { id: "b", label: "Be careful", emoji: "⚠️", isCorrect: false }, { id: "c", label: "Run fast", emoji: "🏃", isCorrect: false }, { id: "d", label: "Sit down", emoji: "🪑", isCorrect: false }], sceneEmoji: "🎙️", difficulty: "hard", brainMeasures: ["figurative language"] },
    ],
  },
  pixel_puzzle_palace: {
    easy: [
      { id: "ef_e1", title: "Pattern Path", narration: "Welcome to my puzzle palace! The floor has a pattern. Can you complete it?", tutorLine: "Red, Blue, Red, Blue, ___?", interaction: "tap_image", choices: [{ id: "a", label: "Red", emoji: "🔴", isCorrect: true }, { id: "b", label: "Green", emoji: "🟢", isCorrect: false }, { id: "c", label: "Yellow", emoji: "🟡", isCorrect: false }], sceneEmoji: "🧩", difficulty: "easy", brainMeasures: ["pattern recognition"] },
      { id: "ef_e2", title: "Memory Bridge", narration: "Look carefully! I'll show you some items and then they'll hide.", tutorLine: "Which item did you see first?", interaction: "tap_image", choices: [{ id: "a", label: "Star", emoji: "⭐", isCorrect: true }, { id: "b", label: "Moon", emoji: "🌙", isCorrect: false }, { id: "c", label: "Sun", emoji: "☀️", isCorrect: false }], sceneEmoji: "🌉", difficulty: "easy", brainMeasures: ["working memory"] },
    ],
    medium: [
      { id: "ef_m1", title: "Sorting Challenge", narration: "Quick! Sort these by color... wait, now sort by shape instead!", tutorLine: "You were sorting by color. Now which group does the BLUE TRIANGLE go in?", interaction: "tap_image", choices: [{ id: "a", label: "Triangles", emoji: "🔺", isCorrect: true }, { id: "b", label: "Blue things", emoji: "🔵", isCorrect: false }, { id: "c", label: "Small things", emoji: "🤏", isCorrect: false }, { id: "d", label: "Circles", emoji: "⭕", isCorrect: false }], sceneEmoji: "🎯", difficulty: "medium", brainMeasures: ["cognitive flexibility"] },
    ],
    hard: [
      { id: "ef_h1", title: "Strategy Master", narration: "The ultimate puzzle! This requires planning ahead.", tutorLine: "You have a big project due Friday. What's the best approach?", interaction: "tap_image", choices: [{ id: "a", label: "Break it into small steps", emoji: "📋", isCorrect: true }, { id: "b", label: "Wait until Thursday", emoji: "⏰", isCorrect: false }, { id: "c", label: "Hope it goes away", emoji: "🤞", isCorrect: false }, { id: "d", label: "Copy someone else", emoji: "📄", isCorrect: false }], sceneEmoji: "🏰", difficulty: "hard", brainMeasures: ["planning", "task initiation"] },
    ],
  },
};

interface UseDiscoveryEngineProps {
  learnerId: string;
  learnerName: string;
  functioningLevel: FunctioningLevel;
  accessToken: string | null;
}

export function useDiscoveryEngine({ learnerId, learnerName, functioningLevel, accessToken }: UseDiscoveryEngineProps) {
  const config = FUNCTIONING_LEVEL_CONFIG[functioningLevel] || FUNCTIONING_LEVEL_CONFIG.STANDARD;
  const chapters = ADVENTURE_CHAPTERS.slice(0, config.chaptersCount);

  const [state, setState] = useState<DiscoveryState>({
    phase: "loading",
    currentChapterIdx: 0,
    currentActivityIdx: 0,
    chapterResults: [],
    startedAt: Date.now(),
    currentDifficulty: "easy",
    streakCorrect: 0,
    streakWrong: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    xpEarned: 0,
    favoriteChapterIdx: 0,
    responseLatencies: [],
  });

  const chapterActivitiesRef = useRef<Record<string, ChapterActivities>>({});
  const chapterCorrectRef = useRef(0);
  const chapterTotalRef = useRef(0);
  const chapterLatenciesRef = useRef<number[]>([]);
  const loadingChapterRef = useRef<string | null>(null);

  const loadChapterActivities = useCallback(async (chapter: AdventureChapter): Promise<ChapterActivities> => {
    if (chapterActivitiesRef.current[chapter.id]) {
      return chapterActivitiesRef.current[chapter.id];
    }

    if (!accessToken) {
      const fallback = FALLBACK_ACTIVITIES[chapter.id] || FALLBACK_ACTIVITIES.sage_story_garden;
      chapterActivitiesRef.current[chapter.id] = fallback;
      return fallback;
    }

    try {
      const res = await fetch(`/api/assessments/learner/discovery/${learnerId}/chapter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          chapter: {
            id: chapter.id,
            title: chapter.title,
            subtitle: chapter.subtitle,
            domain: chapter.domain,
            tutorKey: chapter.tutorKey,
            sceneDescription: chapter.sceneDescription,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.generated && data.activities) {
          const activities = data.activities as ChapterActivities;
          const hasActivities = ["easy", "medium", "hard"].some(
            tier => (activities[tier as DifficultyTier] || []).length > 0
          );
          if (hasActivities) {
            chapterActivitiesRef.current[chapter.id] = activities;
            return activities;
          }
        }
      }
    } catch {
    }

    const fallback = FALLBACK_ACTIVITIES[chapter.id] || FALLBACK_ACTIVITIES.sage_story_garden;
    chapterActivitiesRef.current[chapter.id] = fallback;
    return fallback;
  }, [accessToken, learnerId]);

  const getCurrentActivities = useCallback((): Activity[] => {
    const chapter = chapters[state.currentChapterIdx];
    if (!chapter) return [];
    const chapterActs = chapterActivitiesRef.current[chapter.id];
    if (!chapterActs) return [];
    const tierActs = chapterActs[state.currentDifficulty] || chapterActs.easy || [];
    return tierActs.slice(0, config.activitiesPerChapter);
  }, [state.currentChapterIdx, state.currentDifficulty, chapters, config.activitiesPerChapter]);

  const getCurrentActivity = useCallback((): Activity | null => {
    const activities = getCurrentActivities();
    return activities[state.currentActivityIdx] || null;
  }, [getCurrentActivities, state.currentActivityIdx]);

  const startAdventure = useCallback(() => {
    setState(s => ({ ...s, phase: "pre-adventure", startedAt: Date.now() }));
  }, []);

  const beginFirstChapter = useCallback(async () => {
    if (chapters.length === 0) {
      setState(s => ({ ...s, phase: "finale" }));
      return;
    }
    setState(s => ({ ...s, phase: "loading" }));
    await loadChapterActivities(chapters[0]);
    chapterCorrectRef.current = 0;
    chapterTotalRef.current = 0;
    chapterLatenciesRef.current = [];
    setState(s => ({ ...s, phase: "chapter-intro", currentChapterIdx: 0, currentActivityIdx: 0, currentDifficulty: "easy" }));
  }, [chapters, loadChapterActivities]);

  const startChapterActivities = useCallback(() => {
    setState(s => ({ ...s, phase: "activity", currentActivityIdx: 0 }));
  }, []);

  const handleAnswer = useCallback((correct: boolean, latencyMs: number) => {
    if (correct) chapterCorrectRef.current++;
    chapterTotalRef.current++;
    chapterLatenciesRef.current.push(latencyMs);

    setState(s => {
      const newStreakCorrect = correct ? s.streakCorrect + 1 : 0;
      const newStreakWrong = correct ? 0 : s.streakWrong + 1;
      const newXp = s.xpEarned + (correct ? 10 : 3);

      const chapter = chapters[s.currentChapterIdx];
      if (!chapter) return s;

      const chapterActs = chapterActivitiesRef.current[chapter.id];
      if (!chapterActs) return s;
      const tierActs = chapterActs[s.currentDifficulty] || chapterActs.easy || [];
      const activities = tierActs.slice(0, config.activitiesPerChapter);
      const nextIdx = s.currentActivityIdx + 1;

      if (nextIdx >= activities.length) {
        let nextDifficulty = s.currentDifficulty;
        const chapterPct = chapterCorrectRef.current / Math.max(1, chapterTotalRef.current);
        if (chapterPct >= 0.8 && s.currentDifficulty === "easy") nextDifficulty = "medium";
        else if (chapterPct >= 0.8 && s.currentDifficulty === "medium") nextDifficulty = "hard";
        else if (chapterPct < 0.4 && s.currentDifficulty === "hard") nextDifficulty = "medium";
        else if (chapterPct < 0.4 && s.currentDifficulty === "medium") nextDifficulty = "easy";

        const result: ChapterResult = {
          chapterId: chapter.id,
          domain: chapter.domain,
          correct: chapterCorrectRef.current,
          total: chapterTotalRef.current,
          avgLatencyMs: chapterLatenciesRef.current.length > 0
            ? chapterLatenciesRef.current.reduce((a, b) => a + b, 0) / chapterLatenciesRef.current.length
            : 0,
          difficulty: s.currentDifficulty,
        };

        return {
          ...s,
          phase: "chapter-complete" as AdventurePhase,
          totalCorrect: s.totalCorrect + (correct ? 1 : 0),
          totalAttempts: s.totalAttempts + 1,
          streakCorrect: newStreakCorrect,
          streakWrong: newStreakWrong,
          xpEarned: newXp,
          currentDifficulty: nextDifficulty,
          chapterResults: [...s.chapterResults, result],
          responseLatencies: [...s.responseLatencies, latencyMs],
        };
      }

      return {
        ...s,
        currentActivityIdx: nextIdx,
        totalCorrect: s.totalCorrect + (correct ? 1 : 0),
        totalAttempts: s.totalAttempts + 1,
        streakCorrect: newStreakCorrect,
        streakWrong: newStreakWrong,
        xpEarned: newXp,
        responseLatencies: [...s.responseLatencies, latencyMs],
      };
    });
  }, [chapters, config.activitiesPerChapter]);

  const advanceToNextChapter = useCallback(async () => {
    const nextIdx = state.currentChapterIdx + 1;
    if (nextIdx >= chapters.length) {
      setState(s => ({ ...s, phase: "finale" }));
      return;
    }

    setState(s => ({ ...s, phase: "loading" }));
    await loadChapterActivities(chapters[nextIdx]);
    chapterCorrectRef.current = 0;
    chapterTotalRef.current = 0;
    chapterLatenciesRef.current = [];
    setState(s => ({
      ...s,
      phase: "chapter-intro",
      currentChapterIdx: nextIdx,
      currentActivityIdx: 0,
    }));
  }, [state.currentChapterIdx, chapters, loadChapterActivities]);

  const finishAdventure = useCallback(() => {
    setState(s => ({ ...s, phase: "results" }));
  }, []);

  const submitResults = useCallback(async (): Promise<{ success: boolean; brain?: any; error?: string }> => {
    if (!accessToken) return { success: false, error: "No auth token" };

    try {
      const res = await fetch(`/api/assessments/learner/discovery/${learnerId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          chapterResults: state.chapterResults,
          totalCorrect: state.totalCorrect,
          totalAttempts: state.totalAttempts,
          xpEarned: state.xpEarned,
          responseLatencies: state.responseLatencies,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, brain: data.brain };
      } else {
        const err = await res.text();
        return { success: false, error: err };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, [accessToken, learnerId, state.chapterResults, state.totalCorrect, state.totalAttempts, state.xpEarned, state.responseLatencies]);

  return {
    state,
    chapters,
    config,
    getCurrentActivity,
    getCurrentActivities,
    startAdventure,
    beginFirstChapter,
    startChapterActivities,
    handleAnswer,
    advanceToNextChapter,
    finishAdventure,
    submitResults,
  };
}
