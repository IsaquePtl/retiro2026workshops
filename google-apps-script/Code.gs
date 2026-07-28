const VOTES_SHEET_NAME = "Votos";
const QUESTIONS_SHEET_NAME = "Perguntas";
const RESUMO_SHEET_NAME = "Resumo";
const SPREADSHEET_ID = "1Gxpkzq0DObNjlLSGEtyZ22aBHrhDPn3uvwmnn8__NrE";

const COLORS = {
  background: "#0f172a",
  surface: "#1e293b",
  header: "#334155",
  text: "#f8fafc",
  muted: "#cbd5e1",
  accent: "#fbbf24",
  accentSoft: "#422006",
  success: "#34d399",
};

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    validateSecret_(body.secret);
    ensureDataSheets_();

    if (body.action === "vote") {
      return handleVote_(body);
    }

    if (body.action === "question") {
      return handleQuestion_(body);
    }

    if (body.action === "results") {
      return jsonResponse_({
        ok: true,
        updatedAt: new Date().toISOString(),
        ...getResultsPayload_(),
      });
    }

    return jsonResponse_({
      ok: false,
      error: "Acao invalida.",
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: error && error.message ? error.message : "Erro inesperado.",
    });
  }
}

function doGet() {
  try {
    ensureDataSheets_();
    return jsonResponse_({
      ok: true,
      updatedAt: new Date().toISOString(),
      ...getResultsPayload_(),
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: error && error.message ? error.message : "Erro inesperado.",
    });
  }
}

