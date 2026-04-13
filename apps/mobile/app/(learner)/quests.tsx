import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { TUTORS } from '@aivo/brand';
import { AivoCard } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function QuestsScreen() {
  const insets = useSafeAreaInsets();
  const tutorEntries = Object.entries(TUTORS);
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
      <Text style={styles.title}>{t('learnerQuests.title')}</Text>
      <Text style={styles.subtitle}>{t('learnerQuests.subtitle')}</Text>

      {tutorEntries.map(([key, tutor], i) => (
        <Pressable key={key} onPress={() => router.push(`/(learner)/tutor/${key}` as any)}>
          <AivoCard style={[styles.questCard, { borderLeftColor: tutor.color, borderLeftWidth: 4 }]}>
            <View style={styles.questRow}>
              <View style={[styles.questIcon, { backgroundColor: tutor.color + '20' }]}>
                <Text style={{ fontSize: 28 }}>{tutor.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.questName}>{t('learnerQuests.world', { name: tutor.name })}</Text>
                <Text style={styles.questDomain}>{tutor.domain}</Text>
                <View style={styles.chapterProgress}>
                  <View style={[styles.chapterFill, { width: `${Math.min(100, (i + 1) * 15)}%`, backgroundColor: tutor.color }]} />
                </View>
                <Text style={styles.chapterText}>{t('learnerQuests.chapter', { current: Math.min(7, i + 1), total: 10 })}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </AivoCard>
        </Pressable>
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
  questCard: { marginBottom: spacing.sm },
  questRow: { flexDirection: 'row', alignItems: 'center' },
  questIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  questName: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text },
  questDomain: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginTop: 2 },
  chapterProgress: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  chapterFill: { height: 6, borderRadius: 3 },
  chapterText: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary, marginTop: 2 },
});
