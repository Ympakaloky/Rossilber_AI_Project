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

// Перезаписывает одну строку, начиная с указанного столбца (нумерация с нуля).
// Пустое значение очищает ячейку.
function updateRequest(
  sheetId: number,
  rowIndex: number,
  columnIndex: number,
  values: Cell[],
) {
  return {
    updateCells: {
      start: { sheetId, rowIndex, columnIndex },
      rows: [{ values: values.map(toCellData) }],
      fields: "userEnteredValue",
    },
  };
}

// Склеивает соседние номера строк в диапазоны: [3, 4, 5, 9] -> 3..6 и 9..10
function toRanges(indices: number[]): { start: number; end: number }[] {
  const sorted = [...indices].sort((a, b) => a - b);
  const ranges: { start: number; end: number }[] = [];
  for (const i of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && i === last.end) {
      last.end = i + 1;
    } else {
      ranges.push({ start: i, end: i + 1 });
    }
  }
  return ranges;
}

// Удалять нужно снизу вверх: после удаления строки все нижние сдвигаются вверх,
// и номера верхних остаются верными, только если их удалять первыми
function deleteRequests(sheetId: number, indices: number[]) {
  return toRanges(indices)
    .reverse()
    .map((r) => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: r.start,
          endIndex: r.end,
        },
      },
    }));
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

// Значение ячейки как строка (пустые ячейки в конце строки Google не присылает)
const cell = (row: unknown[], index: number): string =>
  String(row[index] ?? "");

// Читает оба листа и собирает отправки: главная строка + её операции
async function listSubmissions(
  sheets: Sheets,
  spreadsheetId: string,
  productionSheet: string,
  componentsSheet: string,
) {
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`'${productionSheet}'!A2:H`, `'${componentsSheet}'!A2:N`],
  });
  const [mainRange, componentsRange] = res.data.valueRanges ?? [];
  const mainRows = mainRange?.values ?? [];
  const componentRows = componentsRange?.values ?? [];

  // Группируем строки компонентов по submission_id
  const operationsById = new Map<string, OperationInput[]>();
  for (const r of componentRows) {
    const id = cell(r, 0);
    if (id === "") continue;
    const list = operationsById.get(id) ?? [];
    list.push({
      id: Number(cell(r, 1)),
      operation: cell(r, 2),
      name: cell(r, 3),
      quantity: cell(r, 4),
      mass: cell(r, 5),
      fact: cell(r, 6),
      preparedBy: cell(r, 7),
      unpackedBy: cell(r, 8),
      note: cell(r, 9),
      moistureCheckDate: cell(r, 10),
      moistureBatch: cell(r, 11),
      moistureNorm: cell(r, 12),
      moistureResult: cell(r, 13),
    });
    operationsById.set(id, list);
  }

  const submissions = mainRows
    .filter((r) => cell(r, 0) !== "")
    .map((r) => ({
      submissionId: cell(r, 0),
      submittedAt: cell(r, 1),
      batch: cell(r, 2),
      recipe: cell(r, 3),
      productionDate: cell(r, 4),
      dosing: {
        startTime: cell(r, 5),
        endTime: cell(r, 6),
        fullName: cell(r, 7),
      },
      operations: (operationsById.get(cell(r, 0)) ?? []).sort(
        (a, b) => a.id - b.id,
      ),
    }));

  // Новые сверху (даты в формате ISO корректно сортируются как строки)
  submissions.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return submissions;
}

// Находит строки отправки по submission_id. Индексы нулевые, как в API:
// строка 1 таблицы (заголовки) имеет индекс 0, поэтому её пропускаем.
async function locateSubmission(
  sheets: Sheets,
  spreadsheetId: string,
  productionSheet: string,
  componentsSheet: string,
  submissionId: string,
) {
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`'${productionSheet}'!A:A`, `'${componentsSheet}'!A:B`],
  });
  const [mainRange, componentsRange] = res.data.valueRanges ?? [];

  const mainIndex = (mainRange?.values ?? []).findIndex(
    (r, i) => i > 0 && cell(r, 0) === submissionId,
  );

  const components: { line: number; index: number }[] = [];
  (componentsRange?.values ?? []).forEach((r, index) => {
    if (index > 0 && cell(r, 0) === submissionId) {
      components.push({ line: Number(cell(r, 1)), index });
    }
  });

  return { mainIndex: mainIndex === -1 ? null : mainIndex, components };
}

