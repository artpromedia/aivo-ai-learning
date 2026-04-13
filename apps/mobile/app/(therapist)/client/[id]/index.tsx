import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBrain } from '@/hooks/useBrain';
import { AivoCard, AivoButton, LoadingState } from '@aivo/mobile-ui';
import { colors, spacing } from '@/constants/colors';

export default function TherapistClientProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: brain, isLoading } = useBrain(id);
  if (isLoading) return <LoadingState />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}>
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.title}>{brain?.learnerName || 'Client'} — Brain Profile</Text>
      <Text style={styles.subtitle}>HIPAA-scoped therapy view</Text>

      <AivoCard style={styles.overviewCard}>
        <Ionicons name="shield-checkmark" size={24} color={colors.success} />
        <Text style={styles.hipaaLabel}>HIPAA-Scoped Access</Text>
        <Text style={styles.levelText}>Level: {brain?.overallLevel || 'Standard'}</Text>
      </AivoCard>

      {brain?.domains?.map((d) => (
        <AivoCard key={d.domain} style={styles.card}>
          <Text style={styles.domainName}>{d.domain}</Text>
          <View style={styles.bar}><View style={[styles.fill, { width: `${d.masteryPercent}%` }]} /></View>
          <Text style={styles.info}>Functioning: {d.functioningGrade} | Accommodations: {d.accommodations.length}</Text>
        </AivoCard>
      ))}

      <View style={styles.actions}>
        <AivoButton title="Therapy Goals" onPress={() => router.push(`/(therapist)/client/${id}/goals` as any)} style={{ flex: 1, marginRight: 8 }} />
        <AivoButton title="Session Notes" onPress={() => router.push(`/(therapist)/client/${id}/notes` as any)} variant="outline" style={{ flex: 1 }} />
      </View>
      <AivoButton
        title="Generate Report"
        onPress={() => router.push(`/(therapist)/client/${id}/reports` as any)}
        variant="secondary"
        style={{ marginTop: spacing.sm }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  backText: { fontSize: 16, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  title: { fontSize: 22, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: spacing.lg },
  overviewCard: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginBottom: spacing.lg },
  hipaaLabel: { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: colors.success },
  levelText: { fontSize: 14, fontFamily: 'Nunito-Bold', color: colors.text, marginLeft: 'auto' },
  card: { marginBottom: spacing.sm },
  domainName: { fontSize: 15, fontFamily: 'Nunito-Bold', color: colors.text, marginBottom: 8 },
  bar: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: 4 },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  info: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  actions: { flexDirection: 'row', marginTop: spacing.md },
});
