import { NextResponse } from "next/server";
import { z } from "zod";
import { sendToAppsScript } from "@/lib/google-apps-script";

const voteSchema = z.object({
  submissionKey: z.string().min(8).max(200),
  selectedTopics: z.array(z.string().min(2).max(120)).length(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { submissionKey, selectedTopics } = voteSchema.parse(body);
    const result = await sendToAppsScript({
      action: "vote",
      submissionKey,
      selectedTopics,
    });

    if (!result.ok && result.duplicate) {
      return NextResponse.json(
        { error: "Este dispositivo ja enviou o voto." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      message: result.message || "Voto registado com sucesso.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao guardar o voto.",
      },
      { status: 500 },
    );
  }
}
