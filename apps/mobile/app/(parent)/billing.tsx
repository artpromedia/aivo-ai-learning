import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { AivoCard, AivoButton } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

const plans = [
  { name: 'Free', price: '$0', period: '/mo', features: ['1 learner', 'ELA only', 'Sage tutor'], current: false },
  { name: 'Single Learner', price: '$24.99', period: '/mo', features: ['1 learner', 'All subjects', 'Core 7 tutors', 'Brain profile'], current: true },
  { name: 'Family', price: '$19.99', period: '/mo per learner', features: ['Up to 5 learners', 'All subjects', 'Core 7 tutors', 'Team collaboration'], current: false },
  { name: 'District', price: 'Contact', period: '', features: ['Unlimited learners', 'All 14 tutors', 'Admin dashboard', 'SSO integration'], current: false },
];

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

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

      {plans.map((plan) => (
        <AivoCard key={plan.name} style={[styles.planCard, plan.current && styles.planCurrent]}>
          {plan.current && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentText}>{t('parentBilling.currentPlan')}</Text>
            </View>
          )}
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.planPrice}>{plan.price}</Text>
            <Text style={styles.planPeriod}>{plan.period}</Text>
          </View>
          {plan.features.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
          {!plan.current && (
            <AivoButton
              title={plan.name === 'District' ? t('parentBilling.contactSales') : t('parentBilling.switchPlan')}
              onPress={() => Alert.alert(plan.name === 'District' ? t('parentBilling.contactSales') : t('parentBilling.switchPlan'), t('common.comingSoon'))}
              variant="outline"
              size="sm"
              style={{ marginTop: spacing.md }}
            />
          )}
        </AivoCard>
      ))}

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
          <Pressable onPress={() => Alert.alert(t('parentBilling.paymentMethod'), t('common.comingSoon'))}>
            <Text style={styles.editLink}>{t('common.edit')}</Text>
          </Pressable>
        </View>
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
});
