"use client";

import { useEffect, useMemo, useState } from "react";

type Mode = "explore" | "exam";
type Screen = "setup" | "quiz" | "result";
type Question = { subject: string; text: string; options: string[]; answer: string; explanation: string };
const secondsPerQuestion = 25;

const subjectNames: Record<string, string> = {
  "MENTAL-ABILITY": "Mental Ability", "GENERAL-SCIENCE": "General Science", "INTERNATIONAL-AFFAIRS": "International Affairs",
  "COMPUTER-AND-INFORMATION-TECHNOLOGY": "Computer & IT", "MATHEMATICAL-REASONING": "Mathematical Reasoning",
  "GEOGRAPHY-ENVIRONMENT-AND-DIGESTER-MANAGEMENT": "Geography & Environment", "BANGLA-LANGUAGE": "Bangla",
  "ENGLISH-LANGUAGE": "English", "BANGLADESH-AFFAIRS": "Bangladesh Affairs", "ETHICS-VALUES-GOOD-GOVERNANCE": "Ethics & Governance",
};
const fallback: Question[] = [{ subject: "MENTAL-ABILITY", text: "জারিনের জন্ম ২৯ ফেব্রুয়ারী। তার জন্মগ্রহণের সাল কোনটি হতে পারে?", options: ["২০০২", "২০০৪", "২০০৬", "২০১০"], answer: "B", explanation: "২০০৪ সাল লিপ ইয়ার।" }];
const ordinal = (value: number) => value % 100 >= 11 && value % 100 <= 13 ? `${value}th` : `${value}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[value % 10] || "th"}`;
const displaySubject = (value: string) => subjectNames[value] || value.toLowerCase().split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

