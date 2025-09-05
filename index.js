const { google } = require('googleapis');
const axios = require('axios');

const WEBHOOK_URL = "https://app.reportana.com/webhooks/workflows/138790?token=EL4ug83uNxmvTxiGDahMWQ6QJaAdmRnM";
const SPREADSHEET_ID = "1UD2_Q9oua4OCqYls-Is4zVKwTc9LjucLjPUgmVmyLBc";
const SHEET_NAME = "Campeão";

// Pega a Service Account do Render
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

async function main() {
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });

  // Pega os dados da aba
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:I` // Ajuste se precisar
  });

  const rows = res.data.values;

  if (!rows || rows.length === 0) return console.log("Nenhum lead encontrado.");

  for (let i = 1; i < rows.length; i++) { // ignora o header
    const row = rows[i];
    const toSend = row[7]; // Coluna H (marcada com "X")
    const sent = row[8]; // Coluna I ("Enviado")

    if (toSend === "X" && sent !== "Enviado") {
      const lead = {
        nome: row[0],
        email: row[1],
        telefone: row[2]
      };

      try {
        await axios.post(WEBHOOK_URL, lead);
        console.log(`Lead enviado: ${lead.email}`);

        // Marca como enviado
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!I${i+1}`,
          valueInputOption: "RAW",
          requestBody: { values: [["Enviado"]] }
        });
      } catch (err) {
        console.error(`Erro ao enviar lead ${lead.email}:`, err.message);
      }
    }
  }
}

main().catch(console.error);
