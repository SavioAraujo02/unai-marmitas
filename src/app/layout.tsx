// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ToastNotifications } from '@/components/notifications/toast-notifications'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Unaí Marmitas - Sistema de Gestão',
  description: 'Sistema completo para gestão de marmitas empresariais',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Unaí Marmitas',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Unaí Marmitas',
    title: 'Sistema de Gestão de Marmitas',
    description: 'Sistema completo para gestão de marmitas empresariais',
  },
  twitter: {
    card: 'summary',
    title: 'Unaí Marmitas',
    description: 'Sistema de Gestão de Marmitas',
  },
}

export const viewport: Viewport = {
  themeColor: '#F59E0B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
      <AuthProvider>
        <ProtectedRoute>
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </ProtectedRoute>
        <ToastNotifications />
      </AuthProvider>
    </body>
    </html>
  )
}