import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCollaboration, useInviteMember } from '@/hooks/useFamily';
import { AivoCard, AivoButton, LoadingState, EmptyState } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function TeamScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const insets = useSafeAreaInsets();
  const { data: team, isLoading } = useCollaboration(childId);
  const invite = useInviteMember();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('TEACHER');

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email');
      return;
    }
    try {
      await invite.mutateAsync({ learnerId: childId, email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail('');
      Alert.alert('Success', 'Invitation sent!');
    } catch {
      Alert.alert('Error', 'Failed to send invitation');
    }
  };

  const roles = [
    { key: 'TEACHER', label: 'Teacher', icon: 'school' as const, max: 1 },
    { key: 'CAREGIVER', label: 'Caregiver', icon: 'heart' as const, max: 2 },
    { key: 'THERAPIST', label: 'Therapist', icon: 'medkit' as const, max: 1 },
  ];

  if (isLoading) return <LoadingState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Care Team</Text>
      <Text style={styles.subtitle}>Manage your child's support team</Text>

      <View style={styles.seatCards}>
        {roles.map((r) => {
          const seatData = team?.seats?.[r.key.toLowerCase() as keyof typeof team.seats];
          const used = seatData?.used || 0;
          const max = seatData?.max || r.max;
          return (
            <AivoCard key={r.key} style={styles.seatCard}>
              <Ionicons name={r.icon} size={24} color={colors.primary} />
              <Text style={styles.seatRole}>{r.label}</Text>
              <Text style={styles.seatCount}>{used}/{max}</Text>
              <Text style={styles.seatLabel}>seats used</Text>
            </AivoCard>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>Team Members</Text>
      {team?.members?.length ? (
        team.members.map((member) => (
          <AivoCard key={member.id} style={styles.memberCard}>
            <View style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>{member.firstName[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{member.firstName} {member.lastName}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: member.status === 'active' ? colors.success + '20' : colors.accent + '20' }]}>
                <Text style={[styles.statusText, { color: member.status === 'active' ? colors.success : colors.accent }]}>{member.status}</Text>
              </View>
            </View>
          </AivoCard>
        ))
      ) : (
        <EmptyState
          icon={<Ionicons name="people-outline" size={40} color={colors.textSecondary} />}
          title="No Team Members"
          message="Invite teachers, caregivers, or therapists below."
        />
      )}

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg, marginBottom: spacing.md }]}>Invite Member</Text>
      <AivoCard>
        <View style={styles.roleSelector}>
          {roles.map((r) => (
            <Pressable
              key={r.key}
              style={[styles.roleBtn, inviteRole === r.key && styles.roleBtnActive]}
              onPress={() => setInviteRole(r.key)}
            >
              <Text style={[styles.roleBtnText, inviteRole === r.key && styles.roleBtnTextActive]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={inviteEmail}
          onChangeText={setInviteEmail}
          placeholder="Enter email address"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AivoButton
          title="Send Invitation"
          onPress={handleInvite}
          loading={invite.isPending}
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
  seatCards: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  seatCard: { flex: 1, alignItems: 'center' as const, paddingVertical: spacing.md },
  seatRole: { fontSize: 13, fontFamily: 'Nunito-Bold', color: colors.text, marginTop: 8 },
  seatCount: { fontSize: 22, fontFamily: 'Nunito-ExtraBold', color: colors.primary, marginTop: 4 },
  seatLabel: { fontSize: 11, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text },
  memberCard: { marginBottom: spacing.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight + '30', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  memberInitial: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.primary },
  memberName: { fontSize: 15, fontFamily: 'Nunito-Bold', color: colors.text },
  memberEmail: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  statusText: { fontSize: 11, fontFamily: 'Nunito-SemiBold' },
  roleSelector: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  roleBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surface, alignItems: 'center' },
  roleBtnActive: { backgroundColor: colors.primary },
  roleBtnText: { fontSize: 13, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary },
  roleBtnTextActive: { color: '#FFF' },
  input: { height: 48, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, fontSize: 16, fontFamily: 'Nunito-Regular', color: colors.text, backgroundColor: colors.surface },
});
