import { LinearGradient } from 'expo-linear-gradient';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { notify } from '@/lib/notify';
import { SOCIALS, type SocialLink } from '@/lib/social';

function open(url: string) {
  Linking.openURL(url).catch(() => notify('Cannot open', 'Please try again in a moment.'));
}

/** Two buttons per row, each in the network's own colour with its logo and name. */
export function SocialButtons() {
  return (
    <View style={styles.grid}>
      {SOCIALS.map((s) => (
        <SocialButton key={s.id} link={s} />
      ))}
    </View>
  );
}

function SocialButton({ link }: { link: SocialLink }) {
  const content = (
    <>
      <Icon name={link.icon} size={21} color="#fff" />
      <Text style={styles.label}>{link.label}</Text>
    </>
  );
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`Open Redbean on ${link.label}`} onPress={() => open(link.url)} style={({ pressed }) => [styles.cell, pressed && { opacity: 0.85 }]}>
      {link.gradient ? (
        <LinearGradient colors={link.gradient} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.button}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.button, { backgroundColor: link.color }]}>{content}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { flexGrow: 1, flexBasis: '45%' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 54, borderRadius: 14, paddingHorizontal: 14 },
  label: { color: '#fff', fontSize: 16.5, fontWeight: '700' },
});
