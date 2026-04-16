import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { AivoCard, AivoButton, EmptyState } from '@aivo/mobile-ui';
import { colors, spacing } from '@/constants/colors';

export default function LessonPlanScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

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
        <AivoButton title={t('teacherLessonPlan.createPlan')} onPress={() => Alert.alert(t('teacherLessonPlan.createPlan'), t('common.comingSoon'))} style={{ marginTop: spacing.md }} />
      </AivoCard>

      <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>{t('teacherLessonPlan.recentPlans')}</Text>
      <EmptyState
        icon={<Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />}
        title={t('teacherLessonPlan.noPlansTitle')}
        message={t('teacherLessonPlan.noPlansMessage')}
      />
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
});
