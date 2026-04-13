import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { useEngagement } from '@/hooks/useEngagement';
import { AivoCard, AivoButton } from '@aivo/mobile-ui';
import { colors, spacing, radius } from '@/constants/colors';

const categoryKeys = ['all', 'hats', 'outfits', 'pets', 'backgrounds', 'effects', 'special'] as const;
const categoryOriginals = ['All', 'Hats', 'Outfits', 'Pets', 'Backgrounds', 'Effects', 'Special'];
const shopItems = [
  { id: '1', name: 'Wizard Hat', category: 'Hats', price: 50, currency: 'coins', rarity: 'common' },
  { id: '2', name: 'Space Suit', category: 'Outfits', price: 150, currency: 'coins', rarity: 'rare' },
  { id: '3', name: 'Dragon Pet', category: 'Pets', price: 25, currency: 'gems', rarity: 'epic' },
  { id: '4', name: 'Galaxy BG', category: 'Backgrounds', price: 100, currency: 'coins', rarity: 'rare' },
  { id: '5', name: 'Sparkle Trail', category: 'Effects', price: 75, currency: 'coins', rarity: 'common' },
  { id: '6', name: 'Crown', category: 'Hats', price: 50, currency: 'gems', rarity: 'legendary' },
  { id: '7', name: 'Ninja Outfit', category: 'Outfits', price: 200, currency: 'coins', rarity: 'epic' },
  { id: '8', name: 'Robot Pet', category: 'Pets', price: 30, currency: 'gems', rarity: 'rare' },
];

const rarityColors: Record<string, string> = {
  common: colors.textSecondary,
  rare: colors.info,
  epic: colors.primary,
  legendary: colors.accent,
};

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: engagement } = useEngagement(user?.id || '');
  const [selectedCat, setSelectedCat] = useState('All');
  const { t } = useTranslation();

  const filtered = selectedCat === 'All' ? shopItems : shopItems.filter(i => i.category === selectedCat);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('learnerShop.title')}</Text>
        <View style={styles.currencyRow}>
          <View style={styles.currencyBadge}>
            <Text>🪙</Text>
            <Text style={styles.currencyText}>{engagement?.coins || 0}</Text>
          </View>
          <View style={styles.currencyBadge}>
            <Text>💎</Text>
            <Text style={styles.currencyText}>{engagement?.gems || 0}</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {categoryKeys.map((key, idx) => (
          <Pressable
            key={key}
            style={[styles.catBtn, selectedCat === categoryOriginals[idx] && styles.catBtnActive]}
            onPress={() => setSelectedCat(categoryOriginals[idx])}
          >
            <Text style={[styles.catText, selectedCat === categoryOriginals[idx] && styles.catTextActive]}>{t(`learnerShop.${key}`)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.grid}>
        {filtered.map((item) => (
          <AivoCard key={item.id} style={styles.itemCard}>
            <View style={[styles.rarityDot, { backgroundColor: rarityColors[item.rarity] }]} />
            <View style={styles.itemPreview}>
              <Ionicons name="shirt-outline" size={32} color={colors.textSecondary} />
            </View>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.priceRow}>
              <Text>{item.currency === 'coins' ? '🪙' : '💎'}</Text>
              <Text style={styles.priceText}>{item.price}</Text>
            </View>
            <AivoButton title={t('common.buy')} onPress={() => {}} size="sm" style={{ marginTop: 8 }} />
          </AivoCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: colors.text },
  currencyRow: { flexDirection: 'row', gap: 8 },
  currencyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, gap: 4 },
  currencyText: { fontSize: 14, fontFamily: 'Nunito-Bold', color: colors.text },
  catScroll: { marginBottom: spacing.md },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surface, marginRight: 8 },
  catBtnActive: { backgroundColor: colors.primary },
  catText: { fontSize: 13, fontFamily: 'Nunito-SemiBold', color: colors.textSecondary },
  catTextActive: { color: '#FFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  itemCard: { width: '47%', alignItems: 'center' as const, padding: spacing.sm },
  rarityDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: 8, right: 8 },
  itemPreview: { width: 64, height: 64, backgroundColor: colors.surface, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  itemName: { fontSize: 13, fontFamily: 'Nunito-Bold', color: colors.text, textAlign: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  priceText: { fontSize: 14, fontFamily: 'Nunito-Bold', color: colors.text },
});
