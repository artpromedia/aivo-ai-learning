import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useEngagement } from '@/hooks/useEngagement';
import { AivoCard, EmptyState } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

const rarityColors: Record<string, string> = {
  common: colors.textSecondary,
  rare: colors.info,
  epic: colors.primary,
  legendary: colors.accent,
};

export default function BadgesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: engagement } = useEngagement(user?.id || '');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.title}>Badge Cabinet</Text>
      <Text style={styles.subtitle}>{engagement?.badges?.length || 0} badges earned</Text>

      {!engagement?.badges?.length ? (
        <EmptyState
          icon={<Ionicons name="ribbon-outline" size={48} color={colors.textSecondary} />}
          title="No Badges Yet"
          message="Complete lessons and challenges to earn badges!"
        />
      ) : (
        <View style={styles.grid}>
          {engagement.badges.map((badge) => (
            <AivoCard key={badge.id} style={styles.badgeCard}>
              <View style={[styles.badgeBorder, { borderColor: rarityColors[badge.rarity] }]}>
                <Ionicons name="ribbon" size={32} color={rarityColors[badge.rarity]} />
              </View>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={[styles.badgeRarity, { color: rarityColors[badge.rarity] }]}>{badge.rarity}</Text>
            </AivoCard>
          ))}
        </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { width: '30%', alignItems: 'center' as const, padding: spacing.sm },
  badgeBorder: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  badgeName: { fontSize: 12, fontFamily: 'Nunito-Bold', color: colors.text, textAlign: 'center' },
  badgeRarity: { fontSize: 10, fontFamily: 'Nunito-SemiBold', textTransform: 'capitalize', marginTop: 2 },
});
