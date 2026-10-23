import { google } from "googleapis";

interface BatchPayload {
  recipe: string;
  batch: string;
  productionSite: string;
  materialWeight: string;
  releaseDate: string;
  issuedBy: string;
}

interface RowIdentity {
  row: number;
  original: { recipe: string; batch: string };
}

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

function toRowValues(data: BatchPayload) {
  return [
    data.recipe,
    data.batch,
    data.productionSite,
    data.materialWeight,
    data.releaseDate,
    data.issuedBy,
  ];
}

function isValidIdentity(data: Partial<RowIdentity>): data is RowIdentity {
  return (
    Number.isInteger(data.row) &&
    (data.row as number) >= 2 &&
    typeof data.original?.recipe === "string" &&
    typeof data.original?.batch === "string"
  );
}

// Читает строку из таблицы и сверяет рецепт и партию с ожидаемыми
async function rowMatches(
  sheets: Sheets,
  spreadsheetId: string,
  sheetName: string,
  identity: RowIdentity,
): Promise<boolean> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!A${identity.row}:B${identity.row}`,
  });
  const current = (res.data.values ?? [])[0] ?? [];
  return (
    (current[0] ?? "") === identity.original.recipe &&
    (current[1] ?? "") === identity.original.batch
  );
}

// Для удаления строки Google требует числовой id листа, а не его название
async function getSheetId(
  sheets: Sheets,
  spreadsheetId: string,
  sheetName: string,
): Promise<number> {
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties(sheetId,title)",
  });
  const sheet = res.data.sheets?.find((s) => s.properties?.title === sheetName);
  const id = sheet?.properties?.sheetId;
  if (id === undefined || id === null) {
    throw new Error(`Лист «${sheetName}» не найден`);
  }
  return id;
}

const conflict = () =>
  Response.json(
    { error: "Таблица изменилась. Обновите страницу и повторите действие." },
    { status: 409 },
  );

export default async (req: Request): Promise<Response> => {
  try {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = process.env.BATCHES_SHEET_NAME ?? "batches";
    if (!spreadsheetId) {
      throw new Error("Не задана переменная SPREADSHEET_ID");
    }
    const sheets = getSheetsClient();

    if (req.method === "GET") {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!A2:F`,
      });
      const values = res.data.values ?? [];
      const batches = values.map((r, i) => ({
        row: i + 2,
        recipe: r[0] ?? "",
        batch: r[1] ?? "",
        productionSite: r[2] ?? "",
        materialWeight: r[3] ?? "",
        releaseDate: r[4] ?? "",
        issuedBy: r[5] ?? "",
      }));
      return Response.json(batches);
    }

    if (req.method === "POST") {
      const data = (await req.json()) as BatchPayload;

      if (!data.recipe || !data.batch) {
        return Response.json(
          { error: "Поля «Рецепт» и «Партия» обязательны" },
          { status: 400 },
        );
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${sheetName}'!A:F`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [toRowValues(data)] },
      });
      return Response.json({ success: true });
    }

    if (req.method === "PUT") {
      const data = (await req.json()) as BatchPayload & Partial<RowIdentity>;

      if (!isValidIdentity(data)) {
        return Response.json(
          { error: "Некорректные данные строки" },
          { status: 400 },
        );
      }
      if (!data.recipe || !data.batch) {
        return Response.json(
          { error: "Поля «Рецепт» и «Партия» обязательны" },
          { status: 400 },
        );
      }
      if (!(await rowMatches(sheets, spreadsheetId, sheetName, data))) {
        return conflict();
      }

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A${data.row}:F${data.row}`,
        valueInputOption: "RAW",
        requestBody: { values: [toRowValues(data)] },
      });
      return Response.json({ success: true });
    }

    if (req.method === "DELETE") {
      const data = (await req.json()) as Partial<RowIdentity>;

      if (!isValidIdentity(data)) {
        return Response.json(
          { error: "Некорректные данные строки" },
          { status: 400 },
        );
      }
      if (!(await rowMatches(sheets, spreadsheetId, sheetName, data))) {
        return conflict();
      }

      const sheetId = await getSheetId(sheets, spreadsheetId, sheetName);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: data.row - 1,
                  endIndex: data.row,
                },
              },
            },
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

export const config = { path: "/api/batches" };
