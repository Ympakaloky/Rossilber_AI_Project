import { randomUUID } from "node:crypto";
import {
  appendRequest,
  cell,
  filled,
  getSheetIds,
  getSheetsClient,
  type Cell,
  type Sheets,
} from "../lib/sheets";

interface ResultInput {
  id: number;
  indicator: string;
  norm: string;
  actual: string;
}

interface InspectionPayload {
  protocolNumber: string;
  protocolDate: string;
  batch: string;
  recipe: string;
  productionDate: string;
  results: ResultInput[];
  conclusion: string;
  executorPosition: string;
  executorName: string;
}

// Возвращает текст проблемы или null, если данные в порядке
function findProblem(d: Partial<InspectionPayload>): string | null {
  if (!filled(d.batch) || !filled(d.recipe)) {
    return "Не указана партия";
  }
  if (!filled(d.protocolNumber)) {
    return "Не указан номер протокола";
  }
  if (!filled(d.protocolDate)) {
    return "Не указана дата протокола";
  }
  if (!filled(d.productionDate)) {
    return "Не указана дата производства";
  }
  const results = d.results;
  if (!Array.isArray(results) || results.length === 0) {
    return "Нет данных по показателям";
  }
  if (!results.every((r) => Number.isInteger(r.id) && filled(r.indicator))) {
    return "Некорректный список показателей";
  }
  if (!results.every((r) => filled(r.actual))) {
    return "Укажите фактический результат по каждому показателю";
  }
  if (!filled(d.conclusion)) {
    return "Не указано заключение";
  }
  if (!filled(d.executorPosition) || !filled(d.executorName)) {
    return "Укажите исполнителя";
  }
  return null;
}

// Читает оба листа и собирает протоколы: главная строка + её показатели
async function listProtocols(
  sheets: Sheets,
  spreadsheetId: string,
  protocolsSheet: string,
  resultsSheet: string,
) {
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`'${protocolsSheet}'!A2:J`, `'${resultsSheet}'!A2:E`],
  });
  const [mainRange, resultsRange] = res.data.valueRanges ?? [];

  // Группируем строки показателей по protocol_id
  const resultsById = new Map<string, ResultInput[]>();
  for (const r of resultsRange?.values ?? []) {
    const id = cell(r, 0);
    if (id === "") continue;
    const list = resultsById.get(id) ?? [];
    list.push({
      id: Number(cell(r, 1)),
      indicator: cell(r, 2),
      norm: cell(r, 3),
      actual: cell(r, 4),
    });
    resultsById.set(id, list);
  }

  const protocols = (mainRange?.values ?? [])
    .filter((r) => cell(r, 0) !== "")
    .map((r) => ({
      protocolId: cell(r, 0),
      submittedAt: cell(r, 1),
      protocolNumber: cell(r, 2),
      protocolDate: cell(r, 3),
      batch: cell(r, 4),
      recipe: cell(r, 5),
      productionDate: cell(r, 6),
      conclusion: cell(r, 7),
      executorPosition: cell(r, 8),
      executorName: cell(r, 9),
      results: (resultsById.get(cell(r, 0)) ?? []).sort((a, b) => a.id - b.id),
    }));

  // Новые сверху (даты в формате ISO корректно сортируются как строки)
  protocols.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return protocols;
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== "GET" && req.method !== "POST") {
    return Response.json({ error: "Метод не поддерживается" }, { status: 405 });
  }

  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error("Не задана переменная SPREADSHEET_ID");
    }
    const batchesSheet = process.env.BATCHES_SHEET_NAME ?? "batches";
    const protocolsSheet =
      process.env.FINAL_INSPECTION_SHEET_NAME ?? "final_inspection";
    const resultsSheet =
      process.env.FINAL_INSPECTION_RESULTS_SHEET_NAME ??
      "final_inspection_results";

    const sheets = getSheetsClient();

    if (req.method === "GET") {
      return Response.json(
        await listProtocols(
          sheets,
          spreadsheetId,
          protocolsSheet,
          resultsSheet,
        ),
      );
    }

    const body = (await req.json()) as Partial<InspectionPayload>;
    const problem = findProblem(body);
    if (problem) {
      return Response.json({ error: problem }, { status: 400 });
    }
    // После проверки выше все поля гарантированно есть
    const data = body as InspectionPayload;

    // Партия должна существовать в таблице партий (столбцы A и B: рецепт, партия)
    const batchesRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${batchesSheet}'!A2:B`,
    });
    const exists = (batchesRes.data.values ?? []).some(
      (r) => cell(r, 0) === data.recipe && cell(r, 1) === data.batch,
    );
    if (!exists) {
      return Response.json(
        { error: "Такой партии нет в таблице партий" },
        { status: 400 },
      );
    }

    const protocolId = randomUUID();
    const submittedAt = new Date().toISOString();

    const mainRow: Cell[] = [
      protocolId,
      submittedAt,
      data.protocolNumber,
      data.protocolDate,
      data.batch,
      data.recipe,
      data.productionDate,
      data.conclusion,
      data.executorPosition,
      data.executorName,
    ];

    const resultRows: Cell[][] = data.results.map((r) => [
      protocolId,
      r.id,
      r.indicator,
      r.norm,
      r.actual,
    ]);

    const [protocolsId, resultsId] = await getSheetIds(sheets, spreadsheetId, [
      protocolsSheet,
      resultsSheet,
    ]);

    // Один запрос на оба листа: либо запишется всё, либо ничего
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          appendRequest(protocolsId, [mainRow]),
          appendRequest(resultsId, resultRows),
        ],
      },
    });

    return Response.json({
      success: true,
      protocolId,
      results: resultRows.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка";
    return Response.json({ error: message }, { status: 500 });
  }
};

export const config = { path: "/api/final-inspection" };
