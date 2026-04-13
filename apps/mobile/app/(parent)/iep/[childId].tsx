import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIEPGoals } from '@/hooks/useFamily';
import { AivoCard, AivoButton, LoadingState, EmptyState } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function IEPScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const insets = useSafeAreaInsets();
  const { data: goals, isLoading } = useIEPGoals(childId);

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

      <Text style={styles.title}>IEP Management</Text>
      <Text style={styles.subtitle}>Upload documents and track goals</Text>

      <AivoCard style={styles.uploadCard}>
        <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
        <Text style={styles.uploadTitle}>Upload IEP Document</Text>
        <Text style={styles.uploadDesc}>Take a photo or select a PDF</Text>
        <View style={styles.uploadActions}>
          <AivoButton
            title="Camera"
            onPress={() => Alert.alert('Camera', 'Camera upload coming soon')}
            size="sm"
            icon={<Ionicons name="camera-outline" size={16} color="#FFF" />}
            style={{ flex: 1, marginRight: 8 }}
          />
          <AivoButton
            title="PDF"
            onPress={() => Alert.alert('PDF', 'PDF upload coming soon')}
            variant="outline"
            size="sm"
            icon={<Ionicons name="document-outline" size={16} color={colors.primary} />}
            style={{ flex: 1 }}
          />
        </View>
      </AivoCard>

      <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>IEP Goals</Text>

      {!goals || goals.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="flag-outline" size={48} color={colors.textSecondary} />}
          title="No IEP Goals"
          message="Upload an IEP document to see parsed goals and track progress."
        />
      ) : (
        goals.map((goal: any) => (
          <AivoCard key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <View style={[styles.statusBadge, {
                backgroundColor: goal.status === 'met' ? colors.success + '20' : colors.info + '20'
              }]}>
                <Text style={[styles.statusText, {
                  color: goal.status === 'met' ? colors.success : colors.info
                }]}>{goal.status}</Text>
              </View>
            </View>
            <Text style={styles.goalDesc}>{goal.description}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${goal.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{goal.progress}% complete</Text>
          </AivoCard>
        ))
      )}

      <AivoButton
        title="Generate IEP Report"
        onPress={() => Alert.alert('Report', 'IEP report generation coming soon')}
        variant="secondary"
        icon={<Ionicons name="document-text-outline" size={18} color="#FFF" />}
        style={{ marginTop: spacing.md }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  backText: { fontSize: 16, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: spacing.lg },
  uploadCard: { alignItems: 'center' as const, marginBottom: spacing.lg, paddingVertical: spacing.lg },
  uploadTitle: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text, marginTop: 8 },
  uploadDesc: { fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  uploadActions: { flexDirection: 'row', width: '100%' },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text },
  goalCard: { marginBottom: spacing.sm },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  goalTitle: { fontSize: 15, fontFamily: 'Nunito-Bold', color: colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  statusText: { fontSize: 11, fontFamily: 'Nunito-SemiBold' },
  goalDesc: { fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: 8 },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: 4 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  progressText: { fontSize: 12, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary },
});
