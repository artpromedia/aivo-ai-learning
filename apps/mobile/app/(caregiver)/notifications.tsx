import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@aivo/mobile-ui';
import { colors, spacing } from '@/constants/colors';

export default function CaregiverNotifications() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Alerts and milestones</Text>
      <EmptyState
        icon={<Ionicons name="notifications-outline" size={48} color={colors.textSecondary} />}
        title="No Notifications"
        message="You'll receive alerts for IEP goal milestones, functioning level changes, and streak achievements."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: spacing.lg },
});
