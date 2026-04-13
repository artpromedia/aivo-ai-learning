import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBrain } from '@/hooks/useBrain';
import { AivoCard, LoadingState, EmptyState } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function BrainProfileScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const insets = useSafeAreaInsets();
  const { data: brain, isLoading } = useBrain(childId);

  if (isLoading) return <LoadingState message="Loading Brain Profile..." />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>{brain?.learnerName || 'Learner'}'s Brain</Text>
      <Text style={styles.subtitle}>AI-powered learning profile</Text>

      <AivoCard style={styles.overviewCard}>
        <View style={styles.brainVisual}>
          <View style={styles.brainCircle}>
            <Ionicons name="bulb" size={40} color={colors.primary} />
          </View>
          <Text style={styles.overallLevel}>
            Overall: {brain?.overallLevel || 'Standard'}
          </Text>
        </View>
      </AivoCard>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Domain Grade Ladders</Text>
        <Pressable onPress={() => router.push(`/(parent)/brain/${childId}/history` as any)}>
          <Text style={styles.historyLink}>History</Text>
        </Pressable>
      </View>

      {brain?.domains?.map((domain) => (
        <Pressable
          key={domain.domain}
          onPress={() => router.push(`/(parent)/brain/${childId}/${domain.domain}` as any)}
        >
          <AivoCard style={styles.domainCard}>
            <View style={styles.domainRow}>
              <View>
                <Text style={styles.domainName}>{domain.domain}</Text>
                <Text style={styles.domainGrade}>
                  Enrolled: {domain.enrolledGrade} | Functioning: {domain.functioningGrade}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${domain.masteryPercent}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.masteryText}>{domain.masteryPercent}% mastery</Text>
            {domain.accommodations.length > 0 && (
              <View style={styles.accommodations}>
                {domain.accommodations.map((acc) => (
                  <View key={acc} style={styles.accBadge}>
                    <Text style={styles.accText}>{acc}</Text>
                  </View>
                ))}
              </View>
            )}
          </AivoCard>
        </Pressable>
      ))}

      {brain?.iepGoals && brain.iepGoals.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: spacing.lg, marginBottom: spacing.md }]}>
            IEP Goals
          </Text>
          {brain.iepGoals.map((goal) => (
            <AivoCard key={goal.id} style={styles.goalCard}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${goal.progress}%`,
                      backgroundColor: goal.status === 'met' ? colors.success : colors.info,
                    },
                  ]}
                />
              </View>
              <Text style={styles.goalProgress}>{goal.progress}% complete</Text>
            </AivoCard>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  backText: { fontSize: 16, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: spacing.lg },
  overviewCard: { marginBottom: spacing.lg, alignItems: 'center' as const },
  brainVisual: { alignItems: 'center', paddingVertical: spacing.md },
  brainCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  overallLevel: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text },
  historyLink: { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  domainCard: { marginBottom: spacing.sm },
  domainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  domainName: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text },
  domainGrade: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginTop: 2 },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: 4 },
  progressFill: { height: 8, borderRadius: 4 },
  masteryText: { fontSize: 12, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary },
  accommodations: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  accBadge: { backgroundColor: colors.accent + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  accText: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: colors.accent },
  goalCard: { marginBottom: spacing.sm },
  goalTitle: { fontSize: 15, fontFamily: 'Nunito-Bold', color: colors.text, marginBottom: 8 },
  goalProgress: { fontSize: 12, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary },
});
