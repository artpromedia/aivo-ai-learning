import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AivoCard, AivoButton } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function TeacherIEPUpload() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.title}>Upload IEP</Text>
      <Text style={styles.subtitle}>Upload on behalf of parent (pending their approval)</Text>

      <AivoCard style={styles.uploadCard}>
        <Ionicons name="cloud-upload-outline" size={40} color={colors.primary} />
        <Text style={styles.uploadTitle}>Upload IEP Document</Text>
        <Text style={styles.uploadDesc}>Take a photo or select a PDF file</Text>
        <View style={styles.uploadActions}>
          <AivoButton
            title="Camera"
            onPress={() => Alert.alert('Camera', 'Coming soon')}
            size="sm"
            icon={<Ionicons name="camera-outline" size={16} color="#FFF" />}
            style={{ flex: 1, marginRight: 8 }}
          />
          <AivoButton
            title="PDF"
            onPress={() => Alert.alert('PDF', 'Coming soon')}
            variant="outline"
            size="sm"
            icon={<Ionicons name="document-outline" size={16} color={colors.primary} />}
            style={{ flex: 1 }}
          />
        </View>
      </AivoCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  backText: { fontSize: 16, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: spacing.lg },
  uploadCard: { alignItems: 'center' as const, paddingVertical: spacing.xl },
  uploadTitle: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text, marginTop: 12 },
  uploadDesc: { fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },
  uploadActions: { flexDirection: 'row', width: '100%' },
});
