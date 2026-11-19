import { Hero } from "@/components/marketing/hero";
import { Curriculum, MarqueeBand, Pillars, Stats } from "@/components/marketing/sections-program";
import { Benefits, Coach, PortalShowcase } from "@/components/marketing/sections-academy";
import { ApplySection, Faq, Stories } from "@/components/marketing/sections-close";
import { AwardsStrip, CommunityPhoto, SectorsGallery } from "@/components/marketing/photo-sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <MarqueeBand />
      <Stats />
      <Pillars />
      <SectorsGallery />
      <Curriculum />
      <Benefits />
      <Coach />
      <AwardsStrip />
      <PortalShowcase />
      <CommunityPhoto />
      <Stories />
      <Faq />
      <ApplySection />
    </>
  );
}
