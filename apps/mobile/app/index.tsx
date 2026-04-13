import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/(auth)/login');
      return;
    }

    switch (user.role) {
      case 'PARENT':
        router.replace('/(parent)' as any);
        break;
      case 'LEARNER':
        router.replace('/(learner)' as any);
        break;
      case 'TEACHER':
        router.replace('/(teacher)' as any);
        break;
      case 'CAREGIVER':
        router.replace('/(caregiver)' as any);
        break;
      case 'THERAPIST':
        router.replace('/(therapist)' as any);
        break;
      default:
        router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
