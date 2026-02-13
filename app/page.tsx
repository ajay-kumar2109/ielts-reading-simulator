import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-blue-600">IELTS Reading Simulator</h1>
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/login" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 min-h-[44px] flex items-center px-2">Login</Link>
              <Link href="/signup" className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base hover:bg-blue-700 min-h-[44px] flex items-center">Sign Up</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="bg-gradient-to-b from-blue-50 to-white py-12 sm:py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Free IELTS Academic Reading Practice
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
              Improve your IELTS Reading score with authentic practice tests, instant feedback, and detailed performance analytics
            </p>
            <div className="flex flex-col xs:flex-row justify-center gap-3 sm:gap-4 px-4 xs:px-0">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-700 transition min-h-[44px]"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-white text-blue-600 px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition min-h-[44px]"
              >
                Login
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
              Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center p-4 sm:p-6">
                <div className="bg-blue-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg sm:text-xl font-semibold mb-2">Authentic Test Format</h4>
                <p className="text-sm sm:text-base text-gray-600">Practice with real IELTS Academic Reading test structure and timing</p>
              </div>

              <div className="text-center p-4 sm:p-6">
                <div className="bg-blue-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg sm:text-xl font-semibold mb-2">Instant Scoring</h4>
                <p className="text-sm sm:text-base text-gray-600">Get immediate feedback with accurate band score calculation</p>
              </div>

              <div className="text-center p-4 sm:p-6 sm:col-span-2 md:col-span-1">
                <div className="bg-blue-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg sm:text-xl font-semibold mb-2">Track Progress</h4>
                <p className="text-sm sm:text-base text-gray-600">Monitor your improvement with detailed performance history</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 sm:mb-8">
              How It Works
            </h3>
            <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
              <div className="flex items-start p-3 sm:p-0">
                <div className="flex-shrink-0 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 sm:mr-4 text-sm sm:text-base">1</div>
                <div>
                  <h4 className="font-semibold text-base sm:text-lg mb-1">Create Free Account</h4>
                  <p className="text-sm sm:text-base text-gray-600">Sign up with your email to access all practice tests</p>
                </div>
              </div>
              <div className="flex items-start p-3 sm:p-0">
                <div className="flex-shrink-0 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 sm:mr-4 text-sm sm:text-base">2</div>
                <div>
                  <h4 className="font-semibold text-base sm:text-lg mb-1">Choose Practice Test</h4>
                  <p className="text-sm sm:text-base text-gray-600">Select from available IELTS Academic Reading tests</p>
                </div>
              </div>
              <div className="flex items-start p-3 sm:p-0">
                <div className="flex-shrink-0 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 sm:mr-4 text-sm sm:text-base">3</div>
                <div>
                  <h4 className="font-semibold text-base sm:text-lg mb-1">Complete Test</h4>
                  <p className="text-sm sm:text-base text-gray-600">Answer 40 questions in 60 minutes, just like the real IELTS test</p>
                </div>
              </div>
              <div className="flex items-start p-3 sm:p-0">
                <div className="flex-shrink-0 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 sm:mr-4 text-sm sm:text-base">4</div>
                <div>
                  <h4 className="font-semibold text-base sm:text-lg mb-1">Review Results</h4>
                  <p className="text-sm sm:text-base text-gray-600">Get instant band score and detailed answer explanations</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Ready to improve your IELTS Reading score?</h3>
            <p className="text-base sm:text-xl mb-6 sm:mb-8">Start practicing for free today</p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-white text-blue-600 px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-gray-100 transition min-h-[44px]"
            >
              Sign Up Now
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm sm:text-base">
              This is an independent IELTS practice simulator and is not affiliated with IELTS.
            </p>
            <p className="text-gray-500 mt-2 text-xs sm:text-sm">
              &copy; {new Date().getFullYear()} IELTS Reading Simulator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
