import { auth } from "@/auth";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Modules from "./components/Modules";
import HowItWorks from "./components/HowItWorks";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import Waitlist from "./components/Waitlist";
import Footer from "./components/Footer";

export default async function Home() {
  const session = await auth();
  return (
    <main>
      <Navbar session={session} />
      <Hero />
      <Features />
      <Modules />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <Waitlist />
      <Footer />
    </main>
  );
}
