import { Alert, Linking, Platform } from 'react-native';

import { api, ApiError } from './api';
import type { ClassSession } from './types';

/** A simple message that works on phones and in the browser preview. */
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') globalThis.alert?.(`${title}\n${message}`);
  else Alert.alert(title, message);
}

/** Yes / No question. Resolves true on yes. */
export function confirm(title: string, message: string, yes = 'Yes'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm?.(`${title}\n${message}`) ?? false);
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'No', style: 'cancel', onPress: () => resolve(false) },
      { text: yes, onPress: () => resolve(true) },
    ]),
  );
}

/** Ask the server for the join link (it checks the 10 minute window) and open it. */
export async function joinClass(session: ClassSession, token: string | undefined): Promise<void> {
  try {
    const res = await api<{ join_url: string }>(`/sessions/${session.id}/join`, { method: 'POST', token });
    await Linking.openURL(res.join_url);
  } catch (e) {
    notify('Cannot join yet', e instanceof ApiError ? e.message : 'Please try again.');
  }
}
