import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AivoCard, AivoButton } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function ObservationScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.title}>Submit Observation</Text>
      <Text style={styles.subtitle}>Share what you've noticed today</Text>

      <AivoCard>
        <Text style={styles.prompt}>How did the child do today?</Text>
        <TextInput
          style={styles.textArea}
          value={note}
          onChangeText={setNote}
          placeholder="Share your observation..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <AivoButton
          title="Submit Observation"
          onPress={() => { Alert.alert('Submitted', 'Observation saved to Brain insights'); router.back(); }}
          disabled={!note.trim()}
          style={{ marginTop: spacing.md }}
        />
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
  prompt: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text, marginBottom: 8 },
  textArea: { minHeight: 120, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, fontSize: 15, fontFamily: 'Nunito-Regular', color: colors.text, backgroundColor: colors.surface },
});
