import { NextResponse } from "next/server";

function ordinalSuffix(number: number) {
  if (number % 100 >= 11 && number % 100 <= 13) return "th";
  return ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[number % 10] || "th";
}

export async function GET(request: Request) {
  const set = Number(new URL(request.url).searchParams.get("set"));
  if (!Number.isInteger(set) || set < 10 || set > 50) {
    return NextResponse.json({ error: "BCS set must be between 10 and 50" }, { status: 400 });
  }
  const source = `https://uttoron.academy/QuestionBank/QuestionPreview/${set}${ordinalSuffix(set)}-bcs`;
  try {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: `Question source returned HTTP ${response.status}` }, { status: 502 });
    return new NextResponse(await response.text(), {
      headers: { "Content-Type": response.headers.get("content-type") || "text/html; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "Could not load question source" }, { status: 502 });
  }
}
