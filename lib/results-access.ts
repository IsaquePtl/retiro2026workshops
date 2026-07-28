export function getResultsAccessToken() {
  return process.env.RESULTS_ACCESS_TOKEN?.trim() || "";
}

export function isValidResultsToken(token: string | undefined | null) {
  const expected = getResultsAccessToken();

  if (!expected || !token) {
    return false;
  }

  return token === expected;
}
