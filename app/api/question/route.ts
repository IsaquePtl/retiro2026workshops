import { NextResponse } from "next/server";
import { z } from "zod";
import { sendToAppsScript } from "@/lib/google-apps-script";

const questionSchema = z.object({
  submissionKey: z.string().min(8).max(200),
  question: z.string().trim().min(10).max(500),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { submissionKey, question } = questionSchema.parse(body);
    const result = await sendToAppsScript({
      action: "question",
      submissionKey,
      question,
    });

    if (!result.ok && result.duplicate) {
      return NextResponse.json(
        { error: "Este dispositivo ja enviou uma pergunta." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      message: result.message || "Pergunta enviada com sucesso.",
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
            : "Erro inesperado ao enviar a pergunta.",
      },
      { status: 500 },
    );
  }
}
