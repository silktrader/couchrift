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