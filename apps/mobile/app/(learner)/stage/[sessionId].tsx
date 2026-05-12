import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, AppState } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useLearners } from '@/hooks/useLearners';
import { apiFetch } from '@/lib/api';
import { API } from '@/constants/api';
import { spacing } from '@/constants/colors';
import { useTierTheme, type TierThemeMobile } from '@aivo/mobile-ui';
import { useWindowSizeClass } from '@/src/design/useWindowSizeClass';
import { ScratchPad } from '@/src/components/learning/ScratchPad';
import { CONTENT_MAX_WIDTH } from '@/src/design/responsive';

// ── Offline outbox ──────────────────────────────────────────────────────────
// Session-end payloads are queued in AsyncStorage when offline and flushed
// when the app regains connectivity (NetInfo). This preserves mastery data
// for learners in low-connectivity environments.

interface SessionEndPayload {
  sessionId: string;
  masteryUpdates: Record<string, number>;
  xpEarned: number;
  queuedAt: number;
}

const OUTBOX_KEY = '@aivo/session_outbox';

async function getAsyncStorage(): Promise<any> {
  try {
    // Optional native dep — gracefully degrades when not installed.
     
    return (await import('@react-native-async-storage/async-storage')).default;
  } catch {
    return null;
  }
}

async function queueSessionEnd(payload: SessionEndPayload): Promise<void> {
  const AsyncStorage = await getAsyncStorage();
  if (!AsyncStorage) return;
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_KEY);
    const outbox: SessionEndPayload[] = raw ? JSON.parse(raw) : [];
    outbox.push(payload);
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
  } catch {
    // Storage error — best effort.
  }
}

