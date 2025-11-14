import { Navbar } from "@/components/navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full">
      <Navbar />
      <main className="h-full pt-16 pb-10 bg-slate-100">
        <div className="container mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}