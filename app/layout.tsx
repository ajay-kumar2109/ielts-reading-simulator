import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IELTS Reading Simulator - Free Academic Reading Practice Tests',
  description: 'Free IELTS Academic Reading practice simulator with authentic test format, instant scoring, and detailed feedback. Practice IELTS Reading tests online.',
  keywords: 'IELTS Reading, IELTS practice, Academic Reading, IELTS test, IELTS simulator, free IELTS practice, reading test, IELTS preparation',
  robots: 'index, follow',
  openGraph: {
    title: 'IELTS Reading Simulator - Free Practice Tests',
    description: 'Free IELTS Academic Reading practice simulator with authentic test format and instant scoring',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IELTS Reading Simulator',
    description: 'Free IELTS Academic Reading practice tests',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
