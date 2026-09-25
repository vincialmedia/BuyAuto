import Head from "next/head";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/runtime";
import { staticI18nProps } from "@/i18n/server";

export const getStaticProps = staticI18nProps(["auth"]);

export default function PaymentCancelledPage() {
  const t = useT();
  return (
    <>
      <Head>
        <title>{t("Zahlung abgebrochen | BuyAuto")}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-neutral-100">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <XCircle className="w-24 h-24 text-red-500" strokeWidth={1.5} />
              <span className="absolute -bottom-2 -right-2 text-4xl" role="img" aria-label={t("Sad face")}>
                😢
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            {t("Zahlung abgebrochen")}
          </h1>
          
          <p className="text-neutral-600 mb-8">
            {t("Deine Transaktion wurde storniert. Es wurden keine Gebühren erhoben und es wurde kein Paket aktiviert.")}
          </p>

          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/garage-plan">
                {t("Zurück zu den Preisen")}
              </Link>
            </Button>
            
            <Button asChild variant="ghost" className="w-full">
              <Link href="/dashboard/garage">
                {t("Zum Dashboard")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}