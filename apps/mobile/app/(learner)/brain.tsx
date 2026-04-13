import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useBrain } from '@/hooks/useBrain';
import { AivoCard, LoadingState } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function LearnerBrainScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: brain, isLoading } = useBrain(user?.id || '');
  const { t } = useTranslation();

  if (isLoading) return <LoadingState message={t('learnerBrain.loadingBrain')} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <Text style={styles.title}>{t('learnerBrain.title')}</Text>
      <Text style={styles.subtitle}>{t('learnerBrain.subtitle')}</Text>

      <AivoCard style={styles.brainCard}>
        <View style={styles.brainVisual}>
          <Ionicons name="bulb" size={48} color={colors.primary} />
        </View>
        <Text style={styles.brainLevel}>
          {t('learnerBrain.level', { level: brain?.overallLevel || 'Standard' })}
        </Text>
      </AivoCard>

      <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>{t('learnerBrain.mySubjects')}</Text>
      {brain?.domains?.map((domain) => (
        <AivoCard key={domain.domain} style={styles.subjectCard}>
          <Text style={styles.subjectName}>{domain.domain}</Text>
          <View style={styles.ladderContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${domain.masteryPercent}%` }]} />
            </View>
            <View style={styles.gradeLabels}>
              <Text style={styles.gradeLabel}>{t('learnerBrain.gradeLabel', { grade: domain.functioningGrade })}</Text>
              <Text style={styles.gradeTarget}>{t('learnerBrain.goalLabel', { grade: domain.enrolledGrade })}</Text>
            </View>
          </View>
          <Text style={styles.masteryText}>{t('learnerBrain.mastered', { percent: domain.masteryPercent })}</Text>
        </AivoCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: spacing.lg },
  brainCard: { alignItems: 'center' as const, marginBottom: spacing.lg, paddingVertical: spacing.lg },
  brainVisual: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brainLevel: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text },
  subjectCard: { marginBottom: spacing.sm },
  subjectName: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text, marginBottom: 8 },
  ladderContainer: { marginBottom: 4 },
  progressBar: { height: 12, backgroundColor: colors.border, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: 12, backgroundColor: colors.primary, borderRadius: 6 },
  gradeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  gradeLabel: { fontSize: 12, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  gradeTarget: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  masteryText: { fontSize: 13, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary },
});
