/**
 * Shared role-agnostic account settings card.
 *
 * Provides the standard self-service account actions that every role
 * needs from a Settings screen:
 *   - Read-only profile chip (avatar initial, name, email)
 *   - Edit account details (name + email) via PUT /api/auth/profile
 *   - "Change password" link → routes to (auth)/change-password
 *   - Log out (with confirmation)
 *   - Delete account via DELETE /api/auth/account (password-confirmed)
 *
 * Intentionally excludes role-specific concerns (parent PIN management,
 * MFA toggle, avatar upload) so it can be safely reused for teacher,
 * therapist, and caregiver settings. Those richer flows live in the
 * parent settings screen and can be lifted into this component later
 * without breaking callers.
 */
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AivoCard, AivoButton } from '@aivo/mobile-ui';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import { API } from '@/constants/api';
import { colors, spacing, radius } from '@/constants/colors';

interface AccountSettingsCardProps {
  /** Single character used for the placeholder avatar (e.g. 'T' for teacher). */
  avatarInitial?: string;
}

export function AccountSettingsCard({ avatarInitial }: AccountSettingsCardProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [savingAccount, setSavingAccount] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const openAccountModal = useCallback(() => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setAccountModalVisible(true);
  }, [user?.name, user?.email]);

  const handleSaveAccount = useCallback(async () => {
    if (!editName.trim()) {
      Alert.alert(t('common.error'), t('accountSettings.nameRequired'));
      return;
    }
    setSavingAccount(true);
    try {
      const res = await apiFetch(API.IDENTITY, '/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim() }),
      });
      if (res.ok) {
        Alert.alert(t('common.success'), t('accountSettings.accountUpdated'));
        setAccountModalVisible(false);
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert(t('common.error'), data?.error || t('accountSettings.accountUpdateFailed'));
      }
    } catch {
      Alert.alert(t('common.error'), t('auth.somethingWentWrong'));
    } finally {
      setSavingAccount(false);
    }
  }, [editName, editEmail, t]);

  const handleChangePassword = useCallback(() => {
    router.push('/(auth)/change-password' as any);
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(t('common.logOut'), t('common.logOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logOut'), style: 'destructive', onPress: logout },
    ]);
  }, [t, logout]);

  const openDeleteModal = useCallback(() => {
    setDeletePassword('');
    setDeleteModalVisible(true);
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (!deletePassword) {
      Alert.alert(t('common.error'), t('accountSettings.deletePasswordRequired'));
      return;
    }
    setDeleting(true);
    try {
      const res = await apiFetch(API.IDENTITY, '/api/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword }),
      });
      if (res.ok) {
        setDeleteModalVisible(false);
        await logout();
      } else {
        const data = await res.json().catch(() => ({}));
        Alert.alert(t('common.error'), data?.error || t('accountSettings.deleteFailed'));
      }
    } catch {
      Alert.alert(t('common.error'), t('auth.somethingWentWrong'));
    } finally {
      setDeleting(false);
    }
  }, [deletePassword, t, logout]);

  const initial =
    (avatarInitial && avatarInitial[0]) ||
    user?.name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    '?';

  return (
    <View>
      <AivoCard style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{user?.name || ''}</Text>
            {!!user?.email && (
              <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
            )}
          </View>
        </View>
      </AivoCard>

      <Pressable onPress={openAccountModal}>
        <AivoCard style={styles.row}>
          <Ionicons name="person-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.rowLabel}>{t('accountSettings.accountDetails')}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </AivoCard>
      </Pressable>

      <Pressable onPress={handleChangePassword}>
        <AivoCard style={styles.row}>
          <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.rowLabel}>{t('accountSettings.changePassword')}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </AivoCard>
      </Pressable>

      <Pressable onPress={openDeleteModal}>
        <AivoCard style={styles.row}>
          <Ionicons name="trash-outline" size={22} color={colors.error} />
          <Text style={[styles.rowLabel, { color: colors.error }]}>
            {t('accountSettings.deleteAccount')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.error} />
        </AivoCard>
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>{t('common.logOut')}</Text>
      </Pressable>

      {/* Account details modal */}
      <Modal
        visible={accountModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('accountSettings.accountDetails')}</Text>

            <Text style={styles.label}>{t('accountSettings.fullName')}</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('accountSettings.fullName')}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />

            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setAccountModalVisible(false)}
                disabled={savingAccount}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <AivoButton
                title={savingAccount ? t('common.saving') : t('common.save')}
                onPress={handleSaveAccount}
                loading={savingAccount}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete account modal */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('accountSettings.deleteAccount')}</Text>
            <Text style={styles.modalBody}>
              {t('accountSettings.deleteWarning')}
            </Text>

            <Text style={styles.label}>{t('auth.password')}</Text>
            <TextInput
              style={styles.input}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.dangerBtn, deleting && { opacity: 0.6 }]}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                <Text style={styles.dangerBtnText}>
                  {deleting ? t('common.loading') : t('accountSettings.confirmDelete')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: { marginBottom: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontFamily: 'Nunito-ExtraBold', color: '#FFF' },
  name: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text },
  email: { fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.textSecondary },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.sm,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: colors.text,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.error,
    marginTop: spacing.lg,
  },
  logoutText: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.error },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-ExtraBold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalBody: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: colors.text,
    backgroundColor: colors.surface,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  modalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: colors.text,
  },
  dangerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.xl,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtnText: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: '#FFF',
  },
});
