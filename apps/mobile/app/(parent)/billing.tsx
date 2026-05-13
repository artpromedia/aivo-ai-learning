import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TUTOR_KEY_TO_SKU,
  type TutorKey,
  type TutorSku,
} from '@aivo/billing-entitlements';
import { TUTORS } from '@aivo/brand';
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

interface Subscription {
  plan: string;
  status: string;
  paymentStatus?: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripeCustomer?: boolean;
  currentPeriodEnd?: string | null;
}

interface Entitlements {
  plan: string;
  status: string;
  includedTutorSkus: TutorSku[];
  purchasedTutorSkus: TutorSku[];
  effectiveTutorSkus: TutorSku[];
}

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = user?.tenantId || '';

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [addonLoading, setAddonLoading] = useState<TutorKey | null>(null);

  const { data: plansData } = useQuery<{ plans: Plan[] }>({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      const res = await apiFetch(API.BILLING, '/api/billing/plans', { skipAuth: true });
      if (!res.ok) throw new Error('Failed to fetch plans');
      return res.json();
    },
  });

  const { data: subscription } = useQuery<Subscription>({
    queryKey: ['billing-subscription', tenantId],
    queryFn: async () => {
      const res = await apiFetch(API.BILLING, `/api/billing/subscription/${tenantId}`);
      if (!res.ok) throw new Error('Failed to fetch subscription');
      return res.json();
    },
    enabled: !!tenantId,
  });

  const { data: entitlements } = useQuery<Entitlements>({
    queryKey: ['billing-entitlements', tenantId],
    queryFn: async () => {
      const res = await apiFetch(API.BILLING, `/api/billing/entitlements/${tenantId}`);
      if (!res.ok) throw new Error('Failed to fetch entitlements');
      return res.json();
    },
    enabled: !!tenantId,
  });

  const currentPlanId = subscription?.plan || 'free';
  const plans = plansData?.plans || [];
  const includedSkus = new Set<TutorSku>(entitlements?.includedTutorSkus ?? []);
  const purchasedSkus = new Set<TutorSku>(entitlements?.purchasedTutorSkus ?? []);
  const paymentFailed =
    subscription?.paymentStatus === 'failed' || subscription?.status === 'past_due';

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['billing-subscription', tenantId] });
    queryClient.invalidateQueries({ queryKey: ['billing-entitlements', tenantId] });
  }, [tenantId, queryClient]);

  const startCheckout = useCallback(
    async (planId: string, planName: string) => {
      if (planId === 'district') {
        Alert.alert(
          'Contact Sales',
          'District plans require a custom agreement. Please contact sales@aivolearning.com for more information.',
        );
        return;
      }
      if (planId === 'free') {
        Alert.alert(
          'Downgrade to Free',
          'Cancel your current subscription? Access continues until the end of the billing period.',
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: 'Cancel subscription',
              style: 'destructive',
              onPress: async () => {
                const res = await apiFetch(
                  API.BILLING,
                  `/api/billing/subscription/${tenantId}/cancel`,
                  { method: 'POST' },
                );
                if (res.ok) {
                  Alert.alert('Scheduled', 'Your subscription will end at the period end.');
                  refreshAll();
                } else {
                  const data = await res.json().catch(() => ({}));
                  Alert.alert(t('common.error'), data.error || 'Could not cancel');
                }
              },
            },
          ],
        );
        return;
      }
      setCheckoutLoading(planId);
      try {
        const res = await apiFetch(API.BILLING, '/api/billing/checkout/session', {
          method: 'POST',
          body: JSON.stringify({ tenantId, planId }),
        });
        const data = await res.json();
        if (res.ok && data.checkoutUrl) {
          // Opens the OS browser/tab so 3DS, Apple Pay, Link, etc. all work.
          await WebBrowser.openBrowserAsync(data.checkoutUrl);
          refreshAll();
        } else {
          Alert.alert(t('common.error'), data.error || `Could not start checkout for ${planName}`);
        }
      } catch {
        Alert.alert(t('common.error'), 'Network error. Please try again.');
      } finally {
        setCheckoutLoading(null);
      }
    },
    [tenantId, t, refreshAll],
  );

  const openPortal = useCallback(async () => {
    setPortalLoading(true);
    try {
      const res = await apiFetch(API.BILLING, '/api/billing/portal/session', {
        method: 'POST',
        body: JSON.stringify({ tenantId }),
      });
      const data = await res.json();
      if (res.ok && data.portalUrl) {
        await WebBrowser.openBrowserAsync(data.portalUrl);
        refreshAll();
      } else {
        Alert.alert(t('common.error'), data.error || 'Could not open billing portal');
      }
    } catch {
      Alert.alert(t('common.error'), 'Network error. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  }, [tenantId, t, refreshAll]);

  const addAddon = useCallback(
    async (key: TutorKey) => {
      setAddonLoading(key);
      try {
        const res = await apiFetch(API.BILLING, '/api/billing/addons', {
          method: 'POST',
          body: JSON.stringify({ tenantId, tutorSku: TUTOR_KEY_TO_SKU[key] }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          refreshAll();
        } else {
          Alert.alert(t('common.error'), data.error || 'Could not add tutor');
        }
      } catch {
        Alert.alert(t('common.error'), 'Network error. Please try again.');
      } finally {
        setAddonLoading(null);
      }
    },
    [tenantId, t, refreshAll],
  );

  const removeAddon = useCallback(
    async (key: TutorKey) => {
      setAddonLoading(key);
      try {
        const sku = TUTOR_KEY_TO_SKU[key];
        const res = await apiFetch(API.BILLING, `/api/billing/addons/${tenantId}/${sku}`, {
          method: 'DELETE',
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          refreshAll();
        } else {
          Alert.alert(t('common.error'), data.error || 'Could not remove tutor');
        }
      } catch {
        Alert.alert(t('common.error'), 'Network error. Please try again.');
      } finally {
        setAddonLoading(null);
      }
    },
    [tenantId, t, refreshAll],
  );

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

      {paymentFailed && (
        <AivoCard style={styles.paymentFailedCard}>
          <Text style={styles.paymentFailedText}>
            Your last payment failed. Update your card to keep access.
          </Text>
          <AivoButton
            title={portalLoading ? '...' : 'Update payment method'}
            onPress={openPortal}
            size="sm"
            style={{ marginTop: spacing.sm }}
          />
        </AivoCard>
      )}

      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        const isSwitching = checkoutLoading === plan.id;
        return (
          <AivoCard key={plan.id} style={[styles.planCard, isCurrent && styles.planCurrent]}>
            {isCurrent && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>{t('parentBilling.currentPlan')}</Text>
              </View>
            )}
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.planPrice}>
                {plan.price === 0 ? plan.priceLabel || '$0' : `$${plan.price}`}
              </Text>
              <Text style={styles.planPeriod}>
                {plan.price > 0 ? `/${plan.interval}` : ''}
              </Text>
            </View>
            {plan.features.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
            {!isCurrent &&
              (isSwitching ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
              ) : (
                <AivoButton
                  title={
                    plan.id === 'district'
                      ? t('parentBilling.contactSales')
                      : plan.id === 'free'
                        ? 'Downgrade to free'
                        : t('parentBilling.switchPlan')
                  }
                  onPress={() => startCheckout(plan.id, plan.name)}
                  variant="outline"
                  size="sm"
                  style={{ marginTop: spacing.md }}
                />
              ))}
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
            <Text style={styles.cardNumber}>
              {subscription?.hasStripeCustomer ? 'Managed via Stripe' : 'No payment method on file'}
            </Text>
            <Text style={styles.cardExpiry}>
              {subscription?.hasStripeCustomer
                ? 'Tap manage to update card, view invoices, or cancel.'
                : 'Subscribe to a paid plan to add a card.'}
            </Text>
          </View>
        </View>
        {subscription?.hasStripeCustomer && (
          <AivoButton
            title={portalLoading ? '...' : 'Manage billing'}
            onPress={openPortal}
            size="sm"
            style={{ marginTop: spacing.sm }}
          />
        )}
      </AivoCard>

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg, marginBottom: spacing.md }]}>
        Tutor add-ons
      </Text>
      {(Object.entries(TUTORS) as [TutorKey, typeof TUTORS[TutorKey]][]).map(([key, tutor]) => {
        const sku = TUTOR_KEY_TO_SKU[key];
        const isIncluded = includedSkus.has(sku);
        const isPurchased = purchasedSkus.has(sku);
        const isProcessing = addonLoading === key;
        return (
          <AivoCard key={key} style={styles.tutorRow}>
            <View style={styles.tutorInfo}>
              <Text style={styles.tutorName}>{tutor.name}</Text>
              <Text style={styles.tutorDomain}>{tutor.domain}</Text>
            </View>
            {isIncluded ? (
              <Text style={styles.includedTag}>Included</Text>
            ) : isPurchased ? (
              <AivoButton
                title={isProcessing ? '...' : 'Remove'}
                onPress={() => removeAddon(key)}
                variant="outline"
                size="sm"
                disabled={isProcessing}
              />
            ) : (
              <AivoButton
                title={isProcessing ? '...' : '+ $4.99/mo'}
                onPress={() => addAddon(key)}
                size="sm"
                disabled={isProcessing || !subscription?.hasStripeCustomer}
              />
            )}
          </AivoCard>
        );
      })}
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
  paymentFailedCard: { marginBottom: spacing.md, borderWidth: 2, borderColor: colors.error },
  paymentFailedText: { fontSize: 14, fontFamily: 'Nunito-Bold', color: colors.error },
  tutorRow: { marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tutorInfo: { flex: 1 },
  tutorName: { fontSize: 15, fontFamily: 'Nunito-Bold', color: colors.text },
  tutorDomain: { fontSize: 12, fontFamily: 'Nunito-Regular', color: colors.textSecondary },
  includedTag: { fontSize: 12, fontFamily: 'Nunito-Bold', color: colors.textSecondary },
});
