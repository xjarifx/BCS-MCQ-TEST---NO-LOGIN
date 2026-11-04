import "./globals.css";

export const metadata = {
  title: "BCS MCQ Practice",
  description: "Practice BCS multiple-choice questions",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="m-0 bg-[#f5f6f7] font-sans text-[#26313b]">{children}</body></html>;
}