function getResultsPayload_() {
  const votesSheet = getVotesSheet_();
  const questionsSheet = getQuestionsSheet_();

  const voteLastRow = votesSheet.getLastRow();
  const questionLastRow = questionsSheet.getLastRow();

  const votes = [];
  const topicCounts = {};

  if (voteLastRow > 1) {
    const voteValues = votesSheet.getRange(2, 1, voteLastRow - 1, 3).getValues();

    voteValues.forEach(function (row) {
      const topic1 = String(row[1] || "").trim();
      const topic2 = String(row[2] || "").trim();

      if (!topic1 && !topic2) {
        return;
      }

      votes.push({
        createdAt: row[0] ? new Date(row[0]).toISOString() : null,
        topics: [topic1, topic2].filter(Boolean),
      });

      [topic1, topic2].forEach(function (topic) {
        if (!topic) {
          return;
        }
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
  }

  const ranking = Object.keys(topicCounts)
    .map(function (topic) {
      return {
        topic: topic,
        votes: topicCounts[topic],
      };
    })
    .sort(function (a, b) {
      return b.votes - a.votes;
    });

  const questions = [];

  if (questionLastRow > 1) {
    const questionValues = questionsSheet
      .getRange(2, 1, questionLastRow - 1, 2)
      .getValues();

    questionValues.forEach(function (row) {
      const question = String(row[1] || "").trim();
      if (!question) {
        return;
      }

      questions.push({
        createdAt: row[0] ? new Date(row[0]).toISOString() : null,
        question: question,
      });
    });

    questions.reverse();
  }

  return {
    totalResponses: votes.length,
    topTwo: ranking.slice(0, 2),
    ranking: ranking,
    questions: questions,
  };
}


/**
 * Corre no editor do Apps Script:
 * 1. Dropdown -> setup
 * 2. Run
 * 3. Allow / Autorizar
 * Deves ver um popup "Setup concluido".
 */
function setup() {
  const spreadsheet = getSpreadsheet_();

  // Evita o erro de "nao podes apagar a ultima folha"
  const temp = spreadsheet.insertSheet("_temp_setup_" + Date.now());

  safeDeleteSheet_(spreadsheet, RESUMO_SHEET_NAME);
  safeDeleteSheet_(spreadsheet, VOTES_SHEET_NAME);
  safeDeleteSheet_(spreadsheet, QUESTIONS_SHEET_NAME);

  const resumo = spreadsheet.insertSheet(RESUMO_SHEET_NAME, 0);
  const votos = spreadsheet.insertSheet(VOTES_SHEET_NAME, 1);
  const perguntas = spreadsheet.insertSheet(QUESTIONS_SHEET_NAME, 2);

  buildResumoSheet_(resumo);
  buildVotesSheet_(votos);
  buildQuestionsSheet_(perguntas);

  spreadsheet.getSheets().forEach(function (sheet) {
    const name = sheet.getName();
    if (
      name !== RESUMO_SHEET_NAME &&
      name !== VOTES_SHEET_NAME &&
      name !== QUESTIONS_SHEET_NAME
    ) {
      safeDeleteSheet_(spreadsheet, name);
    }
  });

  SpreadsheetApp.flush();

  try {
    SpreadsheetApp.getUi().alert(
      "Setup concluido",
      "Tabs criadas: Resumo, Votos e Perguntas.\nAtualiza a Google Sheet no browser.",
      SpreadsheetApp.getUi().ButtonSet.OK,
    );
  } catch (error) {
    Logger.log("Setup concluido sem UI: " + spreadsheet.getUrl());
  }
}

function handleVote_(body) {
  const submissionKey = String(body.submissionKey || "").trim();
  const selectedTopics = Array.isArray(body.selectedTopics)
    ? body.selectedTopics
    : [];

  if (!submissionKey || selectedTopics.length !== 2) {
    return jsonResponse_({
      ok: false,
      error: "Dados do voto invalidos.",
    });
  }

  const sheet = getVotesSheet_();

  if (hasSubmissionKey_(sheet, 4, submissionKey)) {
    return jsonResponse_({
      ok: false,
      duplicate: true,
      error: "Este dispositivo ja enviou o voto.",
    });
  }

  sheet.appendRow([
    new Date(),
    String(selectedTopics[0] || ""),
    String(selectedTopics[1] || ""),
    submissionKey,
  ]);
  styleDataRow_(sheet, sheet.getLastRow(), 3);

  return jsonResponse_({
    ok: true,
    message: "Voto registado com sucesso.",
  });
}

function handleQuestion_(body) {
  const submissionKey = String(body.submissionKey || "").trim();
  const question = String(body.question || "").trim();

  if (!submissionKey || question.length < 10) {
    return jsonResponse_({
      ok: false,
      error: "Dados da pergunta invalidos.",
    });
  }

  const sheet = getQuestionsSheet_();

  if (hasSubmissionKey_(sheet, 3, submissionKey)) {
    return jsonResponse_({
      ok: false,
      duplicate: true,
      error: "Este dispositivo ja enviou uma pergunta.",
    });
  }

  sheet.appendRow([new Date(), question, submissionKey]);
  styleDataRow_(sheet, sheet.getLastRow(), 2);
  sheet.setRowHeight(sheet.getLastRow(), 64);

  return jsonResponse_({
    ok: true,
    message: "Pergunta enviada com sucesso.",
  });
}

function ensureDataSheets_() {
  getVotesSheet_();
  getQuestionsSheet_();

  const spreadsheet = getSpreadsheet_();
  if (!spreadsheet.getSheetByName(RESUMO_SHEET_NAME)) {
    buildResumoSheet_(spreadsheet.insertSheet(RESUMO_SHEET_NAME, 0));
  }
}

function getSpreadsheet_() {
  // Preferir a Sheet aberta no editor (mais fiavel no setup)
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }

  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function safeDeleteSheet_(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    return;
  }

  if (spreadsheet.getSheets().length <= 1) {
    return;
  }

  spreadsheet.deleteSheet(sheet);
}

function getVotesSheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(VOTES_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(VOTES_SHEET_NAME);
    buildVotesSheet_(sheet);
  } else if (sheet.getLastRow() === 0) {
    buildVotesSheet_(sheet);
  }

  return sheet;
}

function getQuestionsSheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(QUESTIONS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(QUESTIONS_SHEET_NAME);
    buildQuestionsSheet_(sheet);
  } else if (sheet.getLastRow() === 0) {
    buildQuestionsSheet_(sheet);
  }

  return sheet;
}

function buildVotesSheet_(sheet) {
  sheet.clear();
  sheet.appendRow(["Data", "Tema 1", "Tema 2", "submission_key"]);
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 170);
  sheet.setColumnWidth(2, 280);
  sheet.setColumnWidth(3, 280);
  sheet.hideColumns(4);
  sheet.setRowHeight(1, 42);
  sheet.setTabColor(COLORS.accent);

  sheet.getRange("A2:C100")
    .setFontFamily("Arial")
    .setFontSize(12)
    .setFontColor(COLORS.text)
    .setVerticalAlignment("middle")
    .setWrap(true)
    .setBackground(COLORS.surface);
  sheet.getRange("A2:A100").setNumberFormat("dd/mm/yyyy hh:mm");
  sheet.getRange("A1:D100").setBackground(COLORS.surface);
  styleHeader_(sheet, 4);
}

