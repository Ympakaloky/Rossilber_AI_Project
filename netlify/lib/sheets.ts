import { google } from "googleapis";

export type Cell = string | number | null | undefined;

export function getSheetsClient() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64;
  if (!b64) {
    throw new Error("Не задана переменная GOOGLE_SERVICE_ACCOUNT_KEY_B64");
  }
  const key = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export type Sheets = ReturnType<typeof getSheetsClient>;

export const filled = (v: unknown): boolean =>
  typeof v === "string" && v.trim() !== "";

// Значение ячейки как строка (пустые ячейки в конце строки Google не присылает)
export const cell = (row: unknown[], index: number): string =>
  String(row[index] ?? "");

// Пустое значение становится по-настоящему пустой ячейкой
export function toCellData(v: Cell) {
  if (typeof v === "number") {
    return { userEnteredValue: { numberValue: v } };
  }
  const s = (v ?? "").trim();
  return s === "" ? {} : { userEnteredValue: { stringValue: s } };
}

export function appendRequest(sheetId: number, rows: Cell[][]) {
  return {
    appendCells: {
      sheetId,
      rows: rows.map((r) => ({ values: r.map(toCellData) })),
      fields: "userEnteredValue",
    },
  };
}

// Для записи нужны числовые id листов, а не их названия
export async function getSheetIds(
  sheets: Sheets,
  spreadsheetId: string,
  names: string[],
): Promise<number[]> {
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties(sheetId,title)",
  });
  const byTitle = new Map<string, number>();
  for (const s of res.data.sheets ?? []) {
    const title = s.properties?.title;
    const id = s.properties?.sheetId;
    if (title && id !== undefined && id !== null) {
      byTitle.set(title, id);
    }
  }
  return names.map((n) => {
    const id = byTitle.get(n);
    if (id === undefined) {
      throw new Error(`Лист «${n}» не найден`);
    }
    return id;
  });
}
