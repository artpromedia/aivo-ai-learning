import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useLearners } from '@/hooks/useLearners';
import { apiFetch } from '@/lib/api';
import { API } from '@/constants/api';
import { AivoCard, AivoButton, EmptyState } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

const SUBJECTS = ['Mathematics', 'English Language Arts', 'Science', 'History & Social Studies', 'Coding & Computer Science', 'Speech & Language', 'Social-Emotional Learning'];
const GRADE_LEVELS = ['Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade'];

interface LessonPlanContent {
  objective?: string;
  overview?: string;
  standards?: string[];
  materials?: string[];
  duration?: string;
  differentiationGroups?: { level: string; modifications: string }[];
}

interface LessonPlanActivity {
  name: string;
  description: string;
  duration: string;
  materials?: string[];
  differentiationTips?: string;
}

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  gradeLevel?: string;
  status: string;
  content?: LessonPlanContent;
  activities?: LessonPlanActivity[];
  accommodations?: { type: string; description: string }[];
  createdAt: string;
}

export default function LessonPlanScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: learners } = useLearners();

  const [subject, setSubject] = useState('Mathematics');
  const [gradeLevel, setGradeLevel] = useState('3rd Grade');
  const [topic, setTopic] = useState('');
  const [accommodationNotes, setAccommodationNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);

  const learnerId = learners?.[0]?.id || '';

  const { data: recentPlans, refetch: refetchPlans } = useQuery<LessonPlan[]>({
    queryKey: ['lesson-plans', user?.id],
    queryFn: async () => {
      const res = await apiFetch(API.ENGAGEMENT, '/api/engagement/lesson-plans/teacher');
      if (!res.ok) throw new Error('Failed to fetch plans');
      return res.json();
    },
    enabled: !!user?.id,
  });

  const handleGenerate = useCallback(async () => {
    if (!learnerId) {
      Alert.alert(t('common.error'), 'Please add a learner first to generate a lesson plan.');
      return;
    }
    setGenerating(true);
    setGeneratedPlan(null);
    try {
      const res = await apiFetch(API.ENGAGEMENT, '/api/engagement/lesson-plans/generate', {
        method: 'POST',
        body: JSON.stringify({
          learnerId,
          subject,
          gradeLevel,
          topic: topic.trim() || undefined,
          accommodationNotes: accommodationNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedPlan(data);
        refetchPlans();
      } else {
        Alert.alert(t('common.error'), data.error || 'Failed to generate lesson plan');
      }
    } catch {
      Alert.alert(t('common.error'), 'Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [learnerId, subject, gradeLevel, topic, accommodationNotes, t, refetchPlans]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <Text style={styles.title}>{t('teacherLessonPlan.title')}</Text>
      <Text style={styles.subtitle}>{t('teacherLessonPlan.subtitle')}</Text>

      <AivoCard style={styles.genCard}>
        <Ionicons name="sparkles" size={32} color={colors.primary} />
        <Text style={styles.genTitle}>{t('teacherLessonPlan.generateNew')}</Text>
        <Text style={styles.genDesc}>{t('teacherLessonPlan.generateDesc')}</Text>

        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {SUBJECTS.map(s => (
              <Pressable
                key={s}
                style={[styles.chip, subject === s && styles.chipActive]}
                onPress={() => setSubject(s)}
              >
                <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Grade Level</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {GRADE_LEVELS.map(g => (
              <Pressable
                key={g}
                style={[styles.chip, gradeLevel === g && styles.chipActive]}
                onPress={() => setGradeLevel(g)}
              >
                <Text style={[styles.chipText, gradeLevel === g && styles.chipTextActive]}>{g}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Topic (optional)</Text>
          <TextInput
            style={styles.input}
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g. Fractions, Photosynthesis..."
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.fieldLabel}>Accommodation Notes (optional)</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={accommodationNotes}
            onChangeText={setAccommodationNotes}
            placeholder="Any special needs or accommodations..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </View>

        {generating ? (
          <View style={{ alignItems: 'center', marginTop: spacing.md }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.genDesc, { marginTop: 8 }]}>Generating lesson plan with AI...</Text>
          </View>
        ) : (
          <AivoButton title={t('teacherLessonPlan.createPlan')} onPress={handleGenerate} style={{ marginTop: spacing.md }} />
        )}
      </AivoCard>

      {generatedPlan && (
        <AivoCard style={{ marginBottom: spacing.lg, borderWidth: 2, borderColor: colors.success }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.genTitle}>Plan Generated!</Text>
          </View>
          <Text style={{ fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text, marginBottom: 4 }}>
            {generatedPlan.title}
          </Text>
          {generatedPlan.content && (
            <>
              {generatedPlan.content.objective && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.fieldLabel}>Objective</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.text }}>
                    {generatedPlan.content.objective}
                  </Text>
                </View>
              )}
              {generatedPlan.content.duration && (
                <Text style={{ fontSize: 12, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary }}>
                  Duration: {generatedPlan.content.duration}
                </Text>
              )}
            </>
          )}
          {Array.isArray(generatedPlan.activities) && generatedPlan.activities.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.fieldLabel}>Activities ({generatedPlan.activities.length})</Text>
              {generatedPlan.activities.map((a, i) => (
                <Text key={i} style={{ fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.text, marginLeft: 8 }}>
                  • {a.name}: {a.duration}
                </Text>
              ))}
            </View>
          )}
        </AivoCard>
      )}

      <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>{t('teacherLessonPlan.recentPlans')}</Text>
      {recentPlans && recentPlans.length > 0 ? (
        recentPlans.map(plan => (
          <AivoCard key={plan.id} style={{ marginBottom: spacing.sm }}>
            <Text style={{ fontSize: 15, fontFamily: 'Nunito-Bold', color: colors.text }}>{plan.title}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary }}>{plan.subject}</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Nunito-SemiBold', color: plan.status === 'DRAFT' ? colors.accent : colors.success }}>{plan.status}</Text>
            </View>
          </AivoCard>
        ))
      ) : (
        <EmptyState
          icon={<Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />}
          title={t('teacherLessonPlan.noPlansTitle')}
          message={t('teacherLessonPlan.noPlansMessage')}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: spacing.lg },
  genCard: { alignItems: 'center' as const, paddingVertical: spacing.lg, marginBottom: spacing.lg },
  genTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text, marginTop: 8 },
  genDesc: { fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text },
  formSection: { width: '100%', marginTop: spacing.md },
  fieldLabel: { fontSize: 13, fontFamily: 'Nunito-Bold', color: colors.textSecondary, marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.surface, marginRight: 6 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary },
  chipTextActive: { color: '#FFF' },
  input: {
    height: 40,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: colors.text,
    marginBottom: 12,
  },
});
