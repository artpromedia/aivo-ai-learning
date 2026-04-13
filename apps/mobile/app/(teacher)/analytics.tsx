import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { AivoCard, StatCard } from '@aivo/mobile-ui';
import { colors, spacing } from '@/constants/colors';

export default function TeacherAnalyticsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <Text style={styles.title}>{t('teacherAnalytics.title')}</Text>
      <Text style={styles.subtitle}>{t('teacherAnalytics.subtitle')}</Text>

      <View style={styles.statsRow}>
        <StatCard label={t('teacherAnalytics.standard')} value={12} icon={<Ionicons name="checkmark-circle" size={20} color={colors.success} />} color={colors.success} />
        <View style={{ width: 8 }} />
        <StatCard label={t('teacherAnalytics.supported')} value={6} icon={<Ionicons name="hand-left" size={20} color={colors.info} />} color={colors.info} />
        <View style={{ width: 8 }} />
        <StatCard label={t('teacherAnalytics.lowVerbal')} value={3} icon={<Ionicons name="volume-low" size={20} color={colors.accent} />} color={colors.accent} />
      </View>

      <Text style={styles.sectionTitle}>{t('teacherAnalytics.domainProgress')}</Text>
      {['Mathematics', 'ELA', 'Science', 'History', 'SEL'].map((domain) => (
        <AivoCard key={domain} style={styles.domainCard}>
          <Text style={styles.domainName}>{domain}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.floor(50 + Math.random() * 40)}%` }]} />
          </View>
        </AivoCard>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>{t('teacherAnalytics.engagementTrends')}</Text>
      <AivoCard>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('teacherAnalytics.avgSessionsWeek')}</Text>
          <Text style={styles.metricValue}>3.8</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('teacherAnalytics.avgSessionDuration')}</Text>
          <Text style={styles.metricValue}>22 min</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('teacherAnalytics.tutorUsageRate')}</Text>
          <Text style={styles.metricValue}>87%</Text>
        </View>
      </AivoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text, marginBottom: spacing.md },
  domainCard: { marginBottom: spacing.sm },
  domainName: { fontSize: 15, fontFamily: 'Nunito-Bold', color: colors.text, marginBottom: 8 },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  metricLabel: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  metricValue: { fontSize: 14, fontFamily: 'Nunito-Bold', color: colors.text },
});
