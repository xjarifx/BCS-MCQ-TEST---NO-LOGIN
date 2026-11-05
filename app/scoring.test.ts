import { describe, expect, it } from "vitest";
import { scoreQuiz, type Question } from "./scoring";

const questions: Question[] = Array.from({ length: 5 }, (_, index) => ({
  subject: "GENERAL",
  text: `Question ${index + 1}`,
  options: ["A", "B", "C", "D"],
  answer: "ABCD"[index % 4],
  explanation: "",
}));

describe("scoreQuiz", () => {
  it("counts wrong answers separately from correct answers", () => {
    expect(scoreQuiz(questions, { 0: "A", 1: "B", 2: "A", 3: "C", 4: "A" })).toEqual({
      correct: 3,
      wrong: 2,
      skipped: 0,
      score: 50,
    });
  });

  it("counts unanswered questions as skipped", () => {
    expect(scoreQuiz(questions, { 0: "A", 1: "A" })).toEqual({
      correct: 1,
      wrong: 1,
      skipped: 3,
      score: 15,
    });
  });

  it("returns zeroes for an empty quiz", () => {
    expect(scoreQuiz([], {})).toEqual({
      correct: 0,
      wrong: 0,
      skipped: 0,
      score: 0,
    });
  });
});
