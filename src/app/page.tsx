import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CustomCursor from "@/components/CustomCursor";

export default function Home() {
  return (
    <main className="w-full h-full" style={{ background: "var(--color-bg)" }}>
      <CustomCursor />
      <Navbar />
      <HeroSection />
    </main>
  );
}
