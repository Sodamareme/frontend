import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "sonner";
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { NotificationProvider } from '@/components/providers/notification-provider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Sonatel Academy',
  description: 'Plateforme de gestion de Sonatel Academy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <html lang="fr" className={inter.variable} suppressHydrationWarning>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <style>
            {`
              .bg-sonatel-orange { background-color: #F16E00; }
              .text-sonatel-orange { color: #F16E00; }
              .border-sonatel-orange { border-color: #F16E00; }
              .bg-sonatel-teal { background-color: #009682; }
              .text-sonatel-teal { color: #009682; }
              .border-sonatel-teal { border-color: #009682; }
            `}
          </style>
        </head>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            storageKey="sonatel-theme"
          >
            <QueryProvider>
              <NotificationProvider>
                {children}
                <Toaster richColors closeButton />
              </NotificationProvider>
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </AuthProvider>
  )
}