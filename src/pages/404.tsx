import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <>
      <Head>
        <title>404 - Seite nicht gefunden</title>
        <meta name="description" content="Diese Seite existiert leider nicht." />
      </Head>
      
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">404</h1>
          <p className="text-lg text-gray-600">Entschuldigung, wir konnten die von Ihnen angeforderte Seite nicht finden.</p>
          <Button asChild>
            <Link href="/">
              Zurück zur Startseite
            </Link>
          </Button>
        </div>
      </main>
    </>
  )
}
