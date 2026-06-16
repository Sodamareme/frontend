import type { Metadata } from 'next'
import { Toaster } from "sonner";
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { NotificationProvider } from '@/components/providers/notification-provider'
import AppUpdateWatcher from '@/components/system/AppUpdateWatcher'
import { APP_RUNTIME_VERSION } from '@/lib/app-version'

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
      <html lang="fr" suppressHydrationWarning>
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
        <body
          className="min-h-screen bg-white font-sans text-slate-900 antialiased"
          suppressHydrationWarning
          data-app-version={APP_RUNTIME_VERSION}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            storageKey="sonatel-theme"
          >
            <QueryProvider>
              <NotificationProvider>
                <AppUpdateWatcher />
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