function buildQuestionsSheet_(sheet) {
  sheet.clear();
  sheet.appendRow(["Data", "Pergunta", "submission_key"]);
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 170);
  sheet.setColumnWidth(2, 720);
  sheet.hideColumns(3);
  sheet.setRowHeight(1, 42);
  sheet.setTabColor(COLORS.success);

  sheet.getRange("A2:B100")
    .setFontFamily("Arial")
    .setFontSize(13)
    .setFontColor(COLORS.text)
    .setVerticalAlignment("middle")
    .setWrap(true)
    .setBackground(COLORS.surface);
  sheet.getRange("A2:A100").setNumberFormat("dd/mm/yyyy hh:mm");
  sheet.getRange("A1:C100").setBackground(COLORS.surface);
  styleHeader_(sheet, 3);
}

function buildResumoSheet_(sheet) {
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet.setTabColor(COLORS.accent);

  sheet.setColumnWidth(1, 90);
  sheet.setColumnWidth(2, 380);
  sheet.setColumnWidth(3, 110);
  sheet.setColumnWidth(4, 40);
  sheet.setColumnWidth(5, 380);
  sheet.setColumnWidth(6, 120);

  sheet.getRange("A1:F50").setBackground(COLORS.background);

  sheet.getRange("A1:C1").merge();
  sheet
    .getRange("A1")
    .setValue("Resultados em tempo real")
    .setFontFamily("Arial")
    .setFontSize(22)
    .setFontWeight("bold")
    .setFontColor(COLORS.text)
    .setBackground(COLORS.background);
  sheet.setRowHeight(1, 56);

  sheet.getRange("A2:C2").merge();
  sheet
    .getRange("A2")
    .setValue("Os votos atualizam sozinhos. O Top 2 muda automaticamente.")
    .setFontFamily("Arial")
    .setFontSize(12)
    .setFontColor(COLORS.muted)
    .setBackground(COLORS.background);

  sheet.getRange("A4:C4").merge();
  sheet
    .getRange("A4")
    .setValue("TOP 2 ATUAL")
    .setFontFamily("Arial")
    .setFontSize(14)
    .setFontWeight("bold")
    .setFontColor(COLORS.accent)
    .setBackground(COLORS.accentSoft);

  sheet.getRange("A5").setValue("1º");
  sheet.getRange("B5").setFormula('=IFERROR(INDEX(A12:A,1),"Ainda sem votos")');
  sheet.getRange("C5").setFormula('=IFERROR(INDEX(B12:B,1),"")');
  sheet.getRange("A6").setValue("2º");
  sheet.getRange("B6").setFormula('=IFERROR(INDEX(A12:A,2),"Ainda sem votos")');
  sheet.getRange("C6").setFormula('=IFERROR(INDEX(B12:B,2),"")');

  sheet
    .getRange("A5:C6")
    .setFontFamily("Arial")
    .setFontSize(16)
    .setFontWeight("bold")
    .setFontColor(COLORS.text)
    .setBackground(COLORS.surface)
    .setVerticalAlignment("middle");
  sheet.getRange("A5:A6").setHorizontalAlignment("center").setFontColor(COLORS.accent);
  sheet.getRange("C5:C6").setHorizontalAlignment("center");
  sheet.setRowHeight(5, 48);
  sheet.setRowHeight(6, 48);

  sheet
    .getRange("A8")
    .setValue("TOTAL DE RESPOSTAS")
    .setFontFamily("Arial")
    .setFontSize(11)
    .setFontWeight("bold")
    .setFontColor(COLORS.muted);

  sheet
    .getRange("A9")
    .setFormula("=COUNTA(Votos!B2:B)")
    .setFontFamily("Arial")
    .setFontSize(28)
    .setFontWeight("bold")
    .setFontColor(COLORS.text)
    .setBackground(COLORS.surface);
  sheet.setRowHeight(9, 52);

  sheet.getRange("A11").setValue("Tema");
  sheet.getRange("B11").setValue("Votos");
  sheet
    .getRange("A11:B11")
    .setFontFamily("Arial")
    .setFontSize(12)
    .setFontWeight("bold")
    .setFontColor(COLORS.text)
    .setBackground(COLORS.header);

  sheet
    .getRange("A12")
    .setFormula(
      "=IFERROR(QUERY({Votos!B2:B;Votos!C2:C},\"select Col1, count(Col1) where Col1 is not null and Col1 <> '' group by Col1 order by count(Col1) desc label Col1 '', count(Col1) ''\"),\"\")",
    );

  sheet
    .getRange("A12:B40")
    .setFontFamily("Arial")
    .setFontSize(13)
    .setFontColor(COLORS.text)
    .setBackground(COLORS.surface)
    .setVerticalAlignment("middle");
  sheet.getRange("B12:B40").setHorizontalAlignment("center");

  sheet.getRange("E4:F4").merge();
  sheet
    .getRange("E4")
    .setValue("COMO LER")
    .setFontFamily("Arial")
    .setFontSize(12)
    .setFontWeight("bold")
    .setFontColor(COLORS.accent)
    .setBackground(COLORS.accentSoft);

  sheet.getRange("E5:F8").merge();
  sheet
    .getRange("E5")
    .setValue(
      "1. Olha primeiro para o Top 2.\n2. A tabela abaixo mostra todos os temas ordenados.\n3. Cada pessoa escolhe 2 temas, por isso o total de escolhas e o dobro do numero de respostas.",
    )
    .setFontFamily("Arial")
    .setFontSize(12)
    .setFontColor(COLORS.muted)
    .setBackground(COLORS.surface)
    .setWrap(true)
    .setVerticalAlignment("top");
}

