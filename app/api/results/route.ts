import { NextResponse } from "next/server";
import { fetchResultsFromAppsScript } from "@/lib/google-apps-script";
import { isValidResultsToken } from "@/lib/results-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (!isValidResultsToken(token)) {
    return NextResponse.json({ ok: false, error: "Nao encontrado." }, { status: 404 });
  }

  try {
    const results = await fetchResultsFromAppsScript();
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar os resultados.",
      },
      { status: 500 },
    );
  }
}
