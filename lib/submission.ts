"use client";

import { useSyncExternalStore } from "react";

const SUBMISSION_KEY_STORAGE = "retiro-submission-key-v8";
const VOTE_SENT_STORAGE = "retiro-vote-sent-v8";
const QUESTION_SENT_STORAGE = "retiro-question-sent-v8";

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function createSubmissionKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `submission-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getSubmissionKey() {
  const existingKey = window.localStorage.getItem(SUBMISSION_KEY_STORAGE);

  if (existingKey) {
    return existingKey;
  }

  const newKey = createSubmissionKey();
  window.localStorage.setItem(SUBMISSION_KEY_STORAGE, newKey);
  return newKey;
}

export function hasSubmittedVote() {
  return window.localStorage.getItem(VOTE_SENT_STORAGE) === "true";
}

export function markVoteSubmitted() {
  window.localStorage.setItem(VOTE_SENT_STORAGE, "true");
  emitChange();
}

export function hasSubmittedQuestion() {
  return window.localStorage.getItem(QUESTION_SENT_STORAGE) === "true";
}

export function markQuestionSubmitted() {
  window.localStorage.setItem(QUESTION_SENT_STORAGE, "true");
  emitChange();
}

export function useHasSubmittedVote() {
  return useSyncExternalStore(subscribe, hasSubmittedVote, () => false);
}

export function useHasSubmittedQuestion() {
  return useSyncExternalStore(subscribe, hasSubmittedQuestion, () => false);
}
