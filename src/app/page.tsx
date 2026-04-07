import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";

export default function Home() {
  return (
    <main className="w-full h-full" style={{ background: "var(--color-bg)" }}>
      <Navbar />
      <HeroSection />
    </main>
  );
}
