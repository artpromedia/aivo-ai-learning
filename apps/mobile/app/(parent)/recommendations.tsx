import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useLearners } from '@/hooks/useLearners';
import {
  useBrainRecommendations,
  useRecommendationAction,
} from '@/hooks/useBrain';
import { AivoCard, AivoButton, EmptyState, LoadingState } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function RecommendationsScreen() {
  const insets = useSafeAreaInsets();
  const { data: learners } = useLearners();
  const firstLearnerId = learners?.[0]?.id || '';
  const { data: recommendations, isLoading, refetch } =
    useBrainRecommendations(firstLearnerId);
  const action = useRecommendationAction();
  const { t } = useTranslation();

  const pending =
    recommendations?.filter((r) => r.status === 'PENDING') ?? [];

  if (isLoading) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refetch}
          colors={[colors.primary]}
        />
      }
    >
      <Text style={styles.title}>{t('parentRecommendations.title')}</Text>
      <Text style={styles.subtitle}>{t('parentRecommendations.subtitle')}</Text>

      {pending.length === 0 ? (
        <EmptyState
          icon={
            <Ionicons
              name="checkmark-circle-outline"
              size={48}
              color={colors.success}
            />
          }
          title={t('parentRecommendations.allCaughtUp')}
          message={t('parentRecommendations.noPending')}
        />
      ) : (
        pending.map((rec) => (
          <AivoCard key={rec.id} style={styles.recCard}>
            <View style={styles.recHeader}>
              <View
                style={[styles.typeBadge, { backgroundColor: colors.info + '20' }]}
              >
                <Text style={[styles.typeText, { color: colors.info }]}>
                  {rec.type}
                </Text>
              </View>
              <Text style={styles.recDate}>
                {new Date(rec.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.recTitle}>{rec.title}</Text>
            {rec.description && (
              <Text style={styles.recDesc}>{rec.description}</Text>
            )}
            <View style={styles.recActions}>
              <AivoButton
                title={t('common.approve')}
                onPress={() =>
                  action.mutate({
                    learnerId: firstLearnerId,
                    recommendationId: rec.id,
                    action: 'approve',
                  })
                }
                size="sm"
                style={{ flex: 1, marginRight: 8 }}
              />
              <AivoButton
                title={t('common.decline')}
                onPress={() =>
                  action.mutate({
                    learnerId: firstLearnerId,
                    recommendationId: rec.id,
                    action: 'decline',
                  })
                }
                variant="outline"
                size="sm"
                style={{ flex: 1 }}
              />
            </View>
          </AivoCard>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
  recCard: { marginBottom: spacing.md },
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  typeText: { fontSize: 12, fontFamily: 'Nunito-SemiBold' },
  recDate: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  recTitle: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text, marginBottom: 4 },
  recDesc: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  recActions: { flexDirection: 'row' },
});
