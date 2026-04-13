import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/colors';

export default function StageScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#FFF" />
        </Pressable>
        <View style={styles.progressPath}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[styles.progressDot, styles.progressDotInactive]} />
          <View style={[styles.progressDot, styles.progressDotInactive]} />
        </View>
        <Pressable>
          <Ionicons name="pause" size={28} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.stageCanvas}>
        <View style={styles.tutorArea}>
          <View style={styles.tutorCircle}>
            <Text style={{ fontSize: 40 }}>🤖</Text>
          </View>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>Let's solve this together!</Text>
          </View>
        </View>

        <View style={styles.contentArea}>
          <Text style={styles.question}>What is 7 x 8?</Text>
        </View>
      </View>

      <View style={styles.responseZone}>
        {['48', '54', '56', '63'].map((answer, i) => (
          <Pressable
            key={answer}
            style={({ pressed }) => [
              styles.answerCard,
              pressed && styles.answerPressed,
            ]}
            onPress={() => {}}
          >
            <Text style={styles.answerText}>{answer}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 8 },
  progressPath: { flexDirection: 'row', gap: 8 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  progressDotActive: { backgroundColor: colors.primary, width: 14, height: 14, borderRadius: 7 },
  progressDotInactive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  stageCanvas: { flex: 1, padding: spacing.md },
  tutorArea: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  tutorCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '30', alignItems: 'center', justifyContent: 'center' },
  speechBubble: { marginLeft: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 12, flex: 1 },
  speechText: { color: '#FFF', fontSize: 16, fontFamily: 'Nunito-Regular' },
  contentArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  question: { fontSize: 32, fontFamily: 'Nunito-ExtraBold', color: '#FFF' },
  responseZone: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: spacing.md, paddingBottom: 40 },
  answerCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  answerPressed: { backgroundColor: colors.primary, borderColor: colors.primary, transform: [{ scale: 0.97 }] },
  answerText: { fontSize: 24, fontFamily: 'Nunito-ExtraBold', color: '#FFF' },
});
