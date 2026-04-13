import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBrain } from '@/hooks/useBrain';
import { AivoCard, AivoButton, LoadingState } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function StudentBrainProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: brain, isLoading } = useBrain(id);

  if (isLoading) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>{brain?.learnerName || 'Student'}'s Brain</Text>
      <Text style={styles.subtitle}>Read-only brain profile</Text>

      <AivoCard style={styles.overviewCard}>
        <View style={styles.brainCircle}>
          <Ionicons name="bulb" size={36} color={colors.primary} />
        </View>
        <Text style={styles.levelText}>Level: {brain?.overallLevel || 'Standard'}</Text>
      </AivoCard>

      {brain?.domains?.map((d) => (
        <AivoCard key={d.domain} style={styles.domainCard}>
          <Text style={styles.domainName}>{d.domain}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${d.masteryPercent}%` }]} />
          </View>
          <Text style={styles.gradeInfo}>
            Enrolled: {d.enrolledGrade} | Functioning: {d.functioningGrade}
          </Text>
        </AivoCard>
      ))}

      <View style={styles.actions}>
        <AivoButton
          title="Submit Insight"
          onPress={() => router.push(`/(teacher)/student/${id}/insight` as any)}
          icon={<Ionicons name="chatbubble-outline" size={18} color="#FFF" />}
          style={{ flex: 1, marginRight: 8 }}
        />
        <AivoButton
          title="Upload IEP"
          onPress={() => router.push(`/(teacher)/student/${id}/iep` as any)}
          variant="outline"
          icon={<Ionicons name="document-outline" size={18} color={colors.primary} />}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  backText: { fontSize: 16, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: spacing.lg },
  overviewCard: { alignItems: 'center' as const, marginBottom: spacing.lg, paddingVertical: spacing.md },
  brainCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  levelText: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text },
  domainCard: { marginBottom: spacing.sm },
  domainName: { fontSize: 15, fontFamily: 'Nunito-Bold', color: colors.text, marginBottom: 8 },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: 4 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  gradeInfo: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  actions: { flexDirection: 'row', marginTop: spacing.md },
});
