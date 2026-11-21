import { router } from 'expo-router';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { SocialButtons } from '@/components/social-buttons';
import { Button, Card, Row, Screen, SectionTitle } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { brand } from '@/lib/brand';
import { SUPPORT_PHONE } from '@/lib/config';
import { confirm, notify } from '@/lib/notify';

export default function More() {
  const { session, signOut } = useAuth();
  const u = session?.user;

  function help() {
    if (!SUPPORT_PHONE) return notify('Help', 'The Redbean helpline number will be added here soon. For now, please ask your coach in class.');
    if (Platform.OS === 'web') return void Linking.openURL(`tel:+${SUPPORT_PHONE}`);
    Alert.alert('Need help?', 'Talk to the Redbean team.', [
      { text: 'Call', onPress: () => void Linking.openURL(`tel:+${SUPPORT_PHONE}`) },
      { text: 'WhatsApp', onPress: () => void Linking.openURL(`https://wa.me/${SUPPORT_PHONE}`) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function logout() {
    if (await confirm('Sign out', 'Do you want to sign out?', 'Sign out')) await signOut();
  }

  return (
    <Screen title="More">
      <Card style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(u?.name ?? '?').slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{u?.name}</Text>
          <Text style={styles.meta}>{u?.phone ?? u?.email}</Text>
        </View>
      </Card>

      <Card style={{ padding: 6 }}>
        <Row icon="help-circle-outline" title="Ask a question" detail="MD Sir and coaches answer you" onPress={() => router.push('/doubts')} />
        <Row icon="calendar-outline" title="My attendance" detail="Classes you joined and missed" onPress={() => router.push('/attendance')} />
        <Row icon="ribbon-outline" title="My certificates" detail="See what is left and open your certificates" onPress={() => router.push('/certificates')} />
        <Row icon="wallet-outline" title="Fees" detail="Payments and what is due" onPress={() => router.push('/fees')} />
        <Row icon="settings-outline" title="Settings" detail="Reminders and GST details" onPress={() => router.push('/settings')} />
        <Row icon="call-outline" title="Help" detail="Call or WhatsApp the Redbean team" onPress={help} tone="red" />
      </Card>

      <SectionTitle>Follow Redbean</SectionTitle>
      <SocialButtons />

      <Button label="Sign out" variant="quiet" icon="log-out-outline" onPress={logout} />
      <Text style={styles.version}>Redbean Academy</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: brand.red, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: brand.ink },
  meta: { fontSize: 15.5, color: brand.muted },
  version: { textAlign: 'center', color: '#a8a39a', fontSize: 13, marginTop: 4 },
});
