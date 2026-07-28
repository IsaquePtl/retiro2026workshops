"use client";

import { useCallback, useEffect, useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import type { ResultsPayload } from "@/lib/google-apps-script";

type ResultsState = ResultsPayload | null;

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ResultsViewProps = {
  accessToken: string;
};

export function ResultsView({ accessToken }: ResultsViewProps) {
  const [results, setResults] = useState<ResultsState>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadResults = useCallback(async () => {
    try {
      const response = await fetch(`/api/results?token=${encodeURIComponent(accessToken)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ResultsPayload;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Nao foi possivel carregar os resultados.");
      }

      setResults(payload);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nao foi possivel carregar os resultados.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadResults();
    }, 0);

    const intervalId = window.setInterval(() => {
      void loadResults();
    }, 10000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [loadResults]);

  const maxVotes = results?.ranking[0]?.votes || 1;

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
          <source src="/api/media/video" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-10 pt-2">
        <BrandHeader compact />

        <div className="relative mt-6 sm:mt-8">
          <div className="relative z-10 rounded-[24px] border border-white/15 bg-black/35 p-4 shadow-2xl backdrop-blur-md md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-300">
                Em tempo real
              </p>
              <h1 className="text-xl font-semibold text-white">Resultados</h1>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/55">Respostas</p>
              <p className="text-2xl font-bold leading-none text-white">
                {results?.totalResponses ?? (isLoading ? "…" : 0)}
              </p>
            </div>
          </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-[24px] border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[24px] border border-white/15 bg-black/35 p-4 shadow-2xl backdrop-blur-md md:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
              Top 2 atual
            </h2>

            <div className="mt-4 space-y-3">
              {[0, 1].map((index) => {
                const item = results?.topTwo[index];

                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                          {index + 1}º
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white md:text-xl">
                          {item?.topic || (isLoading ? "A carregar…" : "Ainda sem votos")}
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-amber-300">
                        {item ? item.votes : "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-white">Ranking completo</h3>
              {(results?.ranking.length ? results.ranking : []).map((item) => (
                <div key={item.topic} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm text-white">
                    <span>{item.topic}</span>
                    <span className="font-semibold text-amber-300">{item.votes}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-amber-300"
                      style={{ width: `${Math.max(8, (item.votes / maxVotes) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}

              {!isLoading && !results?.ranking.length ? (
                <p className="text-sm text-white/60">Ainda nao ha votos.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[24px] border border-white/15 bg-black/35 p-4 shadow-2xl backdrop-blur-md md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                Perguntas
              </h2>
              <span className="text-xs text-white/50">
                {results?.questions.length || 0}
              </span>
            </div>

            <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              {(results?.questions.length ? results.questions : []).map((item, index) => (
                <article
                  key={`${item.question}-${index}`}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <p className="text-sm leading-6 text-white">{item.question}</p>
                  {item.createdAt ? (
                    <p className="mt-3 text-xs text-white/45">{formatTime(item.createdAt)}</p>
                  ) : null}
                </article>
              ))}

              {!isLoading && !results?.questions.length ? (
                <p className="text-sm text-white/60">Ainda nao ha perguntas.</p>
              ) : null}
            </div>
          </section>
        </div>

        <p className="pb-4 text-center text-xs text-white/45">
          Atualiza sozinho a cada 10 segundos
          {results?.updatedAt ? ` · ${formatTime(results.updatedAt)}` : ""}
        </p>
      </section>
    </main>
  );
}