export default async (req: Request): Promise<Response> => {
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

    const sheets = getSheetsClient();

    if (req.method === "GET") {
      const submissions = await listSubmissions(
        sheets,
        spreadsheetId,
        productionSheet,
        componentsSheet,
      );
      return Response.json(submissions);
    }

    if (req.method === "POST") {
      const body = (await req.json()) as Partial<ActualProductionPayload>;
      const problem = findProblem(body);
      if (problem) {
        return Response.json({ error: problem }, { status: 400 });
      }
      // После проверки выше все поля гарантированно есть
      const data = body as ActualProductionPayload;

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
    }

    if (req.method === "PUT") {
      const body = (await req.json()) as Partial<ActualProductionPayload> & {
        submissionId?: unknown;
      };
      const submissionId = body.submissionId;
      if (typeof submissionId !== "string" || submissionId.trim() === "") {
        return Response.json(
          { error: "Не указан номер записи" },
          { status: 400 },
        );
      }
      const problem = findProblem(body);
      if (problem) {
        return Response.json({ error: problem }, { status: 400 });
      }
      const data = body as ActualProductionPayload;

      const found = await locateSubmission(
        sheets,
        spreadsheetId,
        productionSheet,
        componentsSheet,
        submissionId,
      );
      if (found.mainIndex === null) {
        return Response.json(
          { error: "Запись не найдена. Обновите страницу." },
          { status: 404 },
        );
      }

      // Строка каждой операции ищется по номеру операции внутри этой отправки
      const rowByLine = new Map<number, number>(
        found.components.map((c) => [c.line, c.index] as const),
      );
      if (!data.operations.every((op) => rowByLine.has(op.id))) {
        return Response.json(
          { error: "Состав записи изменился. Обновите страницу и повторите." },
          { status: 409 },
        );
      }

      const [productionId, componentsId] = await getSheetIds(
        sheets,
        spreadsheetId,
        [productionSheet, componentsSheet],
      );

      // Главная строка: столбцы E..H (дата производства и дозировка).
      // Строки операций: столбцы G..N (факт и замер влажности).
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            updateRequest(productionId, found.mainIndex, 4, [
              data.productionDate,
              data.dosing.startTime,
              data.dosing.endTime,
              data.dosing.fullName,
            ]),
            ...data.operations.map((op) =>
              updateRequest(componentsId, rowByLine.get(op.id) as number, 6, [
                op.fact,
                op.preparedBy,
                op.unpackedBy,
                op.note,
                op.moistureCheckDate,
                op.moistureBatch,
                op.moistureNorm,
                op.moistureResult,
              ]),
            ),
          ],
        },
      });

      return Response.json({ success: true });
    }

    if (req.method === "DELETE") {
      const body = (await req.json()) as { submissionId?: unknown };
      const submissionId = body.submissionId;
      if (typeof submissionId !== "string" || submissionId.trim() === "") {
        return Response.json(
          { error: "Не указан номер записи" },
          { status: 400 },
        );
      }

      const found = await locateSubmission(
        sheets,
        spreadsheetId,
        productionSheet,
        componentsSheet,
        submissionId,
      );
      if (found.mainIndex === null && found.components.length === 0) {
        return Response.json(
          { error: "Запись не найдена. Обновите страницу." },
          { status: 404 },
        );
      }

      const [productionId, componentsId] = await getSheetIds(
        sheets,
        spreadsheetId,
        [productionSheet, componentsSheet],
      );

      // Обе таблицы чистятся одним запросом: либо удалится всё, либо ничего
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            ...deleteRequests(
              productionId,
              found.mainIndex === null ? [] : [found.mainIndex],
            ),
            ...deleteRequests(
              componentsId,
              found.components.map((c) => c.index),
            ),
          ],
        },
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: "Метод не поддерживается" }, { status: 405 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка";
    return Response.json({ error: message }, { status: 500 });
  }
};

export const config = { path: "/api/actual-production" };
