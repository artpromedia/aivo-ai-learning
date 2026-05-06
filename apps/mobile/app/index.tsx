import { useEffect } from 'react';
import { router, type Href } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';

export default function Index() {
  const { isAuthenticated, isLoading, user, mustChangePassword } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/(auth)/login');
      return;
    }

    // Forced password rotation must be honored before any other surface
    // is reachable. Mirrors the web auth-provider redirect to
    // /dashboard/change-password. Learner (PIN) sessions never set this
    // flag because learners don't have rotating passwords.
    //
    // The `as Href` is the documented expo-router escape hatch for routes
    // whose typed-routes entry hasn't been (re)generated yet — the
    // `(auth)/change-password.tsx` file exists, but `.expo/types/router.d.ts`
    // is regenerated only on dev/build, not on commit.
    if (mustChangePassword) {
      router.replace('/(auth)/change-password' as Href);
      return;
    }

    switch (user.role) {
      case 'PARENT':
        router.replace('/(parent)' as Href);
        break;
      case 'LEARNER':
        router.replace('/(learner)' as Href);
        break;
      case 'TEACHER':
        router.replace('/(teacher)' as Href);
        break;
      case 'CAREGIVER':
        router.replace('/(caregiver)' as Href);
        break;
      case 'THERAPIST':
        router.replace('/(therapist)' as Href);
        break;
      default:
        router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, user, mustChangePassword]);

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
