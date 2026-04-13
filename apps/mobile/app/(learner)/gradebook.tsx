import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useBrain } from '@/hooks/useBrain';
import { AivoCard, LoadingState } from '@aivo/mobile-ui';
import { colors, spacing } from '@/constants/colors';

export default function GradebookScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: brain, isLoading } = useBrain(user?.id || '');

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
      <Text style={styles.title}>Gradebook</Text>
      <Text style={styles.subtitle}>Your subject mastery</Text>

      {brain?.domains?.map((domain) => (
        <AivoCard key={domain.domain} style={styles.subjectCard}>
          <View style={styles.subjectHeader}>
            <Text style={styles.subjectName}>{domain.domain}</Text>
            <Text style={styles.subjectGrade}>{domain.masteryPercent}%</Text>
          </View>
          <View style={styles.masteryBar}>
            <View style={[styles.masteryFill, { width: `${domain.masteryPercent}%` }]} />
          </View>
          <Text style={styles.gradeInfo}>
            Functioning at Grade {domain.functioningGrade} (Enrolled: {domain.enrolledGrade})
          </Text>
        </AivoCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  backText: { fontSize: 16, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: spacing.lg },
  subjectCard: { marginBottom: spacing.sm },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectName: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text },
  subjectGrade: { fontSize: 18, fontFamily: 'Nunito-ExtraBold', color: colors.primary },
  masteryBar: { height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: 4 },
  masteryFill: { height: 10, backgroundColor: colors.primary, borderRadius: 5 },
  gradeInfo: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
});
