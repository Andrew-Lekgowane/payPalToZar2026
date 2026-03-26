import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import WhyUseUs from "@/components/landing/WhyUseUs";
import Testimonials from "@/components/landing/Testimonials";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <WhyUseUs />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
