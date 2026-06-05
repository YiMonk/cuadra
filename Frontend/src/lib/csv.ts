/**
 * Parser CSV minimalista que soporta:
 *  - separador `,` o `;` (auto-detección si no se especifica)
 *  - valores entre comillas dobles con escape `""`
 *  - saltos de línea CRLF/LF
 *
 * NO sustituye a PapaParse — diseñado para importar archivos simples generados
 * desde Excel/Google Sheets. Si el archivo viene de un editor complejo y rompe,
 * mejor migrar a PapaParse en el futuro.
 */
export function parseCsv(text: string, options: { separator?: string } = {}): string[][] {
  const rows: string[][] = [];
  if (!text) return rows;
  const sep = options.separator ?? detectSeparator(text);

  let i = 0;
  let cur = '';
  let row: string[] = [];
  let inQuotes = false;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === sep) {
      row.push(cur);
      cur = '';
      i++;
      continue;
    }
    if (ch === '\r') {
      i++;
      continue;
    }
    if (ch === '\n') {
      row.push(cur);
      if (row.some(c => c.length > 0)) rows.push(row);
      row = [];
      cur = '';
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  // last cell
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    if (row.some(c => c.length > 0)) rows.push(row);
  }
  return rows;
}

function detectSeparator(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] ?? '';
  const semis = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semis > commas ? ';' : ',';
}
