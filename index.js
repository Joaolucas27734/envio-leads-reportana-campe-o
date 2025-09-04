import { google } from "googleapis";
import axios from "axios";

// CONFIGURAÇÕES
const SPREADSHEET_ID = "1UD2_Q9oua4OCqYls-Is4zVKwTc9LjucLjPUgmVmyLBc"; // ID da planilha
const SHEET_NAME = "Campeão"; // nome da aba
const WEBHOOK_URL = "https://app.reportana.com/webhooks/workflows/138790?token=EL4ug83uNxmvTxiGDahMWQ6QJaAdmRnM"; // webhook da Reportana

// Credenciais da Google API
const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function main() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // Ler toda a aba "Campeão"
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_NAME,
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log("Nenhum lead encontrado.");
    return;
  }

  for (let i = 1; i < rows.length; i++) { // começa da linha 2
    const row = rows[i];
    const nome = row[0];      // coluna A
    const email = row[1];     // coluna B
    const telefone = row[2];  // coluna C
    const statusG = row[6];   // coluna G
    const statusH = row[7];   // coluna H

    // Verifica se tem "X" e ainda não foi enviado
    if (statusG?.toUpperCase() === "X" && statusH !== "Enviado") {
      const lead = { nome, email, telefone };

      try {
        // Envia para a Reportana
        await axios.post(WEBHOOK_URL, lead);
        console.log("Lead enviado:", lead);

        // Marca "Enviado" na coluna H
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!H${i + 1}`,
          valueInputOption: "RAW",
          requestBody: {
            values: [["Enviado"]],
          },
        });
      } catch (err) {
        console.log("Erro ao enviar lead:", err.message);
      }
    }
  }
}

main();
