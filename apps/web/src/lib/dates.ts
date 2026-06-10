const locale = Intl.DateTimeFormat().resolvedOptions().locale
const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

// Format: 2 minutes ago

// @formatter:off
const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60,         unit: 'seconds' },
  { amount: 60,         unit: 'minutes' },
  { amount: 24,         unit: 'hours'   },
  { amount: 7,          unit: 'days'    },
  { amount: 4.34524,    unit: 'weeks'   },
  { amount: 12,         unit: 'months'  },
  { amount: Infinity,   unit: 'years'   },
];
// @formatter:on

export function formatRelativeTime(timestamp: number): string {
  let duration = (timestamp - Date.now()) / 1000 // seconds

  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(duration) < amount)
      return rtf.format(Math.round(duration), unit)
    duration /= amount
  }

  // Unreachable, but satisfies TypeScript
  return rtf.format(Math.round(duration), 'years')
}

export function formatDistanceBetweenDates(start: Date, end: Date): string {
  let duration = (end.getTime() - start.getTime()) / 1000

  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(duration) < amount)
      return `${Math.round(duration)} ${unit}`
    duration /= amount
  }

  // Unreachable, but satisfies TypeScript
  return `${Math.round(duration)} years`
}

// Time duration, as 1h 23m
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes - (hours * 60)
  return `${hours}h ${remainingMinutes}m`
}

// Format timestamps as absolute dates of the kind: August 10, 2026
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-UK', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
    year:    'numeric'
  }).format(date)
}

export function formatTime(date: Date): string {
  return `${
    String(date.getHours()).padStart(2, '0')
  }:${String(date.getMinutes()).padStart(2, '0')}`
}