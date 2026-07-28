import { NextResponse } from "next/server";
import { fetchResultsFromAppsScript } from "@/lib/google-apps-script";

export const dynamic = "force-dynamic";

export async function GET() {
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
