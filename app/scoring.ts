export type Question = {
  subject: string;
  text: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type Answers = Record<number, string>;

export type QuizResult = {
  correct: number;
  wrong: number;
  skipped: number;
  score: number;
};

export function scoreQuiz(questions: Question[], answers: Answers): QuizResult {
  let correct = 0;
  let answered = 0;

  questions.forEach((question, index) => {
    const selected = answers[index];
    if (!selected) return;

    answered += 1;
    if (selected === question.answer) correct += 1;
  });

  const wrong = answered - correct;
  const skipped = questions.length - answered;
  const score = questions.length === 0
    ? 0
    : Math.max(0, Math.round(((correct - wrong * 0.25) / questions.length) * 100));

  return { correct, wrong, skipped, score };
}
