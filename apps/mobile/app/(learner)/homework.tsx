import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { AivoCard, AivoButton } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function HomeworkScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>{t('common.back')}</Text>
      </Pressable>

      <Text style={styles.title}>{t('learnerHomework.title')}</Text>
      <Text style={styles.subtitle}>{t('learnerHomework.subtitle')}</Text>

      <AivoCard style={styles.captureCard}>
        <View style={styles.cameraPreview}>
          <Ionicons name="camera" size={48} color={colors.textSecondary} />
          <Text style={styles.cameraText}>{t('learnerHomework.centerHomework')}</Text>
        </View>

        <View style={styles.captureActions}>
          <AivoButton
            title={t('learnerHomework.takePhoto')}
            onPress={() => Alert.alert('Camera', 'Camera capture coming soon')}
            size="lg"
            icon={<Ionicons name="camera-outline" size={20} color="#FFF" />}
            style={{ flex: 1, marginRight: 8 }}
          />
          <AivoButton
            title={t('learnerHomework.gallery')}
            onPress={() => Alert.alert('Gallery', 'Gallery picker coming soon')}
            variant="outline"
            size="lg"
            icon={<Ionicons name="images-outline" size={20} color={colors.primary} />}
            style={{ flex: 1 }}
          />
        </View>
      </AivoCard>

      <AivoCard style={styles.uploadCard}>
        <Ionicons name="document-outline" size={32} color={colors.secondary} />
        <Text style={styles.uploadTitle}>{t('learnerHomework.uploadPDF')}</Text>
        <Text style={styles.uploadDesc}>{t('learnerHomework.uploadPDFDesc')}</Text>
        <AivoButton
          title={t('learnerHomework.chooseFile')}
          onPress={() => Alert.alert('Upload', 'PDF upload coming soon')}
          variant="secondary"
          size="sm"
          style={{ marginTop: spacing.sm }}
        />
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
  captureCard: { marginBottom: spacing.md },
  cameraPreview: {
    height: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  cameraText: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginTop: 8 },
  captureActions: { flexDirection: 'row' },
  uploadCard: { alignItems: 'center' as const, paddingVertical: spacing.lg },
  uploadTitle: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text, marginTop: 8 },
  uploadDesc: { fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginTop: 4 },
});
