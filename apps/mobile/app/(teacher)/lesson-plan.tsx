import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AivoCard, AivoButton, EmptyState } from '@aivo/mobile-ui';
import { colors, spacing } from '@/constants/colors';

export default function LessonPlanScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <Text style={styles.title}>Lesson Plans</Text>
      <Text style={styles.subtitle}>Brain-informed lesson plan generator</Text>

      <AivoCard style={styles.genCard}>
        <Ionicons name="sparkles" size={32} color={colors.primary} />
        <Text style={styles.genTitle}>Generate New Plan</Text>
        <Text style={styles.genDesc}>Select students and let AI create a differentiated lesson plan based on their Brain profiles</Text>
        <AivoButton title="Create Lesson Plan" onPress={() => {}} style={{ marginTop: spacing.md }} />
      </AivoCard>

      <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>Recent Plans</Text>
      <EmptyState
        icon={<Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />}
        title="No Lesson Plans Yet"
        message="Generate your first Brain-informed lesson plan above."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: spacing.lg },
  genCard: { alignItems: 'center' as const, paddingVertical: spacing.lg, marginBottom: spacing.lg },
  genTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text, marginTop: 8 },
  genDesc: { fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text },
});
