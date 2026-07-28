type AppsScriptPayload = {
  action: "vote" | "question" | "results";
  submissionKey?: string;
  selectedTopics?: string[];
  question?: string;
};

type AppsScriptResult = {
  ok?: boolean;
  error?: string;
  duplicate?: boolean;
  message?: string;
};

export type ResultsPayload = {
  ok: boolean;
  error?: string;
  updatedAt?: string;
  totalResponses: number;
  topTwo: Array<{ topic: string; votes: number }>;
  ranking: Array<{ topic: string; votes: number }>;
  questions: Array<{ createdAt: string | null; question: string }>;
};

function getScriptUrl() {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!scriptUrl) {
    throw new Error("Google Apps Script URL is missing.");
  }

  return scriptUrl;
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      "O Apps Script devolveu HTML em vez de JSON. Faz Deploy > Manage deployments > New version.",
    );
  }
}

export async function sendToAppsScript(payload: AppsScriptPayload) {
  const sharedSecret = process.env.APPS_SCRIPT_SHARED_SECRET;

  const response = await fetch(getScriptUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      ...payload,
      secret: sharedSecret,
    }),
    cache: "no-store",
  });

  const result = (await parseJsonResponse(response)) as AppsScriptResult;

  if (!response.ok || !result.ok) {
    if (result.duplicate) {
      return {
        ok: false,
        duplicate: true,
        error: result.error || "Submissao duplicada.",
      };
    }

    throw new Error(result.error || "Erro ao comunicar com o Google Sheets.");
  }

  return {
    ok: true,
    message: result.message || "Submissao enviada com sucesso.",
  };
}

export async function fetchResultsFromAppsScript() {
  const sharedSecret = process.env.APPS_SCRIPT_SHARED_SECRET;

  // Preferir POST (mais estavel com Apps Script) e cair para GET se preciso.
  const postResponse = await fetch(getScriptUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "results",
      secret: sharedSecret,
    }),
    cache: "no-store",
  });

  try {
    const postResult = (await parseJsonResponse(postResponse)) as ResultsPayload;
    if (postResponse.ok && postResult.ok) {
      return postResult;
    }
  } catch {
    // tenta GET abaixo
  }

  const getResponse = await fetch(getScriptUrl(), {
    method: "GET",
    cache: "no-store",
  });

  const getResult = (await parseJsonResponse(getResponse)) as ResultsPayload;

  if (!getResponse.ok || !getResult.ok) {
    throw new Error(getResult.error || "Erro ao carregar os resultados.");
  }

  return getResult;
}
