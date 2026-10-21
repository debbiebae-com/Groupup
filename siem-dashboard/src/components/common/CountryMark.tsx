const COUNTRY_CODES: Record<string, string> = {
  Netherlands: 'NL',
  Russia: 'RU',
  China: 'CN',
  'United States': 'US',
  Nigeria: 'NG',
  Brazil: 'BR',
  Germany: 'DE',
  Iran: 'IR',
  India: 'IN',
  Romania: 'RO',
  Ghana: 'GH',
  'United Kingdom': 'GB',
  Vietnam: 'VN',
  Singapore: 'SG',
};

const PALETTE = ['#38bdf8', '#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#fb923c', '#22d3ee', '#f87171'];

function hash(value: string): number {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) total = (total * 31 + value.charCodeAt(index)) % 997;
  return total;
}

export function CountryMark({ country, className }: { country: string; className?: string }) {
  const code = COUNTRY_CODES[country] ?? country.slice(0, 2).toUpperCase();
  const color = PALETTE[hash(code) % PALETTE.length];
  return (
    <span
      className={`inline-flex h-[16px] w-[24px] shrink-0 items-center justify-center rounded-[3px] border font-mono text-[8px] font-semibold tracking-tight ${className ?? ''}`}
      style={{ borderColor: `${color}55`, backgroundColor: `${color}18`, color }}
      title={country}
      aria-label={country}
    >
      {code}
    </span>
  );
}
