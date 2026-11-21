const IST = 'Asia/Kolkata';

/** "Sat, 21 Nov · 7:00 pm", always in Indian time. */
export function dateTime(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: IST });
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: IST }).toLowerCase();
  return `${day} · ${time}`;
}

export function day(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: IST });
}

/** Rupees in the Indian grouping, e.g. ₹1,50,000. */
export function rupees(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function minutes(sec: number): string {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
}

/** The class room opens 10 minutes before the start and stays open until the end. */
export function canJoinNow(startsAt: string, endsAt: string, now = Date.now()): boolean {
  return now >= new Date(startsAt).getTime() - 10 * 60_000 && now < new Date(endsAt).getTime();
}
