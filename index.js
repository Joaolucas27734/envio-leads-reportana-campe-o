import { google } from "googleapis";
import axios from "axios";

// Configurações da planilha
const SPREADSHEET_ID = "1UD2_Q9oua4OCqYls-Is4zVKwTc9LjucLjPUgmVmyLBc";
const SHEET_NAME = "Campeão";

// Webhook da Reportana (variável de ambiente)
const WEBHOOK_URL = process.env.WEBHOOK_REPORTANA;

// JSON da Service Account (variável de ambiente)
const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

// Autenticação com Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function main() {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    // Lê todos os dados da aba Campeão
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME,
    });

    const rows = res.data.values || [];

    for (let i = 1; i < rows.length; i++) { // Começa da linha 2
      const row = rows[i];
      const nome = row[0];
      const email = row[1];
      const telefone = row[2];
      const statusG = row[6]; // Coluna G → “X”
      const statusI = row[8]; // Coluna I → “Enviado”

      // Se tiver X na coluna G e não estiver enviado
      if (statusG?.toUpperCase() === "X" && statusI !== "Enviado") {
        const lead = { nome, email, telefone };

        try {
          // Envia para o webhook
          await axios.post(WEBHOOK_URL, lead);
          console.log("Lead enviado:", lead);

          // Marca "Enviado" na coluna I
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!I${i + 1}`,
            valueInputOption: "RAW",
            requestBody: { values: [["Enviado"]] },
          });
        } catch (err) {
          console.log("Erro ao enviar lead:", err.message);
        }
      }
    }
    console.log("Processo concluído!");
  } catch (err) {
    console.error("Erro geral:", err.message);
  }
}

// Executa o script
main();
