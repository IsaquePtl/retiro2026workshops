import { notFound } from "next/navigation";
import { ResultsView } from "@/components/ResultsView";
import { isValidResultsToken } from "@/lib/results-access";

type ResultsPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SecretResultsPage({ params }: ResultsPageProps) {
  const { token } = await params;

  if (!isValidResultsToken(token)) {
    notFound();
  }

  return <ResultsView accessToken={token} />;
}
