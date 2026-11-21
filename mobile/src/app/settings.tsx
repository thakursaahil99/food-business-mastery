import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Async, Button, Card, Field, Screen, SectionTitle, ToggleRow } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { brand } from '@/lib/brand';
import { notify } from '@/lib/notify';
import type { BillingProfile, ReminderPrefs } from '@/lib/types';
import { useApi, useWrite } from '@/lib/use-api';

const EMPTY: BillingProfile = { businessName: '', gstin: '', address: '', state: '' };

export default function Settings() {
  const prefs = useApi<ReminderPrefs>('/my/reminder-prefs');
  const billing = useApi<BillingProfile | null>('/my/billing-profile');
  const write = useWrite();
  const [form, setForm] = useState<BillingProfile>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (billing.data) setForm(billing.data);
  }, [billing.data]);

  const reload = async () => {
    await Promise.all([prefs.reload(), billing.reload()]);
  };

  async function toggle(key: keyof ReminderPrefs, value: boolean) {
    if (!prefs.data) return;
    const next = { ...prefs.data, [key]: value };
    prefs.setData(next); // show the change at once
    try {
      await write('/my/reminder-prefs', 'PUT', next);
    } catch {
      prefs.setData(prefs.data);
      notify('Not saved', 'Could not save this setting. Please try again.');
    }
  }

  async function saveBilling() {
    const next: Record<string, string> = {};
    if (form.businessName.trim().length < 2) next.businessName = 'Enter the business name for the bill.';
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(form.gstin.trim().toUpperCase())) next.gstin = 'This does not look like a 15 character GST number.';
    if (form.address.trim().length < 8) next.address = 'Enter the full address.';
    if (form.state.trim().length < 2) next.state = 'Enter the state.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const saved = await write<BillingProfile>('/my/billing-profile', 'PUT', { ...form, gstin: form.gstin.trim().toUpperCase() });
      setForm(saved);
      notify('Saved', 'Your GST details will be used on your bills.');
    } catch (e) {
      notify('Not saved', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof BillingProfile) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const p = prefs.data;

  return (
    <Screen title="Settings" back keyboard onRefresh={reload}>
      <SectionTitle>Class reminders</SectionTitle>
      <Async loading={prefs.loading} error={prefs.error} onRetry={prefs.reload}>
        {p ? (
          <Card style={{ paddingVertical: 4 }}>
            <ToggleRow title="Remind me on WhatsApp" value={p.whatsapp} onChange={(v) => toggle('whatsapp', v)} />
            <ToggleRow title="Remind me by email" value={p.email} onChange={(v) => toggle('email', v)} />
            <ToggleRow title="One day before the class" value={p.dayBefore} onChange={(v) => toggle('dayBefore', v)} />
            <ToggleRow title="15 minutes before the class" value={p.min15} onChange={(v) => toggle('min15', v)} />
          </Card>
        ) : null}
      </Async>

      <SectionTitle>GST details for bills</SectionTitle>
      <Text style={styles.hint}>Add these to get your bills in your business name and claim GST credit.</Text>
      <Async loading={billing.loading} error={billing.error} onRetry={billing.reload}>
        <Card style={{ gap: 14 }}>
          <Field label="Business name" value={form.businessName} onChangeText={set('businessName')} error={errors.businessName} />
          <Field label="GST number (GSTIN)" value={form.gstin} onChangeText={(v) => set('gstin')(v.toUpperCase())} autoCapitalize="characters" maxLength={15} placeholder="07AABCS1234F1Z5" error={errors.gstin} />
          <Field label="Address" value={form.address} onChangeText={set('address')} multiline error={errors.address} />
          <Field label="State" value={form.state} onChangeText={set('state')} error={errors.state} />
          <Button label="Save GST details" icon="checkmark" busy={busy} onPress={saveBilling} />
        </Card>
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 15.5, lineHeight: 22, color: brand.muted, marginTop: -6 },
});
