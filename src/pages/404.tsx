import React from "react";
import Head from "next/head";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>404 - Seite nicht gefunden | BuyAuto</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center space-y-6">
          <h1 className="text-8xl font-bold text-neutral-900">404</h1>
          <p className="text-lg text-neutral-600">Diese Seite existiert nicht.</p>
          <Button asChild className="bg-red-500 hover:bg-red-600 text-white rounded-2xl">
            <Link href="/">Zur Startseite</Link>
          </Button>
        </div>
      </main>
    </>
  );
}