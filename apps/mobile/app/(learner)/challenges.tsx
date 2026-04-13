import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AivoCard, AivoButton, EmptyState } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.title}>Challenges</Text>
      <Text style={styles.subtitle}>Compete and earn rewards</Text>

      <AivoCard style={styles.battleCard}>
        <Ionicons name="flash" size={32} color={colors.accent} />
        <Text style={styles.battleTitle}>Quick Battle (1v1)</Text>
        <Text style={styles.battleDesc}>Challenge a friend to a quiz battle</Text>
        <AivoButton title="Find Match" onPress={() => {}} size="sm" style={{ marginTop: spacing.md }} />
      </AivoCard>

      <AivoCard style={styles.battleCard}>
        <Ionicons name="people" size={32} color={colors.secondary} />
        <Text style={styles.battleTitle}>Team Challenge</Text>
        <Text style={styles.battleDesc}>Work with friends to solve problems</Text>
        <AivoButton title="Join Team" onPress={() => {}} variant="secondary" size="sm" style={{ marginTop: spacing.md }} />
      </AivoCard>

      <AivoCard style={styles.battleCard}>
        <Ionicons name="trophy" size={32} color={colors.primary} />
        <Text style={styles.battleTitle}>Weekly Tournament</Text>
        <Text style={styles.battleDesc}>Compete for the top of the leaderboard</Text>
        <AivoButton title="Enter Tournament" onPress={() => {}} variant="outline" size="sm" style={{ marginTop: spacing.md }} />
      </AivoCard>

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Invite a Friend</Text>
      <AivoCard>
        <Text style={styles.inviteText}>Share your invite code to play with friends!</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>AIVO-XK7M</Text>
        </View>
        <AivoButton title="Copy Code" onPress={() => {}} variant="outline" size="sm" style={{ marginTop: spacing.md }} />
      </AivoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  backText: { fontSize: 16, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: spacing.lg },
  battleCard: { alignItems: 'center' as const, marginBottom: spacing.md, paddingVertical: spacing.lg },
  battleTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text, marginTop: 8 },
  battleDesc: { fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text, marginBottom: spacing.md },
  inviteText: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, textAlign: 'center' },
  codeBox: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', marginTop: spacing.md },
  codeText: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.primary, letterSpacing: 4 },
});
