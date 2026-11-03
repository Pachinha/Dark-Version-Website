import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import Brands from "@/components/Brands";
import ProcessBand from "@/components/ProcessBand";
import ObrasPreview from "@/components/ObrasPreview";
import ShowroomBand from "@/components/ShowroomBand";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      {/* First screen: image fills 100svh, navbar floats transparently on top */}
      <div style={{ position: "relative" }}>
        <Hero />
        <Navbar />
      </div>

      {/* Everything below — only visible on scroll */}
      <main>
        <Categories />
        <Brands />
        <ObrasPreview />
        <ProcessBand />
        <ShowroomBand />
      </main>
      <Footer />
    </>
  );
}
