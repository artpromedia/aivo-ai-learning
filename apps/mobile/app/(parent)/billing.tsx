import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import { API } from '@/constants/api';
import { AivoCard, AivoButton } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  priceLabel?: string;
  learnerLimit: number;
  features: string[];
}

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = user?.tenantId || '';

  const [switchingPlan, setSwitchingPlan] = useState<string | null>(null);
  const [editPaymentVisible, setEditPaymentVisible] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const { data: plansData } = useQuery<{ plans: Plan[] }>({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      const res = await apiFetch(API.BILLING, '/api/billing/plans', { skipAuth: true });
      if (!res.ok) throw new Error('Failed to fetch plans');
      return res.json();
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ['billing-subscription', tenantId],
    queryFn: async () => {
      const res = await apiFetch(API.BILLING, `/api/billing/subscription/${tenantId}`);
      if (!res.ok) throw new Error('Failed to fetch subscription');
      return res.json();
    },
    enabled: !!tenantId,
  });

  const currentPlanId = subscription?.plan || 'free';
  const plans = plansData?.plans || [];

  const handleSwitchPlan = useCallback(async (planId: string, planName: string) => {
    if (planId === 'district') {
      Alert.alert('Contact Sales', 'District plans require a custom agreement. Please contact sales@aivo.com for more information.');
      return;
    }
    Alert.alert(
      'Switch Plan',
      `Switch to ${planName}? Your billing will be updated at the start of your next cycle.`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            setSwitchingPlan(planId);
            try {
              const res = await apiFetch(API.BILLING, '/api/billing/subscription', {
                method: 'POST',
                body: JSON.stringify({ tenantId, planId }),
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('✅', `Switched to ${planName}!`);
                queryClient.invalidateQueries({ queryKey: ['billing-subscription', tenantId] });
              } else {
                Alert.alert(t('common.error'), data.error || 'Failed to switch plan');
              }
            } catch {
              Alert.alert(t('common.error'), 'Network error. Please try again.');
            } finally {
              setSwitchingPlan(null);
            }
          },
        },
      ]
    );
  }, [tenantId, t, queryClient]);

  const handleSavePayment = useCallback(async () => {
    if (cardNumber.length < 16 || cardExpiry.length < 5) {
      Alert.alert(t('common.error'), 'Please enter valid card details.');
      return;
    }
    setSavingPayment(true);
    try {
      const res = await apiFetch(API.BILLING, '/api/billing/subscription', {
        method: 'POST',
        body: JSON.stringify({ tenantId, planId: currentPlanId, paymentMethodId: `card_${Date.now()}` }),
      });
      if (res.ok) {
        Alert.alert('✅', 'Payment method updated!');
        setEditPaymentVisible(false);
        setCardNumber('');
        setCardExpiry('');
      } else {
        const data = await res.json();
        Alert.alert(t('common.error'), data.error || 'Failed to update payment');
      }
    } catch {
      Alert.alert(t('common.error'), 'Network error. Please try again.');
    } finally {
      setSavingPayment(false);
    }
  }, [cardNumber, cardExpiry, tenantId, currentPlanId, t]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backText}>{t('common.back')}</Text>
      </Pressable>

      <Text style={styles.title}>{t('parentBilling.title')}</Text>
      <Text style={styles.subtitle}>{t('parentBilling.subtitle')}</Text>

      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        const isSwitching = switchingPlan === plan.id;
        return (
          <AivoCard key={plan.id} style={[styles.planCard, isCurrent && styles.planCurrent]}>
            {isCurrent && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>{t('parentBilling.currentPlan')}</Text>
              </View>
            )}
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.planPrice}>{plan.price === 0 ? (plan.priceLabel || '$0') : `$${plan.price}`}</Text>
              <Text style={styles.planPeriod}>{plan.price > 0 ? `/${plan.interval}` : ''}</Text>
            </View>
            {plan.features.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
            {!isCurrent && (
              isSwitching ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
              ) : (
                <AivoButton
                  title={plan.id === 'district' ? t('parentBilling.contactSales') : t('parentBilling.switchPlan')}
                  onPress={() => handleSwitchPlan(plan.id, plan.name)}
                  variant="outline"
                  size="sm"
                  style={{ marginTop: spacing.md }}
                />
              )
            )}
          </AivoCard>
        );
      })}

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg, marginBottom: spacing.md }]}>
        {t('parentBilling.paymentMethod')}
      </Text>
      <AivoCard>
        <View style={styles.paymentRow}>
          <Ionicons name="card" size={24} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardNumber}>**** **** **** 4242</Text>
            <Text style={styles.cardExpiry}>Expires 12/2027</Text>
          </View>
          <Pressable onPress={() => setEditPaymentVisible(true)}>
            <Text style={styles.editLink}>{t('common.edit')}</Text>
          </Pressable>
        </View>
      </AivoCard>

      <Modal visible={editPaymentVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setEditPaymentVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Update Payment Method</Text>
            <Text style={styles.fieldLabel}>Card Number</Text>
            <TextInput
              style={styles.input}
              value={cardNumber}
              onChangeText={v => setCardNumber(v.replace(/\D/g, '').slice(0, 16))}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={16}
            />
            <Text style={styles.fieldLabel}>Expiry (MM/YY)</Text>
            <TextInput
              style={styles.input}
              value={cardExpiry}
              onChangeText={v => {
                const digits = v.replace(/\D/g, '').slice(0, 4);
                setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
              }}
              placeholder="12/27"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={5}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
              <AivoButton title={t('common.cancel')} onPress={() => setEditPaymentVisible(false)} variant="outline" size="sm" style={{ flex: 1 }} />
              {savingPayment ? (
                <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
              ) : (
                <AivoButton title={t('common.save')} onPress={handleSavePayment} size="sm" style={{ flex: 1 }} />
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
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  backText: { fontSize: 16, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginBottom: spacing.lg },
  planCard: { marginBottom: spacing.md },
  planCurrent: { borderWidth: 2, borderColor: colors.primary },
  currentBadge: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, alignSelf: 'flex-start', marginBottom: 8 },
  currentText: { fontSize: 11, fontFamily: 'Nunito-Bold', color: '#FFF' },
  planName: { fontSize: 18, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4, marginBottom: 12 },
  planPrice: { fontSize: 28, fontFamily: 'Nunito-ExtraBold', color: colors.primary },
  planPeriod: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.textSecondary, marginLeft: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  featureText: { fontSize: 14, fontFamily: 'Nunito-Regular', color: colors.text },
  sectionTitle: { fontSize: 18, fontFamily: 'Nunito-Bold', color: colors.text },
  paymentRow: { flexDirection: 'row', alignItems: 'center' },
  cardNumber: { fontSize: 15, fontFamily: 'Nunito-Bold', color: colors.text },
  cardExpiry: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  editLink: { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, width: '85%' },
  modalTitle: { fontSize: 20, fontFamily: 'Nunito-ExtraBold', color: colors.text, textAlign: 'center', marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, fontFamily: 'Nunito-Bold', color: colors.textSecondary, marginBottom: 4, marginTop: 8 },
  input: {
    height: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: colors.text,
  },
});
