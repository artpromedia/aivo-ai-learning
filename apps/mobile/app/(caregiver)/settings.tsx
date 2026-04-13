import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { AivoCard } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function CaregiverSettings() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}>
      <Text style={styles.title}>{t('caregiverSettings.title')}</Text>
      <AivoCard style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.[0] || 'C'}</Text></View>
          <View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>
      </AivoCard>
      {[
        { icon: 'notifications-outline' as const, label: t('caregiverSettings.notificationPreferences') },
        { icon: 'person-outline' as const, label: t('caregiverSettings.accountDetails') },
      ].map((item) => (
        <AivoCard key={item.label} style={styles.settingRow}>
          <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
          <Text style={styles.settingLabel}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </AivoCard>
      ))}
      <Pressable style={styles.logoutBtn} onPress={() => Alert.alert(t('common.logOut'), t('common.logOutConfirm'), [{ text: t('common.cancel') }, { text: t('common.logOut'), style: 'destructive', onPress: logout }])}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>{t('common.logOut')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text, marginBottom: spacing.lg },
  profileCard: { marginBottom: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontFamily: 'Nunito-ExtraBold', color: '#FFF' },
  name: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text },
  email: { fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  settingRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginBottom: spacing.sm },
  settingLabel: { flex: 1, fontSize: 15, fontFamily: 'Nunito-SemiBold', color: colors.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.md, borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.error, marginTop: spacing.lg },
  logoutText: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.error },
});
