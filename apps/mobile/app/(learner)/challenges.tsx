import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Share } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { AivoCard, AivoButton, EmptyState } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>{t('common.back')}</Text>
      </Pressable>
      <Text style={styles.title}>{t('learnerChallenges.title')}</Text>
      <Text style={styles.subtitle}>{t('learnerChallenges.subtitle')}</Text>

      <AivoCard style={styles.battleCard}>
        <Ionicons name="flash" size={32} color={colors.accent} />
        <Text style={styles.battleTitle}>{t('learnerChallenges.quickBattle')}</Text>
        <Text style={styles.battleDesc}>{t('learnerChallenges.quickBattleDesc')}</Text>
        <AivoButton title={t('learnerChallenges.findMatch')} onPress={() => Alert.alert(t('learnerChallenges.quickBattle'), t('common.comingSoon'))} size="sm" style={{ marginTop: spacing.md }} />
      </AivoCard>

      <AivoCard style={styles.battleCard}>
        <Ionicons name="people" size={32} color={colors.secondary} />
        <Text style={styles.battleTitle}>{t('learnerChallenges.teamChallenge')}</Text>
        <Text style={styles.battleDesc}>{t('learnerChallenges.teamChallengeDesc')}</Text>
        <AivoButton title={t('learnerChallenges.joinTeam')} onPress={() => Alert.alert(t('learnerChallenges.teamChallenge'), t('common.comingSoon'))} variant="secondary" size="sm" style={{ marginTop: spacing.md }} />
      </AivoCard>

      <AivoCard style={styles.battleCard}>
        <Ionicons name="trophy" size={32} color={colors.primary} />
        <Text style={styles.battleTitle}>{t('learnerChallenges.weeklyTournament')}</Text>
        <Text style={styles.battleDesc}>{t('learnerChallenges.weeklyTournamentDesc')}</Text>
        <AivoButton title={t('learnerChallenges.enterTournament')} onPress={() => Alert.alert(t('learnerChallenges.weeklyTournament'), t('common.comingSoon'))} variant="outline" size="sm" style={{ marginTop: spacing.md }} />
      </AivoCard>

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>{t('learnerChallenges.inviteFriend')}</Text>
      <AivoCard>
        <Text style={styles.inviteText}>{t('learnerChallenges.inviteText')}</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>AIVO-XK7M</Text>
        </View>
        <AivoButton title={t('learnerChallenges.copyCode')} onPress={() => Share.share({ message: 'AIVO-XK7M' })} variant="outline" size="sm" style={{ marginTop: spacing.md }} />
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
