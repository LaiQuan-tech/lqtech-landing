import Reveal from "@/components/Reveal";
import FloatingBubbles from "@/components/FloatingBubbles";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import Services from "@/components/Services";
import Works from "@/components/Works";
import Process from "@/components/Process";
import Reviews from "@/components/Reviews";
import Faq from "@/components/Faq";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div style={{ position: "relative", overflowX: "clip" }}>
      <Reveal />
      <FloatingBubbles />
      <Nav />
      <Hero />
      <TrustStrip />
      <Services />
      <Works />
      <Process />
      <Reviews />
      <Faq />
      <Contact />
      <Footer />
    </div>
  );
}
