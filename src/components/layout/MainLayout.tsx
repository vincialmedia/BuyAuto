import Header from "@/components/buyauto/Header";
import { Footer } from "@/components/buyauto/Footer";
import { CookieConsent } from "@/components/buyauto/CookieConsent";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Header />
      <main>
        {children}
      </main>
      <Footer />
      <CookieConsent />
    </>
  );
}
