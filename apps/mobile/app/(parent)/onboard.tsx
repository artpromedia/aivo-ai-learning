import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useAddLearner } from '@/hooks/useLearners';
import { AivoCard, AivoButton } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

export default function OnboardScreen() {
  const insets = useSafeAreaInsets();
  const addLearner = useAddLearner();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    gradeLevel: '',
    pin: '',
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddChild = async () => {
    if (!form.firstName || !form.gradeLevel || !form.pin) {
      Alert.alert('Missing Info', 'Please fill in all required fields');
      return;
    }
    try {
      await addLearner.mutateAsync(form);
      router.replace('/(parent)/');
    } catch {
      Alert.alert('Error', 'Failed to add child. Please try again.');
    }
  };

  const steps = ['Child Info', 'Grade & Assessment', 'IEP Upload', 'Review'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Add a Child</Text>
      <Text style={styles.subtitle}>Set up your child's personalized learning profile</Text>

      <View style={styles.stepper}>
        {steps.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepCircle, i <= step && styles.stepActive]}>
              <Text style={[styles.stepNum, i <= step && styles.stepNumActive]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <AivoCard style={styles.formCard}>
        {step === 0 && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={form.firstName}
                onChangeText={(v) => updateField('firstName', v)}
                placeholder="Child's first name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={form.lastName}
                onChangeText={(v) => updateField('lastName', v)}
                placeholder="Child's last name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <AivoButton title="Next" onPress={() => setStep(1)} size="lg" />
          </>
        )}

        {step === 1 && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Grade Level *</Text>
              <TextInput
                style={styles.input}
                value={form.gradeLevel}
                onChangeText={(v) => updateField('gradeLevel', v)}
                placeholder="e.g., 3"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Learner PIN *</Text>
              <TextInput
                style={styles.input}
                value={form.pin}
                onChangeText={(v) => updateField('pin', v.replace(/\D/g, '').slice(0, 4))}
                placeholder="4-digit PIN"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
            <View style={styles.btnRow}>
              <AivoButton title="Back" onPress={() => setStep(0)} variant="outline" size="lg" style={{ flex: 1, marginRight: 8 }} />
              <AivoButton title="Next" onPress={() => setStep(2)} size="lg" style={{ flex: 1 }} />
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <View style={styles.uploadArea}>
              <Ionicons name="document-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.uploadTitle}>Upload IEP (Optional)</Text>
              <Text style={styles.uploadDesc}>You can upload your child's IEP now or later</Text>
              <AivoButton
                title="Upload IEP"
                onPress={() => Alert.alert('Upload', 'Document upload coming soon')}
                variant="outline"
                size="sm"
                style={{ marginTop: spacing.md }}
              />
            </View>
            <View style={styles.btnRow}>
              <AivoButton title="Back" onPress={() => setStep(1)} variant="outline" size="lg" style={{ flex: 1, marginRight: 8 }} />
              <AivoButton title="Skip & Continue" onPress={() => setStep(3)} size="lg" style={{ flex: 1 }} />
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.reviewTitle}>Review</Text>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Name</Text>
              <Text style={styles.reviewValue}>{form.firstName} {form.lastName}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Grade</Text>
              <Text style={styles.reviewValue}>{form.gradeLevel}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>PIN</Text>
              <Text style={styles.reviewValue}>****</Text>
            </View>
            <View style={styles.btnRow}>
              <AivoButton title="Back" onPress={() => setStep(2)} variant="outline" size="lg" style={{ flex: 1, marginRight: 8 }} />
              <AivoButton title="Add Child" onPress={handleAddChild} loading={addLearner.isPending} size="lg" style={{ flex: 1 }} />
            </View>
          </>
        )}
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
  stepper: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: colors.primary },
  stepNum: { fontSize: 14, fontFamily: 'Nunito-Bold', color: colors.textSecondary },
  stepNumActive: { color: '#FFF' },
  stepLabel: { fontSize: 11, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  stepLabelActive: { color: colors.primary, fontFamily: 'Nunito-SemiBold' },
  formCard: { },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: colors.text, marginBottom: 6 },
  input: { height: 48, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing.md, fontSize: 16, fontFamily: 'Nunito-Regular', color: colors.text, backgroundColor: colors.surface },
  btnRow: { flexDirection: 'row', marginTop: spacing.md },
  uploadArea: { alignItems: 'center', padding: spacing.lg, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.xl, marginBottom: spacing.md },
  uploadTitle: { fontSize: 16, fontFamily: 'Nunito-Bold', color: colors.text, marginTop: 8 },
  uploadDesc: { fontSize: 13, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginTop: 4 },
  reviewTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text, marginBottom: spacing.md },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewLabel: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  reviewValue: { fontSize: 14, fontFamily: 'Nunito-Bold', color: colors.text },
});
