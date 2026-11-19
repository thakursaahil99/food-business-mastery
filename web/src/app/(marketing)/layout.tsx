import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { ScrollProgress, SmoothScroll } from "@/components/motion/primitives";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <SmoothScroll>
      <ScrollProgress />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </SmoothScroll>
  );
}
