import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { AivoCard, AivoButton } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';
import { API } from '@/constants/api';
import { apiFetch, getToken } from '@/lib/api';

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
      const endpoint = mfaEnabled ? '/api/auth/mfa/disable' : '/api/auth/mfa/enable';
      const res = await apiFetch(API.IDENTITY, endpoint, {
        method: 'POST',
        body: JSON.stringify({ password: mfaPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMfaEnabled(data.mfaEnabled);
        setMfaMsg(data.mfaEnabled ? t('parentSettings.mfaEnabled') : t('parentSettings.mfaDisabled'));
        setShowMfaInput(false);
        setMfaPassword('');
      } else {
        setMfaMsg(data.error || t('common.error'));
      }
    } catch {
      setMfaMsg(t('common.error'));
    }
    setMfaLoading(false);
  };

  const settingsItems = [
    { icon: 'person-outline' as const, label: t('parentSettings.accountDetails'), route: '' },
    { icon: 'notifications-outline' as const, label: t('parentSettings.notifications'), route: '' },
    { icon: 'language-outline' as const, label: t('parentSettings.language'), route: '' },
    { icon: 'key-outline' as const, label: t('parentSettings.managePins'), route: '' },
    { icon: 'download-outline' as const, label: t('parentSettings.exportData'), route: '' },
    { icon: 'trash-outline' as const, label: t('parentSettings.deleteAccount'), route: '', danger: true },
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
            onPress={() => {}}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={item.danger ? colors.error : colors.textSecondary}
            />
            <Text style={[styles.settingsLabel, item.danger && { color: colors.error }]}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
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
        {!showMfaInput ? (
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text, marginBottom: spacing.lg },
  profileCard: { marginBottom: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontFamily: 'Nunito-ExtraBold', color: '#FFF' },
  profileName: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text },
  profileEmail: { fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  roleBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: { fontSize: 11, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  settingsCard: { marginBottom: spacing.md, padding: 0 },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: 12,
  },
  settingsBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  settingsLabel: { flex: 1, fontSize: 15, fontFamily: 'Nunito-SemiBold', color: colors.text },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.error,
    marginTop: spacing.md,
  },
  logoutText: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.error },
  version: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  mfaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  mfaTitle: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: colors.text,
  },
  mfaDesc: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  mfaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  mfaBadgeOn: {
    backgroundColor: '#dcfce7',
  },
  mfaBadgeText: {
    fontSize: 11,
    fontFamily: 'Nunito-Bold',
    color: colors.textSecondary,
  },
  mfaBadgeTextOn: {
    color: '#16a34a',
  },
  mfaMsg: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: colors.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  mfaToggleBtn: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  mfaToggleBtnDanger: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  mfaToggleText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#fff',
  },
  mfaToggleTextDanger: {
    color: colors.error,
  },
  mfaInputSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 8,
  },
  mfaInput: {
    height: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: colors.text,
  },
  mfaBtnRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  mfaCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mfaCancelText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: colors.textSecondary,
  },
});
