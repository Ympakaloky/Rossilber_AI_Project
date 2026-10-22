import { google } from "googleapis";

interface BatchPayload {
  recipe: string;
  batch: string;
  productionSite: string;
  materialWeight: string;
  releaseDate: string;
  issuedBy: string;
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
        requestBody: {
          values: [
            [
              data.recipe,
              data.batch,
              data.productionSite,
              data.materialWeight,
              data.releaseDate,
              data.issuedBy,
            ],
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
