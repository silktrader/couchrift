const flags: Record<string, string> = {
  // Major global film industries
  en: 'uk', // English → UK
  hi: 'in', // Hindi → India
  zh: 'cn', // Chinese → China
  es: 'es', // Spanish → Spain
  fr: 'fr', // French → France
  ar: 'sa', // Arabic → Saudi Arabia (neutral-ish pick)

  // Europe
  it: 'it', // Italian → Italy
  de: 'de', // German → Germany
  sv: 'se', // Swedish → Sweden
  no: 'no', // Norwegian → Norway
  da: 'dk', // Danish → Denmark
  fi: 'fi', // Finnish → Finland
  nl: 'nl', // Dutch → Netherlands
  pl: 'pl', // Polish → Poland
  cs: 'cz', // Czech → Czech Republic
  el: 'gr', // Greek → Greece
  hu: 'hu', // Hungarian → Hungary
  ro: 'ro', // Romanian → Romania
  tr: 'tr', // Turkish → Turkey
  uk: 'ua', // Ukrainian → Ukraine

  // East Asia
  ja: 'jp', // Japanese → Japan
  ko: 'kr', // Korean → South Korea
  th: 'th', // Thai → Thailand
  vi: 'vn', // Vietnamese → Vietnam

  // Others with notable cinema
  pt: 'pt', // Portuguese
  fa: 'ir', // Persian → Iran
  he: 'il', // Hebrew → Israel
  id: 'id' // Indonesian → Indonesia
}

export function getFlag(lang: string) {
  const flag = flags[lang]
  if (flag) return `https://hatscripts.github.io/circle-flags/flags/${flag}.svg`
  return `https://hatscripts.github.io/circle-flags/flags/other/checkered.svg`
}

const labels: Record<string, string> = {
  en: 'english',
  hi: 'hindi',
  zh: 'mandarin',
  es: 'spanish',
  fr: 'french',
  ar: 'arabic',

  it: 'italian',
  de: 'german',
  sv: 'swedish',
  no: 'norwegian',
  da: 'danish',
  fi: 'finnish',
  nl: 'dutch',
  pl: 'polish',
  cs: 'czech',
  el: 'greek',
  hu: 'hungarian',
  ro: 'romanian',
  tr: 'turkish',
  uk: 'ukrainian',

  ja: 'japanese',
  ko: 'korean',
  th: 'thai',
  vi: 'vietnamese',

  pt: 'portuguese',
  fa: 'farsi',
  he: 'hebrew',
  id: 'indonesian'
}

export function getLabel(lang: string) {
  return labels[lang] ?? 'unknown'
}