async function flushOutbox(learningApiBase: string, authHeader: string): Promise<void> {
  const AsyncStorage = await getAsyncStorage();
  if (!AsyncStorage) return;
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_KEY);
    if (!raw) return;
    const outbox: SessionEndPayload[] = JSON.parse(raw);
    if (outbox.length === 0) return;

    const remaining: SessionEndPayload[] = [];
    for (const payload of outbox) {
      try {
        const res = await fetch(`${learningApiBase}/api/learning/sessions/${payload.sessionId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: authHeader },
          body: JSON.stringify({ masteryUpdates: payload.masteryUpdates, xpEarned: payload.xpEarned }),
        });
        if (!res.ok) remaining.push(payload);
      } catch {
        remaining.push(payload);
      }
    }
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(remaining));
  } catch {
    // Storage error — best effort.
  }
}

interface Question {
  text: string;
  options: string[];
  correctAnswer: string;
}

const QUESTIONS: Question[] = [
  { text: 'What is 7 × 8?', options: ['48', '54', '56', '63'], correctAnswer: '56' },
  { text: 'What is 9 × 6?', options: ['45', '54', '56', '63'], correctAnswer: '54' },
  { text: 'What is 12 × 5?', options: ['55', '60', '65', '70'], correctAnswer: '60' },
  { text: 'What is 8 × 9?', options: ['63', '72', '81', '64'], correctAnswer: '72' },
  { text: 'What is 11 × 7?', options: ['67', '70', '77', '84'], correctAnswer: '77' },
];

/**
 * Tier-specific copy & affordances. The structure of the stage stays the
 * same across all three age bands; what changes is voice, density, and
 * the completion celebration's emotional register.
 */
const TIER_VOICE = {
  EARLY: {
    encourage: "🎉 Yay! You got it!",
    correctOpener: '🎉 ',
    miss: (answer: string) => `Almost! Sora says it's ${answer}!`,
    completionEmoji: (score: number) => (score >= 80 ? '🎉' : score >= 60 ? '👏' : '💪'),
    completionTitle: 'Adventure complete!',
    nextLabel: 'Next →',
    finishLabel: 'Yay! All done',
    homeLabel: 'Back to the meadow',
    questionFontSize: 30,
    answerFontSize: 26,
  },
  MIDDLE: {
    encourage: 'Solid. Kai nods approvingly.',
    correctOpener: '',
    miss: (answer: string) => `Close. The answer was ${answer}.`,
    completionEmoji: (score: number) => (score >= 80 ? '🦊' : score >= 60 ? '🌙' : '🌿'),
    completionTitle: 'Session wrapped',
    nextLabel: 'Next question',
    finishLabel: 'Wrap session',
    homeLabel: 'Back to the treehouse',
    questionFontSize: 26,
    answerFontSize: 22,
  },
  HIGH: {
    encourage: 'Correct.',
    correctOpener: '',
    miss: (answer: string) => `Not quite — answer: ${answer}`,
    completionEmoji: () => '',
    completionTitle: 'Session complete',
    nextLabel: 'Next',
    finishLabel: 'Finish',
    homeLabel: 'Return to dashboard',
    questionFontSize: 22,
    answerFontSize: 20,
  },
} as const;

export default function StageScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: learners } = useLearners();
  const learnerId = user?.role === 'LEARNER' ? user.id : learners?.[0]?.id || '';

  const { tier, theme } = useTierTheme();
  const voice = TIER_VOICE[tier];
  const { sizeClass, isTablet } = useWindowSizeClass();
  const styles = useMemo(
    () => createStyles(theme, voice, sizeClass),
    [theme, voice, sizeClass],
  );
  const [scratchOpen, setScratchOpen] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Flush the offline outbox whenever the app comes to the foreground.
  useEffect(() => {
    const authHeader = user ? `Bearer ${(user as any).accessToken ?? ''}` : '';
    const learningBase = (API as any).LEARNING ?? '';

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        flushOutbox(learningBase, authHeader).catch(() => {});
      }
    });

    // Attempt flush immediately on mount as well.
    flushOutbox(learningBase, authHeader).catch(() => {});

    return () => subscription.remove();
  }, [user]);

  const question = QUESTIONS[currentIndex];

  const handleAnswer = useCallback(
    async (answer: string) => {
      if (answered || submitting) return;
      setSelected(answer);
      setAnswered(true);
      setSubmitting(true);

      const isCorrect = answer === question.correctAnswer;
      if (isCorrect) setCorrectCount((prev) => prev + 1);

      try {
        const res = await apiFetch(API.LEARNING, '/api/learning/gradebook/update', {
          method: 'POST',
          body: JSON.stringify({
            learnerId,
            skill: `multiplication_q${currentIndex + 1}`,
            masteryScore: isCorrect ? 100 : 0,
            sessionType: 'LESSON',
            xpEarned: isCorrect ? 10 : 2,
          }),
        });
        if (!res.ok) {
          Alert.alert('Warning', 'Could not save your answer. Your progress may not be recorded.');
        }
      } catch {
        Alert.alert('Warning', 'Network issue saving your answer. Your progress may not be recorded.');
      }

      setSubmitting(false);
    },
    [answered, submitting, question, learnerId, currentIndex],
  );

  const handleNext = useCallback(async () => {
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setSessionComplete(true);
      const masteryUpdates = { multiplication: Math.round((correctCount / QUESTIONS.length) * 100) };
      const xpEarned = correctCount * 10 + 5;
      try {
        const res = await apiFetch(API.LEARNING, `/api/learning/sessions/${sessionId}/complete`, {
          method: 'POST',
          body: JSON.stringify({ masteryUpdates, xpEarned }),
        });
        if (!res.ok) {
          // Queue for later flush.
          await queueSessionEnd({ sessionId: sessionId ?? '', masteryUpdates, xpEarned, queuedAt: Date.now() });
          Alert.alert('Warning', 'Could not save session results. Your XP will be recorded when connectivity is restored.');
        }
      } catch {
        // Offline — queue for later flush.
        await queueSessionEnd({ sessionId: sessionId ?? '', masteryUpdates, xpEarned, queuedAt: Date.now() });
        Alert.alert('Saved offline', 'Your session results will be synced when you are back online.');
      }
    }
  }, [currentIndex, sessionId, correctCount]);

  const handlePause = useCallback(() => {
    Alert.alert(
      tier === 'HIGH' ? 'Pause session' : 'Pause Session',
      'Your progress will be saved. Continue later?',
      [
        { text: tier === 'EARLY' ? 'Keep going!' : 'Keep going', style: 'cancel' },
        { text: 'Pause & exit', onPress: () => router.back() },
      ],
    );
  }, [tier]);

  if (sessionComplete) {
    const score = Math.round((correctCount / QUESTIONS.length) * 100);
    const emoji = voice.completionEmoji(score);
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        {emoji ? (
          <Text style={{ fontSize: 64 }}>{emoji}</Text>
        ) : (
          <Ionicons name="checkmark-circle" size={72} color={theme.colors.primary} />
        )}
        <Text style={[styles.question, { marginTop: 16, textAlign: 'center', paddingHorizontal: 24 }]}>
          {voice.completionTitle}
        </Text>
        <Text style={[styles.speechText, { fontSize: 20, marginTop: 8 }]}>
          {correctCount} / {QUESTIONS.length} correct ({score}%)
        </Text>
        <Text style={[styles.speechText, { marginTop: 4 }]}>+{correctCount * 10 + 5} XP earned</Text>
        <Pressable style={[styles.nextBtn, { marginTop: 32 }]} onPress={() => router.back()}>
          <Text style={styles.nextBtnText}>{voice.homeLabel}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </Pressable>
        <View style={styles.progressPath}>
          {QUESTIONS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i === currentIndex && styles.progressDotActive,
                i > currentIndex && styles.progressDotInactive,
              ]}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {isTablet ? (
            <Pressable
              onPress={() => setScratchOpen((s) => !s)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={scratchOpen ? 'Close scratchpad' : 'Open scratchpad'}
            >
              <Ionicons
                name={scratchOpen ? 'close-circle-outline' : 'pencil'}
                size={26}
                color={scratchOpen ? theme.colors.primary : theme.colors.text}
              />
            </Pressable>
          ) : null}
          <Pressable onPress={handlePause} hitSlop={12}>
            <Ionicons name="pause" size={28} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.stageRow}>
      <View style={styles.stageColumn}>
      <View style={styles.stageCanvas}>
        {/* HIGH tier hides the mascot tile entirely — Atlas is voice-only,
            keeping the focus studio editorial and uncluttered. */}
        {tier !== 'HIGH' && (
          <View style={styles.tutorArea}>
            <View style={styles.tutorCircle}>
              <Text style={{ fontSize: tier === 'EARLY' ? 44 : 36 }}>{tier === 'EARLY' ? '🦊' : '🌙'}</Text>
            </View>
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>
                {!answered
                  ? t('learnerStage.letsSolve')
                  : selected === question.correctAnswer
                    ? voice.encourage
                    : voice.miss(question.correctAnswer)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.contentArea}>
          <Text style={styles.questionCounter}>
            Question {currentIndex + 1} of {QUESTIONS.length}
          </Text>
          <Text style={styles.question}>{question.text}</Text>
          {tier === 'HIGH' && answered && (
            <Text style={[styles.speechText, { marginTop: 16, textAlign: 'center' }]}>
              {selected === question.correctAnswer ? voice.encourage : voice.miss(question.correctAnswer)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.responseZone}>
        {question.options.map((answer) => {
          const isSelected = selected === answer;
          const isCorrect = answer === question.correctAnswer;
          const showResult = answered && isSelected;
          return (
            <Pressable
              key={answer}
              style={({ pressed }) => [
                styles.answerCard,
                pressed && !answered && styles.answerPressed,
                showResult && isCorrect && styles.answerCorrect,
                showResult && !isCorrect && styles.answerWrong,
                answered && !isSelected && isCorrect && styles.answerRevealCorrect,
              ]}
              onPress={() => handleAnswer(answer)}
              disabled={answered}
            >
              {submitting && isSelected ? (
                <ActivityIndicator color={theme.colors.surface} />
              ) : (
                <Text
                  style={[
                    styles.answerText,
                    showResult && (isCorrect || !isCorrect) && { color: theme.colors.surface },
                  ]}
                >
                  {answer}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {answered && !submitting && (
        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {currentIndex < QUESTIONS.length - 1 ? voice.nextLabel : voice.finishLabel}
          </Text>
        </Pressable>
      )}
      </View>

      {isTablet && scratchOpen ? (
        <View style={styles.scratchSide}>
          <ScratchPad gridPaper compactToolbar />
        </View>
      ) : null}
      </View>
    </View>
  );
}

/** Per-tier StyleSheet — colours, radii, weights all derive from the theme. */
function createStyles(
  theme: TierThemeMobile,
  voice: typeof TIER_VOICE[keyof typeof TIER_VOICE],
  sizeClass: 'compact' | 'medium' | 'expanded',
) {
  const isDark = theme.id === 'MIDDLE';
  const isTablet = sizeClass !== 'compact';
  // Cap content width so a 12.9" iPad doesn't render impossibly wide
  // answer cards and a sea of whitespace around the question.
  const stageMaxWidth = sizeClass === 'expanded' ? 760 : sizeClass === 'medium' ? 640 : CONTENT_MAX_WIDTH.workspace;
  // Two columns work on phones; on tablets we want the answers to feel
  // generous without becoming overstuffed strips.
  const answerWidth = isTablet ? '47%' : '47%';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg },
    stageRow: { flex: 1, flexDirection: isTablet ? 'row' : 'column' },
    stageColumn: {
      flex: 1,
      maxWidth: stageMaxWidth,
      alignSelf: isTablet ? 'flex-start' : 'stretch',
      width: isTablet ? undefined : '100%',
    },
    scratchSide: {
      flex: 1,
      margin: spacing.md,
      marginLeft: 0,
      borderRadius: 16,
      overflow: 'hidden',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
    },
    progressPath: { flexDirection: 'row', gap: 8 },
    progressDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
      opacity: 0.95,
    },
    progressDotActive: {
      backgroundColor: theme.colors.accent,
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    progressDotInactive: { backgroundColor: theme.colors.border },
    stageCanvas: { flex: 1, padding: spacing.md },
    tutorArea: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
    tutorCircle: {
      width: theme.id === 'EARLY' ? 72 : 56,
      height: theme.id === 'EARLY' ? 72 : 56,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    speechBubble: {
      marginLeft: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: 14,
      flex: 1,
      borderWidth: isDark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    speechText: {
      color: theme.colors.text,
      fontSize: 16,
      fontFamily: 'Nunito-Regular',
    },
    contentArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    questionCounter: {
      fontSize: 13,
      fontFamily: 'Nunito-SemiBold',
      color: theme.colors.textSoft,
      marginBottom: 10,
      textTransform: theme.id === 'HIGH' ? 'uppercase' : 'none',
      letterSpacing: theme.id === 'HIGH' ? 1.4 : 0,
    },
    question: {
      fontSize: voice.questionFontSize,
      fontFamily: 'Nunito-ExtraBold',
      color: theme.colors.text,
      textAlign: 'center',
    },
    responseZone: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      padding: spacing.md,
      paddingBottom: 8,
    },
    answerCard: {
      width: answerWidth,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.id === 'EARLY' ? 26 : 20,
      alignItems: 'center',
      borderWidth: theme.id === 'EARLY' ? 2 : 1,
      borderColor: theme.colors.border,
    },
    answerPressed: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
      transform: [{ scale: 0.97 }],
    },
    answerCorrect: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
    answerWrong: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
    answerRevealCorrect: { borderColor: '#16a34a', borderWidth: 2, opacity: 0.85 },
    answerText: {
      fontSize: voice.answerFontSize,
      fontFamily: 'Nunito-ExtraBold',
      color: theme.colors.text,
    },
    nextBtn: {
      marginHorizontal: spacing.md,
      marginBottom: 40,
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.id === 'EARLY' ? 18 : 14,
      borderRadius: theme.id === 'EARLY' ? theme.radius.pill : theme.radius.lg,
      alignItems: 'center',
    },
    nextBtnText: {
      fontSize: 18,
      fontFamily: 'Nunito-Bold',
      color: '#FFFFFF',
    },
  });
}
