const { google } = require('googleapis');

// Авторизация через service account (данные берутся из переменных окружения Netlify)
async function getSheetsClient() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

exports.handler = async (event) => {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = process.env.SHEET_NAME || 'Sheet1';

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (!spreadsheetId) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Переменная окружения SPREADSHEET_ID не задана' })
    };
  }

  try {
    const sheets = await getSheetsClient();

    // ЧТЕНИЕ всех строк (ожидается заголовок в строке 1, данные с A2)
    if (event.httpMethod === 'GET') {
      const range = `${sheetName}!A2:C`;
      const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
      const values = res.data.values || [];
      const rows = values.map((row, i) => ({
        row: i + 2, // номер строки в самой таблице (для update/delete)
        party: row[0] || '',
        product: row[1] || '',
        quantity: row[2] || ''
      }));
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(rows) };
    }

    // ДОБАВЛЕНИЕ новой строки
    if (event.httpMethod === 'POST') {
      const { party, product, quantity } = JSON.parse(event.body || '{}');
      if (!party || !product || quantity === undefined) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'party, product и quantity обязательны' }) };
      }
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:C`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [[party, product, quantity]] }
      });
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true }) };
    }

    // РЕДАКТИРОВАНИЕ существующей строки
    if (event.httpMethod === 'PUT') {
      const { row, party, product, quantity } = JSON.parse(event.body || '{}');
      if (!row) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'row обязателен' }) };
      }
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${row}:C${row}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[party, product, quantity]] }
      });
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true }) };
    }

    // УДАЛЕНИЕ строки
    if (event.httpMethod === 'DELETE') {
      const row = parseInt((event.queryStringParameters || {}).row, 10);
      if (!row) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'параметр row обязателен' }) };
      }
      // Нужен числовой sheetId листа (не совпадает с названием)
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheet = meta.data.sheets.find(s => s.properties.title === sheetName);
      if (!sheet) {
        return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: `Лист "${sheetName}" не найден` }) };
      }
      const sheetId = sheet.properties.sheetId;
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: row - 1,
                endIndex: row
              }
            }
          }]
        }
      });
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Метод не поддерживается' }) };
  } catch (err) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};
