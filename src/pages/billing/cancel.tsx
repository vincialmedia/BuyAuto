import Head from "next/head";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCancelledPage() {
  return (
    <>
      <Head>
        <title>Zahlung abgebrochen | BuyAuto</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-neutral-100">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <XCircle className="w-24 h-24 text-red-500" strokeWidth={1.5} />
              <span className="absolute -bottom-2 -right-2 text-4xl" role="img" aria-label="Sad face">
                😢
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Zahlung abgebrochen
          </h1>
          
          <p className="text-neutral-600 mb-8">
            Deine Transaktion wurde storniert. Es wurden keine Gebühren erhoben und es wurde kein Paket aktiviert.
          </p>

          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/garage-plan">
                Zurück zu den Preisen
              </Link>
            </Button>
            
            <Button asChild variant="ghost" className="w-full">
              <Link href="/dashboard/garage">
                Zum Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}