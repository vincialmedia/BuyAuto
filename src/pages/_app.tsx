import AuthProvider from '@/contexts/AuthContext'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Toaster } from "@/components/ui/sonner";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster richColors closeButton />
    </AuthProvider>
  )
}

export default MyApp
