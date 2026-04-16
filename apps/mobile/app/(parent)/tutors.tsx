import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { TUTORS } from '@aivo/brand';
import { TutorCard } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

type TutorKey = keyof typeof TUTORS;

export default function TutorStoreScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'core' | 'expansion'>('all');
  const { t } = useTranslation();

  const tutorEntries = Object.entries(TUTORS) as [TutorKey, (typeof TUTORS)[TutorKey]][];
  const filtered = filter === 'all'
    ? tutorEntries
    : tutorEntries.filter(([, t]) => t.tier === filter);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <Text style={styles.title}>{t('parentTutors.title')}</Text>
      <Text style={styles.subtitle}>{t('parentTutors.subtitle')}</Text>

      <View style={styles.filters}>
        {(['all', 'core', 'expansion'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? t('parentTutors.all') : f === 'core' ? t('parentTutors.core') : t('parentTutors.expansion')}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.bundles}>
        <Pressable style={[styles.bundleCard, { borderColor: colors.primary }]} disabled>
          <Text style={styles.bundleName}>{t('parentTutors.core7Bundle')}</Text>
          <Text style={styles.bundlePrice}>{t('parentTutors.includedWithSub')}</Text>
          <Text style={styles.comingSoonTag}>{t('common.comingSoon')}</Text>
        </Pressable>
        <Pressable style={[styles.bundleCard, { borderColor: colors.secondary }]} disabled>
          <Text style={styles.bundleName}>{t('parentTutors.full14Bundle')}</Text>
          <Text style={styles.bundlePrice}>{t('parentTutors.full14Price')}</Text>
          <Text style={styles.comingSoonTag}>{t('common.comingSoon')}</Text>
        </Pressable>
      </View>

      {filtered.map(([key, tutor]) => (
        <TutorCard
          key={key}
          name={tutor.name}
          domain={tutor.domain}
          icon={tutor.icon}
          color={tutor.color}
          subscribed={tutor.tier === 'core'}
          onPress={() => {}}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  filters: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  filterActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary },
  filterTextActive: { color: '#FFF' },
  bundles: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  bundleCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 2,
    backgroundColor: colors.card,
  },
  bundleName: { fontSize: 14, fontFamily: 'Nunito-Bold', color: colors.text },
  bundlePrice: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginTop: 4 },
  comingSoonTag: { fontSize: 10, fontFamily: 'Nunito-Bold', color: colors.accent, marginTop: 6 },
});
