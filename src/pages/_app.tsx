import AuthProvider from '@/contexts/AuthContext'
import MainLayout from '@/components/layout/MainLayout'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Toaster } from "@/components/ui/sonner";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <MainLayout>
        <Component {...pageProps} />
      </MainLayout>
      <Toaster richColors closeButton />
    </AuthProvider>
  )
}

export default MyApp