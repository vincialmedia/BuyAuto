import Header from "@/components/buyauto/Header";
import { Footer } from "@/components/buyauto/Footer";

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
    </>
  );
}
