import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useLearners } from '@/hooks/useLearners';
import { apiFetch } from '@/lib/api';
import { API } from '@/constants/api';
import { colors, spacing } from '@/constants/colors';

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

export default function StageScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: learners } = useLearners();
  const learnerId = user?.role === 'LEARNER' ? user.id : learners?.[0]?.id || '';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  const question = QUESTIONS[currentIndex];

  const handleAnswer = useCallback(async (answer: string) => {
    if (answered || submitting) return;
    setSelected(answer);
    setAnswered(true);
    setSubmitting(true);

    const isCorrect = answer === question.correctAnswer;
    if (isCorrect) setCorrectCount(prev => prev + 1);

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
  }, [answered, submitting, question, learnerId, currentIndex]);

  const handleNext = useCallback(async () => {
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setSessionComplete(true);
      try {
        const res = await apiFetch(API.LEARNING, `/api/learning/sessions/${sessionId}/complete`, {
          method: 'POST',
          body: JSON.stringify({
            masteryUpdates: { multiplication: Math.round((correctCount / QUESTIONS.length) * 100) },
            xpEarned: correctCount * 10 + 5,
          }),
        });
        if (!res.ok) {
          Alert.alert('Warning', 'Could not save session results. Your XP may not be recorded.');
        }
      } catch {
        Alert.alert('Warning', 'Network issue saving session results. Your XP may not be recorded.');
      }
    }
  }, [currentIndex, sessionId, correctCount]);

  const handlePause = useCallback(() => {
    Alert.alert(
      'Pause Session',
      'Your progress will be saved. Continue later?',
      [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'Pause & Exit', onPress: () => router.back() },
      ]
    );
  }, []);

  if (sessionComplete) {
    const score = Math.round((correctCount / QUESTIONS.length) * 100);
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 64 }}>{score >= 80 ? '🎉' : score >= 60 ? '👏' : '💪'}</Text>
        <Text style={[styles.question, { marginTop: 16 }]}>Session Complete!</Text>
        <Text style={[styles.speechText, { fontSize: 20, marginTop: 8 }]}>
          {correctCount} / {QUESTIONS.length} correct ({score}%)
        </Text>
        <Text style={[styles.speechText, { marginTop: 4 }]}>
          +{correctCount * 10 + 5} XP earned
        </Text>
        <Pressable
          style={[styles.nextBtn, { marginTop: 32 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.nextBtnText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#FFF" />
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
        <Pressable onPress={handlePause}>
          <Ionicons name="pause" size={28} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.stageCanvas}>
        <View style={styles.tutorArea}>
          <View style={styles.tutorCircle}>
            <Text style={{ fontSize: 40 }}>🤖</Text>
          </View>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>
              {!answered
                ? t('learnerStage.letsSolve')
                : selected === question.correctAnswer
                  ? '🎉 Correct! Great job!'
                  : `Not quite! The answer is ${question.correctAnswer}.`}
            </Text>
          </View>
        </View>

        <View style={styles.contentArea}>
          <Text style={styles.questionCounter}>Question {currentIndex + 1} of {QUESTIONS.length}</Text>
          <Text style={styles.question}>{question.text}</Text>
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
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.answerText}>{answer}</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {answered && !submitting && (
        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {currentIndex < QUESTIONS.length - 1 ? 'Next Question →' : 'Finish Session'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 8 },
  progressPath: { flexDirection: 'row', gap: 8 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  progressDotActive: { backgroundColor: colors.primary, width: 14, height: 14, borderRadius: 7 },
  progressDotInactive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  stageCanvas: { flex: 1, padding: spacing.md },
  tutorArea: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  tutorCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '30', alignItems: 'center', justifyContent: 'center' },
  speechBubble: { marginLeft: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 12, flex: 1 },
  speechText: { color: '#FFF', fontSize: 16, fontFamily: 'Nunito-Regular' },
  contentArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  questionCounter: { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  question: { fontSize: 32, fontFamily: 'Nunito-ExtraBold', color: '#FFF' },
  responseZone: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: spacing.md, paddingBottom: 8 },
  answerCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  answerPressed: { backgroundColor: colors.primary, borderColor: colors.primary, transform: [{ scale: 0.97 }] },
  answerCorrect: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  answerWrong: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  answerRevealCorrect: { borderColor: '#16a34a', borderWidth: 2, opacity: 0.7 },
  answerText: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: '#FFF' },
  nextBtn: {
    marginHorizontal: spacing.md,
    marginBottom: 40,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 18, fontFamily: 'Nunito-Bold', color: '#FFF' },
});
