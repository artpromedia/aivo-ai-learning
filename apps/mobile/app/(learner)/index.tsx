import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useEngagement } from '@/hooks/useEngagement';
import { TUTORS } from '@aivo/brand';
import { AivoCard, StatCard } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function LearnerWorldMap() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: engagement, refetch } = useEngagement(user?.id || '');
  const { t } = useTranslation();

  const coreTutors = Object.entries(TUTORS).filter(([, t]) => t.tier === 'core');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} colors={[colors.primary]} />}
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🎮</Text>
          </View>
          <View>
            <Text style={styles.greeting}>{t('learner.greeting', { name: user?.name || 'Learner' })}</Text>
            <Text style={styles.level}>{t('learner.level', { level: engagement?.level || 1 })}</Text>
          </View>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakNum}>{engagement?.streakDays || 0}</Text>
        </View>
      </View>

      <View style={styles.xpBar}>
        <View style={[styles.xpFill, { width: `${((engagement?.xp || 0) % 1000) / 10}%` }]} />
      </View>
      <Text style={styles.xpText}>{engagement?.xp || 0} XP</Text>

      <View style={styles.statsRow}>
        <StatCard
          label={t('learner.coins')}
          value={engagement?.coins || 0}
          icon={<Text style={{ fontSize: 18 }}>🪙</Text>}
          color={colors.accent}
        />
        <View style={{ width: 8 }} />
        <StatCard
          label={t('learner.badges')}
          value={engagement?.badges?.length || 0}
          icon={<Text style={{ fontSize: 18 }}>🏆</Text>}
          color={colors.secondary}
        />
        <View style={{ width: 8 }} />
        <StatCard
          label={t('learner.gems')}
          value={engagement?.gems || 0}
          icon={<Text style={{ fontSize: 18 }}>💎</Text>}
          color={colors.info}
        />
      </View>

      <Pressable
        style={styles.dailyChallenge}
        onPress={() => router.push('/(learner)/challenges')}
      >
        <Ionicons name="flash" size={24} color={colors.accent} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.challengeTitle}>{t('learner.dailyChallenge')}</Text>
          <Text style={styles.challengeDesc}>{t('learner.dailyChallengeDesc')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </Pressable>

      <Text style={styles.sectionTitle}>{t('learner.questWorlds')}</Text>
      <View style={styles.worldGrid}>
        {coreTutors.map(([key, tutor]) => (
          <Pressable
            key={key}
            style={[styles.worldCard, { borderColor: tutor.color }]}
            onPress={() => router.push(`/(learner)/tutor/${key}` as any)}
          >
            <Text style={styles.worldIcon}>{tutor.icon}</Text>
            <Text style={styles.worldName}>{tutor.name}</Text>
            <Text style={styles.worldDomain} numberOfLines={1}>{tutor.domain}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(learner)/homework')}>
          <Ionicons name="camera" size={24} color={colors.primary} />
          <Text style={styles.quickLabel}>{t('learner.homework')}</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(learner)/quests')}>
          <Ionicons name="compass" size={24} color={colors.secondary} />
          <Text style={styles.quickLabel}>{t('learner.quests')}</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(learner)/badges')}>
          <Ionicons name="ribbon" size={24} color={colors.accent} />
          <Text style={styles.quickLabel}>{t('learner.badgesLabel')}</Text>
        </Pressable>
        <Pressable style={styles.quickBtn} onPress={() => router.push('/(learner)/gradebook')}>
          <Ionicons name="bar-chart" size={24} color={colors.success} />
          <Text style={styles.quickLabel}>{t('learner.grades')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  avatarContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24 },
  greeting: { fontSize: 20, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  level: { fontSize: 13, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, gap: 4 },
  streakIcon: { fontSize: 16 },
  streakNum: { fontSize: 16, fontFamily: 'Nunito-ExtraBold', color: colors.accent },
  xpBar: { height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: 4 },
  xpFill: { height: 10, backgroundColor: colors.primary, borderRadius: 5 },
  xpText: { fontSize: 12, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  dailyChallenge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '10',
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  challengeTitle: { fontSize: 15, fontFamily: 'Nunito-Bold', color: colors.text },
  challengeDesc: { fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text, marginBottom: spacing.md },
  worldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.lg },
  worldCard: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    ...({ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }),
  },
  worldIcon: { fontSize: 28, marginBottom: 4 },
  worldName: { fontSize: 13, fontFamily: 'Nunito-Bold', color: colors.text },
  worldDomain: { fontSize: 10, fontFamily: 'Nunito-Regular', color: colors.textSecondary, textAlign: 'center' },
  quickActions: { flexDirection: 'row', gap: 8 },
  quickBtn: { flex: 1, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md, alignItems: 'center', gap: 6, ...({ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }) },
  quickLabel: { fontSize: 12, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary },
});