function styleHeader_(sheet, columnCount) {
  sheet
    .getRange(1, 1, 1, columnCount)
    .setFontFamily("Arial")
    .setFontSize(12)
    .setFontWeight("bold")
    .setFontColor(COLORS.text)
    .setBackground(COLORS.header)
    .setHorizontalAlignment("left")
    .setVerticalAlignment("middle");
}

function styleDataRow_(sheet, row, visibleColumns) {
  sheet
    .getRange(row, 1, 1, visibleColumns)
    .setFontFamily("Arial")
    .setFontSize(12)
    .setFontColor(COLORS.text)
    .setBackground(COLORS.surface)
    .setVerticalAlignment("middle")
    .setWrap(true);
  sheet.getRange(row, 1).setNumberFormat("dd/mm/yyyy hh:mm");
  sheet.setRowHeight(row, visibleColumns === 2 ? 64 : 40);
}

function hasSubmissionKey_(sheet, keyColumn, submissionKey) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return false;
  }

  const values = sheet.getRange(2, keyColumn, lastRow - 1, 1).getValues();
  return values.some(function (row) {
    return String(row[0]) === submissionKey;
  });
}

function validateSecret_(providedSecret) {
  const expectedSecret = PropertiesService.getScriptProperties().getProperty(
    "APPS_SCRIPT_SHARED_SECRET",
  );

  if (!expectedSecret) {
    return;
  }

  if (String(providedSecret || "") !== expectedSecret) {
    throw new Error("Pedido nao autorizado.");
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
