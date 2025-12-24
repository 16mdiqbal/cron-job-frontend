export type CsvTable = {
  headers: string[];
  rows: string[][];
};

export type CsvNormalizationStats = {
  originalColumnCount: number;
  originalRowCount: number;
  removedColumnCount: number;
  removedEmptyRowCount: number;
};

export type NormalizeCsvResult = {
  table: CsvTable;
  stats: CsvNormalizationStats;
};

export function parseCsvText(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = '';
  };

  const pushRow = () => {
    pushCell();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];

    if (inQuotes) {
      if (char === '"') {
        const next = csvText[i + 1];
        if (next === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      pushCell();
      continue;
    }

    if (char === '\r') continue;
    if (char === '\n') {
      pushRow();
      continue;
    }

    cell += char;
  }

  if (inQuotes) throw new Error('Invalid CSV: unclosed quote.');

  if (cell.length > 0 || row.length > 0) {
    pushRow();
  }

  return rows;
}

export function normalizeCsvRows(rows: string[][]): NormalizeCsvResult {
  if (rows.length === 0) throw new Error('CSV is empty.');

  const rawHeaders = rows[0] ?? [];
  const headerNames = rawHeaders.map((h) => (h ?? '').trim());

  const keepIndexes = headerNames
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => header.length > 0)
    .map(({ index }) => index);

  const keptHeaders = keepIndexes.map((i) => headerNames[i] ?? '');

  if (keptHeaders.length === 0) {
    throw new Error('CSV header row has no usable column names.');
  }

  const dataRows = rows.slice(1);
  let removedEmptyRowCount = 0;

  const normalizedRows: string[][] = [];
  for (const rawRow of dataRows) {
    const paddedRow =
      rawRow.length >= rawHeaders.length
        ? rawRow
        : [...rawRow, ...Array(rawHeaders.length - rawRow.length).fill('')];

    const keptRow = keepIndexes.map((i) => (paddedRow[i] ?? '').toString());

    const isEmpty = keptRow.every((value) => value.trim().length === 0);
    if (isEmpty) {
      removedEmptyRowCount++;
      continue;
    }

    normalizedRows.push(keptRow);
  }

  return {
    table: { headers: keptHeaders, rows: normalizedRows },
    stats: {
      originalColumnCount: rawHeaders.length,
      originalRowCount: dataRows.length,
      removedColumnCount: rawHeaders.length - keptHeaders.length,
      removedEmptyRowCount,
    },
  };
}

function csvEscapeCell(value: string): string {
  const needsQuoting =
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r') ||
    /^\s|\s$/.test(value);
  if (!needsQuoting) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

export function stringifyCsv(table: CsvTable): string {
  const headerLine = table.headers.map(csvEscapeCell).join(',');
  const rowLines = table.rows.map((row) => row.map((c) => csvEscapeCell(c ?? '')).join(','));
  return [headerLine, ...rowLines].join('\r\n') + '\r\n';
}
