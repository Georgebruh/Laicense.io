// app/page.tsx

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0D13] text-white flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Main Content Container */}
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            LAICENSE
          </h1>
          <h2 className="text-xl md:text-2xl text-slate-300">
            Find the right open-source license in under a minute
          </h2>
        </div>

        {/* Description Section */}
        <div className="space-y-6">
          <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
            Answer a few simple questions about your project. Our AI will
            recommend the best OSI-approved license based on your needs.
          </p>
          <p className="text-sm text-slate-500 font-medium">
            3–5 questions · Less than 60 seconds
          </p>
        </div>

        {/* Action Button */}
        <div>
          <button className="bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-6 rounded-md flex items-center gap-2 transition-colors">
            Get Started 
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* Disclaimer Card */}
        <div className="mt-12 p-6 border border-slate-800 rounded-lg bg-[#0f111a] flex gap-4 items-start">
          <div className="text-slate-500 mt-1">
            {/* Simple SVG Info Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">
              Legal Disclaimer
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              LAICENSE provides informational guidance based on standard open-source practices. This does not constitute legal advice. Consult a qualified attorney for legal decisions regarding intellectual property and software licensing.
            </p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="fixed bottom-6 text-xs text-slate-600">
        LAICENSE · Not legal advice · Consult an attorney for legal decisions
      </div>
    </main>
  );
}