import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { TUTORS } from '@aivo/brand';
import { AivoButton } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

type TutorKey = keyof typeof TUTORS;

export default function TutorSessionScreen() {
  const { tutorSlug } = useLocalSearchParams<{ tutorSlug: string }>();
  const insets = useSafeAreaInsets();
  const tutor = TUTORS[tutorSlug as TutorKey];
  const { t } = useTranslation();

  if (!tutor) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.title}>{t('learnerTutor.tutorNotFound')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        <Text style={styles.backText}>{t('common.back')}</Text>
      </Pressable>

      <View style={styles.tutorIntro}>
        <View style={[styles.tutorAvatar, { backgroundColor: tutor.color + '30' }]}>
          <Text style={styles.tutorIcon}>{tutor.icon}</Text>
        </View>
        <Text style={styles.tutorName}>{tutor.name}</Text>
        <Text style={styles.tutorDomain}>{tutor.domain}</Text>
      </View>

      <View style={styles.sessionInfo}>
        <View style={styles.infoCard}>
          <Ionicons name="time-outline" size={20} color={colors.primaryLight} />
          <Text style={styles.infoText}>{t('learnerTutor.sessionDuration')}</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="sparkles-outline" size={20} color={colors.accent} />
          <Text style={styles.infoText}>{t('learnerTutor.adaptiveDifficulty')}</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
          <Text style={styles.infoText}>{t('learnerTutor.brainInformed')}</Text>
        </View>
      </View>

      <AivoButton
        title={t('learnerTutor.startSession', { name: tutor.name })}
        onPress={() => router.push(`/(learner)/stage/${tutorSlug}-session` as any)}
        size="lg"
        style={{ marginTop: spacing.xl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E', paddingHorizontal: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xl },
  backText: { fontSize: 16, fontFamily: 'Nunito-SemiBold', color: 'rgba(255,255,255,0.7)' },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: '#FFF' },
  tutorIntro: { alignItems: 'center', marginBottom: spacing.xl },
  tutorAvatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tutorIcon: { fontSize: 48 },
  tutorName: { fontSize: 28, fontFamily: 'Nunito-ExtraBold', color: '#FFF' },
  tutorDomain: { fontSize: 16, fontFamily: 'Nunito-Regular', color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  sessionInfo: { gap: 12 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.xl, padding: spacing.md },
  infoText: { fontSize: 15, fontFamily: 'Nunito-SemiBold', color: '#FFF' },
});
