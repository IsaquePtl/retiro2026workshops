"use client";

import { FormEvent, useMemo, useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import {
  getSubmissionKey,
  markQuestionSubmitted,
  markVoteSubmitted,
  useHasSubmittedQuestion,
  useHasSubmittedVote,
} from "@/lib/submission";
import { WORKSHOP_TOPICS } from "@/lib/workshops";

const MAX_SELECTED_TOPICS = 2;

export default function Home() {
  const voteAlreadySent = useHasSubmittedVote();
  const questionAlreadySent = useHasSubmittedQuestion();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [questionSubmitted, setQuestionSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const voteDone = voteAlreadySent || voteSubmitted;
  const questionDone = questionAlreadySent || questionSubmitted;
  const alreadyDone = voteDone && questionDone;

  const canSubmit =
    !isSending &&
    !alreadyDone &&
    (voteDone || selectedTopics.length === MAX_SELECTED_TOPICS) &&
    (questionDone || question.trim().length >= 10);

  const voteCounterText = useMemo(() => {
    if (selectedTopics.length === MAX_SELECTED_TOPICS) {
      return "2 temas escolhidos";
    }

    return `Escolhe 2 · faltam ${MAX_SELECTED_TOPICS - selectedTopics.length}`;
  }, [selectedTopics]);

  function toggleTopic(topic: string) {
    setError(null);

    setSelectedTopics((current) => {
      if (current.includes(topic)) {
        return current.filter((item) => item !== topic);
      }

      if (current.length >= MAX_SELECTED_TOPICS) {
        return current;
      }

      return [...current, topic];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!voteDone && selectedTopics.length !== MAX_SELECTED_TOPICS) {
      setError("Escolhe exatamente 2 temas.");
      return;
    }

    if (!questionDone && question.trim().length < 10) {
      setError("Escreve uma pergunta com pelo menos 10 caracteres.");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const submissionKey = getSubmissionKey();

      if (!voteDone) {
        const voteResponse = await fetch("/api/workshop-vote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            submissionKey,
            selectedTopics,
          }),
        });

        const voteResult = (await voteResponse.json()) as {
          error?: string;
          message?: string;
        };

        if (!voteResponse.ok) {
          throw new Error(voteResult.error || "Nao foi possivel guardar o teu voto.");
        }

        markVoteSubmitted();
        setVoteSubmitted(true);
      }

      if (!questionDone) {
        const questionResponse = await fetch("/api/question", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            submissionKey,
            question,
          }),
        });

        const questionResult = (await questionResponse.json()) as {
          error?: string;
          message?: string;
        };

        if (!questionResponse.ok) {
          throw new Error(
            questionResult.error || "Nao foi possivel enviar a pergunta.",
          );
        }

        markQuestionSubmitted();
        setQuestionSubmitted(true);
        setQuestion("");
      }
    } catch (submitError) {
      const nextMessage =
        submitError instanceof Error
          ? submitError.message
          : "Nao foi possivel enviar. Tenta outra vez.";
      setError(nextMessage);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <div className="fixed inset-0 -z-10">
        <video
          className="h-full w-full object-cover blur-[2px] scale-105"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-xl flex-col px-4 pb-10 pt-2">
        <BrandHeader />

        <div className="relative mt-6 sm:mt-8">
          <form
            onSubmit={handleSubmit}
            className="relative z-10 mb-2 w-full space-y-4 rounded-[24px] border border-white/15 bg-black/35 p-4 shadow-2xl backdrop-blur-md sm:space-y-5 sm:p-6"
          >
          <section className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">Votar nos workshops</h2>
                <p className="text-xs text-white/65">{voteCounterText}</p>
              </div>
              <p className="text-xs leading-5 text-white/70">
                Escolhe os 2 workshops que mais te interessam. Vamos usar estes votos
                para decidir os temas do dia.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {WORKSHOP_TOPICS.map((topic) => {
                const isChecked = selectedTopics.includes(topic);
                const isDisabled =
                  voteDone ||
                  (!isChecked && selectedTopics.length >= MAX_SELECTED_TOPICS);

                return (
                  <label
                    key={topic}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${
                      isChecked
                        ? "border-amber-300 bg-amber-300/15"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    } ${isDisabled && !isChecked ? "cursor-not-allowed opacity-55" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => toggleTopic(topic)}
                      className="mt-0.5 h-4 w-4 accent-amber-300"
                    />
                    <span className="text-sm font-medium text-white">{topic}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="space-y-3 border-t border-white/10 pt-4">
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold text-white">
                Enviar pergunta para o momento da roda de conversa
              </h2>
              <p className="text-xs leading-5 text-white/70">
                Esta roda de conversa será um momento sobre{" "}
                <span className="font-medium text-white/90">Fé racional</span>:
                um espaço seguro para fazeres perguntas que talvez tenhas medo ou
                receio de colocar.
              </p>
              <p className="text-xs leading-5 text-white/70">
                A pergunta é anónima. Podes ser honesto/a!
              </p>
            </div>

            <textarea
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                setError(null);
              }}
              rows={4}
              maxLength={500}
              disabled={questionDone}
              placeholder="Ex.: Como sei que não acredito em Deus apenas porque fui educado assim?"
              className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 disabled:cursor-not-allowed disabled:opacity-70"
            />

            <div className="flex items-center justify-between text-xs text-white/55">
              <span>Anónimo</span>
              <span>{question.length}/500</span>
            </div>
          </section>

          {error ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          {alreadyDone ? (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
              Resposta enviada. Obrigado!
            </div>
          ) : (
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-amber-300 px-5 py-4 text-sm font-bold text-black transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50"
            >
              {isSending ? "A enviar..." : "Enviar"}
            </button>
          )}
          </form>
        </div>
      </section>
    </main>
  );
}
