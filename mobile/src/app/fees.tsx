import { StyleSheet, Text, View } from 'react-native';

import { Async, Bar, Card, Empty, Pill, Screen, SectionTitle } from '@/components/ui';
import { brand } from '@/lib/brand';
import { day, rupees } from '@/lib/format';
import type { PaymentSummary } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const TONE = { paid: 'good', due: 'warn', overdue: 'bad', upcoming: 'neutral' } as const;
const LABEL = { paid: 'Paid', due: 'Due soon', overdue: 'Overdue', upcoming: 'Later' } as const;

export default function Fees() {
  const { data, error, loading, reload } = useApi<PaymentSummary>('/my/payments');
  const next = data?.installments.find((i) => i.status === 'due' || i.status === 'overdue');

  return (
    <Screen title="Fees" subtitle={data ? `Amounts are shown without ${data.gstPct}% GST` : undefined} back onRefresh={reload}>
      <Async loading={loading} error={error} onRetry={reload}>
        {data && data.total > 0 ? (
          <Card dark style={{ gap: 10 }}>
            <Text style={styles.darkLabel}>Paid so far</Text>
            <Text style={styles.darkBig}>
              {rupees(data.paid)} <Text style={styles.darkOf}>of {rupees(data.total)}</Text>
            </Text>
            <Bar pct={(data.paid / data.total) * 100} tone="light" />
            {next ? (
              <Text style={styles.darkLabel}>
                Next: {rupees(next.amount)} {next.status === 'overdue' ? 'was due' : 'due'} on {day(next.dueDate)}
              </Text>
            ) : (
              <Text style={styles.darkLabel}>Nothing is due right now.</Text>
            )}
          </Card>
        ) : (
          <Empty icon="wallet-outline" title="No fee plan yet" />
        )}

        {data?.installments.length ? <SectionTitle>Payments</SectionTitle> : null}
        {data?.installments.map((i) => (
          <Card key={i.id}>
            <View style={styles.row}>
              <Text style={styles.label}>{i.label}</Text>
              <Text style={styles.amount}>{rupees(i.amount)}</Text>
            </View>
            <View style={styles.row}>
              <Pill label={LABEL[i.status]} tone={TONE[i.status]} />
              <Text style={styles.meta}>{i.status === 'paid' && i.paidAt ? `Paid ${day(i.paidAt)}` : `Due ${day(i.dueDate)}`}</Text>
            </View>
          </Card>
        ))}
        {data?.installments.length ? <Text style={styles.meta}>To pay an instalment, please contact the Redbean team. Online payment is coming soon.</Text> : null}
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  darkLabel: { fontSize: 15.5, color: 'rgba(255,255,255,0.75)' },
  darkBig: { fontSize: 32, fontWeight: '800', color: '#fff' },
  darkOf: { fontSize: 17, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  meta: { fontSize: 15, color: brand.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  label: { fontSize: 18, fontWeight: '800', color: brand.ink },
  amount: { fontSize: 18, fontWeight: '800', color: brand.ink },
});
