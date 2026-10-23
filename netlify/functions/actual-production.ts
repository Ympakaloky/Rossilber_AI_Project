import { randomUUID } from "node:crypto";
import { google } from "googleapis";

interface OperationInput {
  id: number;
  operation: string;
  name: string;
  quantity: string;
  mass: string;
  fact: string;
  preparedBy: string;
  unpackedBy: string;
  note: string;
  moistureCheckDate: string;
  moistureBatch: string;
  moistureNorm: string;
  moistureResult: string;
}

interface ActualProductionPayload {
  batch: string;
  recipe: string;
  productionDate: string;
  operations: OperationInput[];
  dosing: { startTime: string; endTime: string; fullName: string };
}

type Cell = string | number | null | undefined;

function getSheetsClient() {
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

type Sheets = ReturnType<typeof getSheetsClient>;

const filled = (v: unknown): boolean =>
  typeof v === "string" && v.trim() !== "";

// Сколько из четырёх полей замера влажности заполнено
function moistureCount(op: OperationInput): number {
  return [
    op.moistureCheckDate,
    op.moistureBatch,
    op.moistureNorm,
    op.moistureResult,
  ].filter(filled).length;
}

// Возвращает текст проблемы или null, если данные в порядке
function findProblem(d: Partial<ActualProductionPayload>): string | null {
  if (!filled(d.batch) || !filled(d.recipe)) {
    return "Не указана партия";
  }
  if (!filled(d.productionDate)) {
    return "Не указана дата производства";
  }
  const ops = d.operations;
  if (!Array.isArray(ops) || ops.length === 0) {
    return "Нет данных по операциям";
  }
  if (!ops.every((op) => Number.isInteger(op.id))) {
    return "Некорректный номер операции";
  }
  const opsFilled = ops.every(
    (op) => filled(op.fact) && filled(op.preparedBy) && filled(op.unpackedBy),
  );
  if (!opsFilled) {
    return "В каждой операции заполните «Факт», «Подготовил» и «Растарил»";
  }
  const partial = ops.some((op) => {
    const count = moistureCount(op);
    return count > 0 && count < 4;
  });
  if (partial) {
    return "Замер влажности заполняется целиком или не заполняется вовсе";
  }
  const dos = d.dosing;
  if (
    !filled(dos?.startTime) ||
    !filled(dos?.endTime) ||
    !filled(dos?.fullName)
  ) {
    return "Заполните блок «Дозировка»";
  }
  return null;
}

// Пустое значение становится по-настоящему пустой ячейкой
function toCellData(v: Cell) {
  if (typeof v === "number") {
    return { userEnteredValue: { numberValue: v } };
  }
  const s = (v ?? "").trim();
  return s === "" ? {} : { userEnteredValue: { stringValue: s } };
}

function appendRequest(sheetId: number, rows: Cell[][]) {
  return {
    appendCells: {
      sheetId,
      rows: rows.map((r) => ({ values: r.map(toCellData) })),
      fields: "userEnteredValue",
    },
  };
}

// Для записи нужны числовые id листов, а не их названия
async function getSheetIds(
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

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return Response.json({ error: "Метод не поддерживается" }, { status: 405 });
  }

  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error("Не задана переменная SPREADSHEET_ID");
    }
    const batchesSheet = process.env.BATCHES_SHEET_NAME ?? "batches";
    const productionSheet =
      process.env.ACTUAL_PRODUCTION_SHEET_NAME ?? "actual_production";
    const componentsSheet =
      process.env.ACTUAL_PRODUCTION_COMPONENTS_SHEET_NAME ??
      "actual_production_components";

    const body = (await req.json()) as Partial<ActualProductionPayload>;
    const problem = findProblem(body);
    if (problem) {
      return Response.json({ error: problem }, { status: 400 });
    }
    // После проверки выше все поля гарантированно есть
    const data = body as ActualProductionPayload;

    const sheets = getSheetsClient();

    // Партия должна существовать в таблице партий (столбцы A и B: рецепт, партия)
    const batchesRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${batchesSheet}'!A2:B`,
    });
    const exists = (batchesRes.data.values ?? []).some(
      (r) => (r[0] ?? "") === data.recipe && (r[1] ?? "") === data.batch,
    );
    if (!exists) {
      return Response.json(
        { error: "Такой партии нет в таблице партий" },
        { status: 400 },
      );
    }

    const submissionId = randomUUID();
    const submittedAt = new Date().toISOString();

    const mainRow: Cell[] = [
      submissionId,
      submittedAt,
      data.batch,
      data.recipe,
      data.productionDate,
      data.dosing.startTime,
      data.dosing.endTime,
      data.dosing.fullName,
    ];

    const componentRows: Cell[][] = data.operations.map((op) => [
      submissionId,
      op.id,
      op.operation,
      op.name,
      op.quantity,
      op.mass,
      op.fact,
      op.preparedBy,
      op.unpackedBy,
      op.note,
      op.moistureCheckDate,
      op.moistureBatch,
      op.moistureNorm,
      op.moistureResult,
    ]);

    const [productionId, componentsId] = await getSheetIds(
      sheets,
      spreadsheetId,
      [productionSheet, componentsSheet],
    );

    // Один запрос на оба листа: либо запишется всё, либо ничего
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          appendRequest(productionId, [mainRow]),
          appendRequest(componentsId, componentRows),
        ],
      },
    });

    return Response.json({
      success: true,
      submissionId,
      components: componentRows.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка";
    return Response.json({ error: message }, { status: 500 });
  }
};

export const config = { path: "/api/actual-production" };
