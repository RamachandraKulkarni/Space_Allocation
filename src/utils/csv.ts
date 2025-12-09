import Papa from 'papaparse';

export function parseCsv<T = Record<string, string | number>>(csvText: string): T[] {
  const { data } = Papa.parse<T>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  return data.filter(Boolean);
}
