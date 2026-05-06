import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AivoCard, AivoButton } from '@aivo/mobile-ui';
import { useTranslation } from '@/hooks/useTranslation';
import { AccountSettingsCard } from '@/src/components/settings/AccountSettingsCard';
import { colors, spacing, radius } from '@/constants/colors';
import { API } from '@/constants/api';
import { apiFetch } from '@/lib/api';

/**
 * Parent settings screen.
 *
 * Universal account flows (profile chip, edit name/email, change password,
 * MFA, delete account, log out, avatar upload) live in the shared
 * `AccountSettingsCard`. This screen only owns the parent-specific extras:
 *   - Manage learner PIN (PUT /api/users/learners/:id { pin })
 *   - Export account data (GET /api/users/me)
 */
export default function ParentSettings() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  const [exportingData, setExportingData] = useState(false);

  const handleSavePin = useCallback(async () => {
    if (newPin.length !== 4) {
      Alert.alert(t('common.error'), t('parentSettings.pinLengthError'));
      return;
    }
    setSavingPin(true);
    try {
      const res = await apiFetch(API.IDENTITY, '/api/users/learners');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        Alert.alert(
          t('common.error'),
          data?.error || t('parentSettings.pinLoadFailed'),
        );
        return;
      }
      const learnersList = await res.json();
      if (!Array.isArray(learnersList) || learnersList.length === 0) {
        Alert.alert(t('common.error'), t('parentSettings.pinNoLearners'));
        return;
      }
      const updateRes = await apiFetch(
        API.IDENTITY,
        `/api/users/learners/${learnersList[0].id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ pin: newPin }),
        },
      );
      if (updateRes.ok) {
        Alert.alert(
          t('common.success'),
          t('parentSettings.pinUpdated', { name: learnersList[0].name }),
        );
        setPinModalVisible(false);
        setNewPin('');
      } else {
        const data = await updateRes.json().catch(() => ({}));
        Alert.alert(
          t('common.error'),
          data?.error || t('parentSettings.pinUpdateFailed'),
        );
      }
    } catch {
      Alert.alert(t('common.error'), t('auth.somethingWentWrong'));
    } finally {
      setSavingPin(false);
    }
  }, [newPin, t]);

  const handleExportData = useCallback(async () => {
    setExportingData(true);
    try {
      const res = await apiFetch(API.IDENTITY, '/api/users/me');
      if (res.ok) {
        const data = await res.json();
        Alert.alert(
          t('parentSettings.exportData'),
          t('parentSettings.exportSummary', {
            name: data.name,
            email: data.email,
            role: data.role,
          }),
        );
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert(
          t('common.error'),
          data?.error || t('parentSettings.exportFailed'),
        );
      }
    } catch {
      Alert.alert(t('common.error'), t('auth.somethingWentWrong'));
    } finally {
      setExportingData(false);
    }
  }, [t]);

  const parentRows: Array<{
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    onPress: () => void;
    loading?: boolean;
  }> = [
    {
      icon: 'key-outline',
      label: t('parentSettings.managePins'),
      onPress: () => setPinModalVisible(true),
    },
    {
      icon: 'download-outline',
      label: t('parentSettings.exportData'),
      onPress: handleExportData,
      loading: exportingData,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 32,
      }}
    >
      <Text style={styles.title}>{t('parentSettings.title')}</Text>

      <AccountSettingsCard enableAvatarUpload />

      <AivoCard style={styles.parentCard}>
        {parentRows.map((row, i) => (
          <Pressable
            key={row.label}
            style={[
              styles.row,
              i < parentRows.length - 1 && styles.rowBorder,
            ]}
            onPress={row.onPress}
            disabled={row.loading}
          >
            <Ionicons
              name={row.icon}
              size={22}
              color={colors.textSecondary}
            />
            <Text style={styles.rowLabel}>{row.label}</Text>
            {row.loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            )}
          </Pressable>
        ))}
      </AivoCard>

      <Text style={styles.version}>{t('common.appVersion')}</Text>

      <Modal visible={pinModalVisible} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPinModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              {t('parentSettings.managePins')}
            </Text>
            <Text style={styles.fieldLabel}>
              {t('parentSettings.newPinLabel')}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  textAlign: 'center',
                  letterSpacing: 12,
                  fontSize: 24,
                  fontFamily: 'Nunito-ExtraBold',
                },
              ]}
              value={newPin}
              onChangeText={(v) => setNewPin(v.replace(/\D/g, '').slice(0, 4))}
              placeholder="• • • •"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <AivoButton
                title={t('common.cancel')}
                onPress={() => {
                  setPinModalVisible(false);
                  setNewPin('');
                }}
                variant="outline"
                size="sm"
                style={styles.modalButton}
              />
              <AivoButton
                title={savingPin ? t('common.saving') : t('common.save')}
                onPress={handleSavePin}
                loading={savingPin}
                size="sm"
                style={styles.modalButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  parentCard: { marginTop: spacing.sm, padding: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: colors.text,
  },
  version: {
    marginTop: spacing.xl,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-ExtraBold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    height: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
  },
  modalButton: { flex: 1 },
});
