import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing, radius } from '@/constants/colors';
import { AivoButton } from '@aivo/mobile-ui';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [coppaConsent, setCoppaConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!coppaConsent || !termsAccepted) {
      setError('Please accept the terms and COPPA consent');
      return;
    }

    setLoading(true);
    setError('');
    const result = await signup({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    });
    if (result.success) {
      router.replace('/');
    } else {
      setError(result.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>Start your child's personalized learning journey</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              placeholder="Your full name"
              placeholderTextColor={colors.textSecondary}
              autoComplete="name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              placeholder="parent@example.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={form.password}
              onChangeText={(v) => updateField('password', v)}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={form.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)}
              placeholder="Confirm your password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
            />
          </View>

          <View style={styles.switchRow}>
            <Switch
              value={coppaConsent}
              onValueChange={setCoppaConsent}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={coppaConsent ? colors.primary : '#f4f3f4'}
            />
            <Text style={styles.switchLabel}>
              I confirm I am the parent/legal guardian (COPPA compliance)
            </Text>
          </View>

          <View style={styles.switchRow}>
            <Switch
              value={termsAccepted}
              onValueChange={setTermsAccepted}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={termsAccepted ? colors.primary : '#f4f3f4'}
            />
            <Text style={styles.switchLabel}>
              I accept the Terms of Service and Privacy Policy
            </Text>
          </View>

          <AivoButton
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            size="lg"
            style={{ marginTop: spacing.md }}
          />
        </View>

        <Pressable onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginBold}>Sign In</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: colors.primary,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Nunito-ExtraBold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: colors.error + '10',
    padding: 8,
    borderRadius: radius.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: colors.text,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  switchLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: colors.textSecondary,
  },
  loginLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingBottom: 40,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: colors.textSecondary,
  },
  loginBold: {
    fontFamily: 'Nunito-Bold',
    color: colors.primary,
  },
});
