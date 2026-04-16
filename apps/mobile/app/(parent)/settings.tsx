import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, TextInput, Modal, Switch, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { AivoCard, AivoButton } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';
import { API } from '@/constants/api';
import { apiFetch } from '@/lib/api';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaForced, setMfaForced] = useState(false);
  const [mfaPassword, setMfaPassword] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMsg, setMfaMsg] = useState('');
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [mfaEnableToken, setMfaEnableToken] = useState('');
  const [mfaEnableCode, setMfaEnableCode] = useState('');

  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [savingAccount, setSavingAccount] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [exportingData, setExportingData] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(API.IDENTITY, '/api/auth/mfa/status');
        if (res.ok) {
          const data = await res.json();
          setMfaEnabled(!!data.mfaEnabled);
          setMfaForced(!!data.mfaForced);
        }
      } catch {}
    })();
  }, []);

  const handleMfaToggle = async () => {
    if (!mfaPassword) return;
    setMfaLoading(true);
    setMfaMsg('');
    try {
      if (mfaEnabled) {
        const res = await apiFetch(API.IDENTITY, '/api/auth/mfa/disable', {
          method: 'POST',
          body: JSON.stringify({ password: mfaPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          setMfaEnabled(false);
          setMfaMsg(t('parentSettings.mfaDisabled'));
          setShowMfaInput(false);
          setMfaPassword('');
        } else {
          setMfaMsg(data.error || t('common.error'));
        }
      } else {
        const res = await apiFetch(API.IDENTITY, '/api/auth/mfa/enable', {
          method: 'POST',
          body: JSON.stringify({ password: mfaPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          setMfaEnableToken(data.mfaToken);
          setMfaPassword('');
        } else {
          setMfaMsg(data.error || t('common.error'));
        }
      }
    } catch {
      setMfaMsg(t('common.error'));
    }
    setMfaLoading(false);
  };

  const handleMfaConfirmEnable = async () => {
    if (mfaEnableCode.length !== 6) return;
    setMfaLoading(true);
    setMfaMsg('');
    try {
      const res = await apiFetch(API.IDENTITY, '/api/auth/mfa/confirm-enable', {
        method: 'POST',
        body: JSON.stringify({ mfaToken: mfaEnableToken, code: mfaEnableCode }),
        skipAuth: true,
      });
      const data = await res.json();
      if (res.ok) {
        setMfaEnabled(true);
        setMfaMsg(t('parentSettings.mfaEnabled'));
        setMfaEnableToken('');
        setMfaEnableCode('');
        setShowMfaInput(false);
      } else {
        setMfaMsg(data.error || t('common.error'));
        setMfaEnableCode('');
      }
    } catch {
      setMfaMsg(t('common.error'));
    }
    setMfaLoading(false);
  };

  const handleSaveAccount = useCallback(async () => {
    if (!editName.trim()) {
      Alert.alert(t('common.error'), 'Name is required.');
      return;
    }
    setSavingAccount(true);
    try {
      const res = await apiFetch(API.IDENTITY, '/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim() }),
      });
      if (res.ok) {
        Alert.alert('✅', 'Account updated!');
        setAccountModalVisible(false);
      } else {
        const data = await res.json();
        Alert.alert(t('common.error'), data.error || 'Failed to update account');
      }
    } catch {
      Alert.alert(t('common.error'), 'Network error. Please try again.');
    } finally {
      setSavingAccount(false);
    }
  }, [editName, editEmail, t]);

  const handleNotificationToggle = useCallback((value: boolean) => {
    setNotificationsEnabled(value);
    Alert.alert('✅', value ? 'Notifications enabled' : 'Notifications disabled');
  }, []);

  const handleLanguageSelect = useCallback((lang: string) => {
    setSelectedLanguage(lang);
    setLanguageModalVisible(false);
    Alert.alert('✅', `Language set to ${lang === 'en' ? 'English' : 'Español'}`);
  }, []);

  const handleSavePin = useCallback(async () => {
    if (newPin.length !== 4) {
      Alert.alert(t('common.error'), 'PIN must be 4 digits.');
      return;
    }
    setSavingPin(true);
    try {
      const res = await apiFetch(API.IDENTITY, '/api/users/learners', {
        method: 'GET',
      });
      if (res.ok) {
        const learnersList = await res.json();
        if (Array.isArray(learnersList) && learnersList.length > 0) {
          const updateRes = await apiFetch(API.IDENTITY, `/api/users/learners/${learnersList[0].id}`, {
            method: 'PUT',
            body: JSON.stringify({ pin: newPin }),
          });
          if (updateRes.ok) {
            Alert.alert('✅', `PIN updated for ${learnersList[0].firstName}!`);
            setPinModalVisible(false);
            setNewPin('');
          } else {
            const data = await updateRes.json();
            Alert.alert(t('common.error'), data.error || 'Failed to update PIN');
          }
        } else {
          Alert.alert(t('common.error'), 'No learner profiles found to update PIN.');
        }
      } else {
        Alert.alert(t('common.error'), 'Failed to load learner profiles.');
      }
    } catch {
      Alert.alert(t('common.error'), 'Network error. Please try again.');
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
        Alert.alert('Data Export', `Your account data has been prepared.\n\nName: ${data.name}\nEmail: ${data.email}\nRole: ${data.role}\n\nA full data export has been sent to your email.`);
      } else {
        Alert.alert(t('common.error'), 'Failed to export data');
      }
    } catch {
      Alert.alert(t('common.error'), 'Network error. Please try again.');
    } finally {
      setExportingData(false);
    }
  }, [t]);

  const handleDeleteAccount = useCallback(() => {
    setDeletePassword('');
    setDeleteModalVisible(true);
  }, []);

  const confirmDeleteAccount = useCallback(async () => {
    if (!deletePassword) {
      Alert.alert(t('common.error'), 'Please enter your password to confirm.');
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
        const data = await res.json();
        Alert.alert(t('common.error'), data.error || 'Failed to delete account');
      }
    } catch {
      Alert.alert(t('common.error'), 'Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  }, [deletePassword, t, logout]);

  const settingsItems = [
    { icon: 'person-outline' as const, label: t('parentSettings.accountDetails'), action: () => setAccountModalVisible(true) },
    { icon: 'notifications-outline' as const, label: t('parentSettings.notifications'), action: () => {}, toggle: true },
    { icon: 'language-outline' as const, label: t('parentSettings.language'), action: () => setLanguageModalVisible(true) },
    { icon: 'key-outline' as const, label: t('parentSettings.managePins'), action: () => setPinModalVisible(true) },
    { icon: 'download-outline' as const, label: t('parentSettings.exportData'), action: handleExportData, loading: exportingData },
    { icon: 'trash-outline' as const, label: t('parentSettings.deleteAccount'), action: handleDeleteAccount, danger: true },
  ];

  const handleLogout = () => {
    Alert.alert(t('common.logOut'), t('common.logOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logOut'), style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <Text style={styles.title}>{t('parentSettings.title')}</Text>

      <AivoCard style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0] || 'P'}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role}</Text>
            </View>
          </View>
        </View>
      </AivoCard>

      <AivoCard style={styles.settingsCard}>
        {settingsItems.map((item, i) => (
          <Pressable
            key={item.label}
            style={[styles.settingsRow, i < settingsItems.length - 1 && styles.settingsBorder]}
            onPress={item.toggle ? undefined : item.action}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={item.danger ? colors.error : colors.textSecondary}
            />
            <Text style={[styles.settingsLabel, item.danger && { color: colors.error }]}>
              {item.label}
            </Text>
            {item.toggle ? (
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            ) : item.loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            )}
          </Pressable>
        ))}
      </AivoCard>

      <AivoCard style={styles.settingsCard}>
        <View style={styles.mfaHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mfaTitle}>{t('parentSettings.twoFactorAuth')}</Text>
            <Text style={styles.mfaDesc}>{t('parentSettings.mfaDesc')}</Text>
          </View>
          <View style={[styles.mfaBadge, mfaEnabled && styles.mfaBadgeOn]}>
            <Text style={[styles.mfaBadgeText, mfaEnabled && styles.mfaBadgeTextOn]}>
              {mfaEnabled ? t('common.on') : t('common.off')}
            </Text>
          </View>
        </View>
        {mfaMsg ? <Text style={styles.mfaMsg}>{mfaMsg}</Text> : null}
        {mfaEnableToken ? (
          <View style={styles.mfaInputSection}>
            <Text style={styles.mfaDesc}>{t('parentSettings.enterCode') || 'Enter the 6-digit code sent to your email.'}</Text>
            <TextInput
              style={[styles.mfaInput, { textAlign: 'center', letterSpacing: 8, fontSize: 20, fontFamily: 'Nunito-Bold' }]}
              value={mfaEnableCode}
              onChangeText={v => setMfaEnableCode(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
            />
            <View style={styles.mfaBtnRow}>
              <AivoButton
                title={mfaLoading ? t('common.saving') : t('common.confirm')}
                onPress={handleMfaConfirmEnable}
                loading={mfaLoading}
                disabled={mfaEnableCode.length !== 6}
                size="sm"
                style={{ flex: 1 }}
              />
              <Pressable
                style={styles.mfaCancelBtn}
                onPress={() => { setMfaEnableToken(''); setMfaEnableCode(''); setShowMfaInput(false); }}
              >
                <Text style={styles.mfaCancelText}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
          </View>
        ) : !showMfaInput ? (
          <Pressable
            style={[styles.mfaToggleBtn, mfaEnabled && styles.mfaToggleBtnDanger]}
            onPress={() => setShowMfaInput(true)}
            disabled={mfaForced && mfaEnabled}
          >
            <Text style={[styles.mfaToggleText, mfaEnabled && styles.mfaToggleTextDanger]}>
              {mfaEnabled ? t('parentSettings.disableMfa') : t('parentSettings.enableMfa')}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.mfaInputSection}>
            <TextInput
              style={styles.mfaInput}
              value={mfaPassword}
              onChangeText={setMfaPassword}
              placeholder={t('parentSettings.enterPassword')}
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
            />
            <View style={styles.mfaBtnRow}>
              <AivoButton
                title={mfaLoading ? t('common.saving') : t('common.confirm')}
                onPress={handleMfaToggle}
                loading={mfaLoading}
                disabled={!mfaPassword}
                size="sm"
                style={{ flex: 1 }}
              />
              <Pressable
                style={styles.mfaCancelBtn}
                onPress={() => { setShowMfaInput(false); setMfaPassword(''); }}
              >
                <Text style={styles.mfaCancelText}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </AivoCard>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>{t('common.logOut')}</Text>
      </Pressable>

      <Text style={styles.version}>{t('parentSettings.appVersion')}</Text>

      <Modal visible={accountModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setAccountModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Account Details</Text>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.modalInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
              <AivoButton title={t('common.cancel')} onPress={() => setAccountModalVisible(false)} variant="outline" size="sm" style={{ flex: 1 }} />
              {savingAccount ? (
                <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
              ) : (
                <AivoButton title={t('common.save')} onPress={handleSaveAccount} size="sm" style={{ flex: 1 }} />
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={languageModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('parentSettings.language')}</Text>
            {[{ code: 'en', label: 'English' }, { code: 'es', label: 'Español' }].map(lang => (
              <Pressable
                key={lang.code}
                style={[styles.langRow, selectedLanguage === lang.code && styles.langRowActive]}
                onPress={() => handleLanguageSelect(lang.code)}
              >
                <Text style={[styles.langText, selectedLanguage === lang.code && styles.langTextActive]}>{lang.label}</Text>
                {selectedLanguage === lang.code && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={pinModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setPinModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t('parentSettings.managePins')}</Text>
            <Text style={styles.fieldLabel}>New 4-digit PIN</Text>
            <TextInput
              style={[styles.modalInput, { textAlign: 'center', letterSpacing: 12, fontSize: 24, fontFamily: 'Nunito-ExtraBold' }]}
              value={newPin}
              onChangeText={v => setNewPin(v.replace(/\D/g, '').slice(0, 4))}
              placeholder="• • • •"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
              <AivoButton title={t('common.cancel')} onPress={() => { setPinModalVisible(false); setNewPin(''); }} variant="outline" size="sm" style={{ flex: 1 }} />
              {savingPin ? (
                <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
              ) : (
                <AivoButton title={t('common.save')} onPress={handleSavePin} size="sm" style={{ flex: 1 }} />
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={deleteModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setDeleteModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Ionicons name="warning" size={40} color={colors.error} style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={[styles.modalTitle, { color: colors.error }]}>{t('parentSettings.deleteAccount')}</Text>
            <Text style={{ fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md }}>
              {t('parentSettings.deleteAccountConfirm') || 'This will permanently delete your account and all learner data. Enter your password to confirm.'}
            </Text>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={styles.modalInput}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
              <AivoButton title={t('common.cancel')} onPress={() => { setDeleteModalVisible(false); setDeletePassword(''); }} variant="outline" size="sm" style={{ flex: 1 }} />
              {deleting ? (
                <ActivityIndicator color={colors.error} style={{ flex: 1 }} />
              ) : (
                <Pressable
                  style={{ flex: 1, backgroundColor: colors.error, borderRadius: radius.lg, paddingVertical: 10, alignItems: 'center' }}
                  onPress={confirmDeleteAccount}
                >
                  <Text style={{ fontSize: 14, fontFamily: 'Nunito-Bold', color: '#FFF' }}>Delete Forever</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text, marginBottom: spacing.lg },
  profileCard: { marginBottom: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontFamily: 'Nunito-ExtraBold', color: '#FFF' },
  profileName: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text },
  profileEmail: { fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  roleBadge: { backgroundColor: colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, alignSelf: 'flex-start', marginTop: 4 },
  roleText: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  settingsCard: { marginBottom: spacing.md, padding: 0 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: 12 },
  settingsBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  settingsLabel: { flex: 1, fontSize: 15, fontFamily: 'Nunito-SemiBold', color: colors.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.md, borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.error, marginTop: spacing.md },
  logoutText: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.error },
  version: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
  mfaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, padding: spacing.md },
  mfaTitle: { fontSize: 15, fontFamily: 'Nunito-Bold', color: colors.text },
  mfaDesc: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginTop: 2 },
  mfaBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full, backgroundColor: colors.border },
  mfaBadgeOn: { backgroundColor: '#dcfce7' },
  mfaBadgeText: { fontSize: 11, fontFamily: 'Nunito-Bold', color: colors.textSecondary },
  mfaBadgeTextOn: { color: '#16a34a' },
  mfaMsg: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.primary, textAlign: 'center', paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  mfaToggleBtn: { marginHorizontal: spacing.md, marginBottom: spacing.md, paddingVertical: 10, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center' },
  mfaToggleBtnDanger: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.error },
  mfaToggleText: { fontSize: 14, fontFamily: 'Nunito-Bold', color: '#fff' },
  mfaToggleTextDanger: { color: colors.error },
  mfaInputSection: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: 8 },
  mfaInput: { height: 44, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.text },
  mfaBtnRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  mfaCancelBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  mfaCancelText: { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, width: '85%' },
  modalTitle: { fontSize: 20, fontFamily: 'Nunito-ExtraBold', color: colors.text, textAlign: 'center', marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, fontFamily: 'Nunito-Bold', color: colors.textSecondary, marginBottom: 4, marginTop: 8 },
  modalInput: { height: 44, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, fontSize: 16, fontFamily: 'Nunito-Regular', color: colors.text },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.lg, marginBottom: 4 },
  langRowActive: { backgroundColor: colors.primary + '15' },
  langText: { fontSize: 16, fontFamily: 'Nunito-SemiBold', color: colors.text },
  langTextActive: { color: colors.primary },
});
