import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBrain } from '@/hooks/useBrain';
import { AivoCard, StatCard, LoadingState, AivoButton } from '@aivo/mobile-ui';
import { colors, spacing } from '@/constants/colors';

export default function ChildOverviewScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const insets = useSafeAreaInsets();
  const { data: brain, isLoading } = useBrain(childId);
  if (isLoading) return <LoadingState />;

  const nav = (path: string) => router.push(`/(caregiver)/child/${childId}/${path}` as any);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}>
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.title}>{brain?.learnerName || 'Child'} Overview</Text>

      <AivoCard style={styles.brainSummary}>
        <Ionicons name="bulb" size={32} color={colors.primary} />
        <Text style={styles.brainLevel}>{brain?.overallLevel || 'Standard'}</Text>
      </AivoCard>

      <View style={styles.statsRow}>
        <StatCard label="Streak" value="5 🔥" color={colors.accent} />
        <View style={{ width: 8 }} />
        <StatCard label="Sessions Today" value={2} color={colors.secondary} />
      </View>

      <View style={styles.navGrid}>
        {[
          { icon: 'bulb-outline' as const, label: 'Brain', path: 'brain' },
          { icon: 'shield-checkmark-outline' as const, label: 'Accommodations', path: 'accommodations' },
          { icon: 'flag-outline' as const, label: 'IEP Goals', path: 'iep-goals' },
          { icon: 'bar-chart-outline' as const, label: 'Gradebook', path: 'gradebook' },
          { icon: 'time-outline' as const, label: 'Sessions', path: 'sessions' },
          { icon: 'create-outline' as const, label: 'Observation', path: 'observation' },
          { icon: 'trending-up-outline' as const, label: 'Progress', path: 'progress' },
        ].map((item) => (
          <Pressable key={item.path} style={styles.navBtn} onPress={() => nav(item.path)}>
            <Ionicons name={item.icon} size={24} color={colors.primary} />
            <Text style={styles.navLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  backText: { fontSize: 16, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text, marginBottom: spacing.lg },
  brainSummary: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginBottom: spacing.lg },
  brainLevel: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text },
  statsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  navBtn: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  navLabel: { fontSize: 12, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary, textAlign: 'center' },
});