function parseQuestions(html: string): Question[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return [...doc.querySelectorAll(".single-question")].map((node) => {
    const container = node.querySelector(".p-2")?.cloneNode(true) as HTMLElement | undefined;
    container?.querySelector("h4")?.remove();
    return {
      subject: node.getAttribute("data-subject") || "GENERAL",
      text: container?.textContent?.trim() || "",
      options: [...node.querySelectorAll("label")].slice(0, 4).map((label) => label.querySelector("span:last-child")?.textContent?.trim() || ""),
      answer: (node.getAttribute("data-answer") || "").toUpperCase(),
      explanation: node.querySelector(".solve-note")?.textContent?.trim() || "",
    };
  }).filter((question) => question.text && question.options.length === 4);
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [setNumber, setSetNumber] = useState("50");
  const [subject, setSubject] = useState("all");
  const [mode, setMode] = useState<Mode>("explore");
  const [status, setStatus] = useState("Loading questions...");
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [visibleAnswers, setVisibleAnswers] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(secondsPerQuestion);
  const [result, setResult] = useState({ correct: 0, wrong: 0, skipped: 0, score: 0 });
  const subjects = useMemo(() => [...new Set(questions.map((question) => question.subject))], [questions]);

  useEffect(() => {
    fetch(`/api/questions?set=${setNumber}`).then(async (response) => {
      if (!response.ok) throw new Error("load failed");
      const loaded = parseQuestions(await response.text());
      if (!loaded.length) throw new Error("empty");
      setQuestions(loaded); setStatus(`${loaded.length} questions ready`);
    }).catch(() => { setQuestions(fallback); setStatus("Offline demo questions"); });
  }, [setNumber]);

  useEffect(() => {
    if (screen !== "quiz" || mode !== "exam") return;
    const timer = window.setInterval(() => setTimeLeft((time) => {
      if (time <= 1) { window.clearInterval(timer); finish(); return 0; }
      return time - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [screen, mode]);

  function startQuiz() {
    const filtered = questions.filter((question) => subject === "all" || question.subject === subject);
    const randomized = shuffle(filtered).map((question) => {
      const optionEntries = shuffle(question.options.map((text, index) => ({ text, value: "ABCD"[index] })));
      return {
        ...question,
        options: optionEntries.map((option) => option.text),
        answer: "ABCD"[optionEntries.findIndex((option) => option.value === question.answer)],
      };
    });
    setQuizQuestions(randomized);
    setAnswers({}); setVisibleAnswers({}); setTimeLeft(randomized.length * secondsPerQuestion); setScreen("quiz");
  }
  function answer(index: number, value: string) {
    if (mode === "exam" && answers[index]) return;
    setAnswers((current) => ({ ...current, [index]: value }));
  }
  function finish() {
    const correct = quizQuestions.filter((question, index) => answers[index] === question.answer).length;
    const answered = Object.keys(answers).length;
    const wrong = answered - correct;
    setResult({ correct, wrong, skipped: quizQuestions.length - answered, score: Math.max(0, Math.round(((correct - wrong * 0.25) / quizQuestions.length) * 100)) });
    setScreen(mode === "exam" ? "result" : "setup");
  }
  const answeredCount = Object.keys(answers).length;
  const subjectLabel = subject === "all" ? "All subjects" : subjectNames[subject] || subject;

  return <div className="flex min-h-screen flex-col">
    <main className="mx-auto w-[min(960px,calc(100%-32px))] flex-1">
      {screen === "setup" && <section className="block py-8 pb-14">
        <div className="mb-6"><h1 className="m-0 text-[clamp(28px,4vw,42px)] font-bold tracking-[-1px] text-[#46515b]">Practice BCS questions</h1><p className="mt-2 text-[#6b7680]">Choose your settings and start practicing.</p></div>
        <div className="max-w-[680px] rounded-xl border border-[#dfe3e6] bg-white p-6 shadow-none">
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="flex flex-col gap-2 text-[13px] font-semibold text-[#62726c]">BCS set<select className="w-full rounded-lg border border-[#dfe3e6] bg-[#fbfcfa] px-[13px] py-[11px] text-[#26313b] outline-none focus:border-[#9fbdac]" value={setNumber} onChange={(e) => setSetNumber(e.target.value)}>{Array.from({ length: 41 }, (_, i) => 50 - i).map((n) => <option key={n} value={n}>{ordinal(n)} BCS</option>)}</select></label><label className="flex flex-col gap-2 text-[13px] font-semibold text-[#62726c]">Subject<select className="w-full rounded-lg border border-[#dfe3e6] bg-[#fbfcfa] px-[13px] py-[11px] text-[#26313b] outline-none focus:border-[#9fbdac]" value={subject} onChange={(e) => setSubject(e.target.value)}><option value="all">All subjects</option>{subjects.map((item) => <option key={item} value={item}>{displaySubject(item)}</option>)}</select></label></div>
          <div className="mt-[22px] grid grid-cols-1 gap-3 sm:grid-cols-2"><button className={`min-h-[66px] rounded-lg border p-3.5 text-left text-[#26313b] ${mode === "explore" ? "border-[#9da7af] bg-[#f0f2f3]" : "border-[#dfe3e6] bg-white"}`} onClick={() => setMode("explore")}><strong className="block text-sm">Free practice</strong><small className="mt-px block text-xs text-[#6b7680]">Show or hide answers per question</small></button><button className={`min-h-[66px] rounded-lg border p-3.5 text-left text-[#26313b] ${mode === "exam" ? "border-[#9da7af] bg-[#f0f2f3]" : "border-[#dfe3e6] bg-white"}`} onClick={() => setMode("exam")}><strong className="block text-sm">Timed exam</strong><small className="mt-px block text-xs text-[#6b7680]">Locked answers and negative marking</small></button></div>
          <button className="mt-[22px] flex w-full items-center justify-center gap-6 rounded-lg bg-[#46515b] px-[17px] py-[13px] font-bold text-white shadow-none hover:brightness-95" onClick={startQuiz}>Start practice <span>→</span></button><p className="mt-3 text-center text-xs text-[#6b7680]">{status}</p>
        </div>
      </section>}
      {screen === "quiz" && <section className="block pt-0 pb-14"><div className="sticky top-0 z-[5] -mx-4 flex items-center justify-between border border-[#26313b] bg-[#26313b] px-[18px] py-3 text-white shadow-[0_5px_14px_rgba(38,49,59,.14)]"><button className="border-0 bg-transparent p-0 text-sm text-white hover:text-[#d7dce0] focus-visible:text-[#d7dce0]" onClick={() => setScreen("setup")}>← Exit</button><div className="flex items-center gap-3 font-bold"><span>{ordinal(Number(setNumber))} BCS</span><span className="h-[5px] w-[5px] rounded-full bg-[#d7dce0]" /><span>{subjectLabel}</span></div>{mode === "exam" && <div className={`rounded-lg border px-[13px] py-1.5 font-mono text-sm font-bold ${timeLeft <= 60 ? "border-[#f0aca1] bg-[#fff1ee] text-[#a73d2f]" : "border-[#c4cbd0] bg-[#f0f2f3] text-[#46515b]"}`}>{String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}</div>}</div><div className="sticky top-[51px] z-[4] -mx-4 flex justify-between border border-[#cbd5da] bg-[#e8eef1] px-3.5 py-[11px] text-[13px] font-bold text-[#26313b]"><span>{quizQuestions.length} questions</span><span>{answeredCount} answered · {quizQuestions.length - answeredCount} remaining</span></div><div className="sticky top-[93px] z-[4] -mx-4 mb-5 h-[5px] overflow-hidden bg-[#cbd5da]"><span className="block h-full bg-[#46515b] transition-[width] duration-300" style={{ width: `${(answeredCount / quizQuestions.length) * 100}%` }} /></div><div className="grid gap-[18px]">{quizQuestions.map((question, index) => { const selected = answers[index]; const locked = mode === "exam" && Boolean(selected); const answerVisible = mode === "explore" && visibleAnswers[index]; return <article className="grid grid-cols-1 rounded-xl border border-[#dfe3e6] bg-white p-[22px_18px] shadow-none sm:grid-cols-[70px_1fr] sm:p-[30px_35px]" key={`${question.text}-${index}`}><div className="mb-3 text-[26px] font-bold text-[#b5c5b9] sm:mb-0 sm:text-[30px]">{String(index + 1).padStart(2, "0")}</div><div className="max-w-[780px]"><span className="font-mono text-[10px] font-bold tracking-[1.5px] text-[#7d9c8b]">{displaySubject(question.subject)}</span><h2 className="my-2.5 mb-5 text-xl leading-[1.5]">{question.text}</h2><div className="grid gap-2.5">{question.options.map((option, optionIndex) => { const value = "ABCD"[optionIndex]; return <button className={`flex w-full items-center gap-[13px] rounded-lg border px-[15px] py-[11px] text-left text-[#26313b] ${selected === value ? "border-[#9da7af] bg-[#f0f2f3]" : "border-[#dfe3e6] bg-white"} ${locked ? "cursor-not-allowed" : "hover:border-[#9da7af] hover:bg-[#f0f2f3]"} ${answerVisible && value === question.answer ? "border-[#91a096] bg-[#eef2ef]" : ""} ${answerVisible && selected === value && value !== question.answer ? "border-[#c99b9b] bg-[#f8eeee]" : ""}`} disabled={locked} key={value} onClick={() => answer(index, value)}><span className={`grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full text-xs font-bold ${selected === value ? "bg-[#46515b] text-white" : "bg-[#eef4ed] text-[#688274]"}`}>{value}</span><span>{option}</span></button>; })}</div>{mode === "explore" && <><button className="mt-3.5 border-0 bg-transparent p-0 text-[13px] font-bold text-[#46515b] underline" onClick={() => setVisibleAnswers((current) => ({ ...current, [index]: !current[index] }))}>{answerVisible ? "Hide answer" : "Show answer"}</button>{answerVisible && <div className="mt-4 border-l-[3px] border-[#d7dce0] bg-[#f4f8f2] px-4 py-3.5 text-sm leading-[1.6] text-[#587065]"><strong>Correct answer: {question.answer}</strong><br />{question.explanation}</div>}</>}</div></article>; })}</div><div className="mt-[22px] flex justify-end"><button className="flex min-w-[168px] items-center justify-center gap-6 rounded-lg bg-[#46515b] px-[17px] py-[13px] font-bold text-white hover:brightness-95" onClick={finish}>{mode === "exam" ? "Submit exam" : "Finish"} <span>✓</span></button></div></section>}
      {screen === "result" && <section className="block py-8 pb-14"><div className="mx-auto max-w-[760px] rounded-xl border border-[#dfe3e6] bg-white p-10 text-center shadow-none sm:p-[55px]"><h1 className="m-0 text-[42px] text-[#46515b]">Exam results</h1><div className="mx-auto my-6 flex h-36 w-36 flex-col items-center justify-center rounded-full border-[12px] border-[#d7dce0] border-r-[#e7eaed]"><strong className="font-mono text-[27px] font-bold text-[#46515b]">{result.score}%</strong><span className="text-xs text-[#6b7680]">Score</span></div><div className="my-8 flex justify-center"><div className="min-w-[120px] border-r border-[#dfe3e6]"><strong className="block font-mono text-[22px] text-[#46515b]">{result.correct}</strong><span className="block text-[13px] text-[#6b7680]">Correct</span></div><div className="min-w-[120px] border-r border-[#dfe3e6]"><strong className="block font-mono text-[22px] text-[#46515b]">{result.wrong}</strong><span className="block text-[13px] text-[#6b7680]">Wrong</span></div><div className="min-w-[120px]"><strong className="block font-mono text-[22px] text-[#46515b]">{result.skipped}</strong><span className="block text-[13px] text-[#6b7680]">Skipped</span></div></div><div className="my-6 text-left">{quizQuestions.map((question, index) => { const selected = answers[index]; const correct = selected === question.answer; const selectedText = selected ? question.options["ABCD".indexOf(selected)] : "—"; const correctText = question.options["ABCD".indexOf(question.answer)]; return <div className={`mt-2 rounded-lg border-l-[3px] px-3.5 py-3 text-[13px] leading-[1.5] ${correct ? "border-[#71b481] bg-[#eef2ef]" : selected ? "border-[#a45b5b] bg-[#f8eeee]" : "border-[#aebbb4] bg-[#f4f8f2]"}`} key={index}><strong className="block text-[#46515b]">{index + 1}. {correct ? "Correct" : selected ? "Wrong" : "Not answered"}</strong><span className="text-[#6b7680]">{question.text}<br />Picked: {selected || "—"} — {selectedText}<br />Correct: {question.answer} — {correctText}<br />Explanation: {question.explanation || "No explanation provided."}</span></div>; })}</div><div className="flex flex-col justify-center gap-2.5 sm:flex-row"><button className="rounded-lg bg-[#46515b] px-[17px] py-[13px] font-bold text-white hover:brightness-95" onClick={startQuiz}>Try again</button><button className="rounded-lg border border-[#c4cbd0] bg-white px-3.5 py-2.5 font-semibold text-[#46515b] hover:bg-[#f0f2f3]" onClick={() => setScreen("setup")}>New practice</button></div></div></section>}
    </main>
  </div>;
}
