// app/page.tsx
"use client";

import { useState } from "react";
// 1. IMPORT IMAGE COMPONENT
import Image from "next/image";

export default function Home() {
  // --- STATE MANAGEMENT ---
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // --- API CALL LOGIC ---
  const callAI = async (currentHistory: any[]) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: currentHistory }),
      });
      
      const data = await response.json();
      setCurrentData(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch from API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    setHasStarted(true);
    const initialMessage = { role: "user", parts: [{ text: "Hello, please ask me the first question to determine my software license." }] };
    const newHistory = [initialMessage];
    
    const aiResponse = await callAI(newHistory);
    setHistory([...newHistory, { role: "model", parts: [{ text: JSON.stringify(aiResponse) }] }]);
  };

  const handleAnswerClick = async (answer: string) => {
    const userMessage = { role: "user", parts: [{ text: answer }] };
    const historyWithUserAnswer = [...history, userMessage];
    setHistory(historyWithUserAnswer);
    
    const aiResponse = await callAI(historyWithUserAnswer);
    setHistory([...historyWithUserAnswer, { role: "model", parts: [{ text: JSON.stringify(aiResponse) }] }]);
  };

  // Reset the app to the beginning
  const handleRestart = () => {
    setHasStarted(false);
    setCurrentData(null);
    setHistory([]);
  };

  // --- UI: 1. WELCOME SCREEN ---
  if (!hasStarted) {
    return (
      <main className="min-h-screen bg-[#0B0D13] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-2xl w-full space-y-8">
          <div className="space-y-4">
            {/* 2. REPLACE H1 START */}
            {/* Standardizing horizontal alignment and applying a responsive size */}
           <div className="space-y-4">
            <Image
              src="/Logo.svg" 
              alt="LAICENSE AI Logo"
              width={400}
              height={100}
              // Notice the -ml-2 right at the start of the className
              className="-ml-2 w-48 md:w-64 h-auto object-contain object-left mb-2" 
              priority
            />
            <h2 className="text-xl md:text-2xl text-slate-300 pt-2">
              Find the right open-source license in under a minute
            </h2>
          </div>
          </div>


          <div className="space-y-6">
            <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
              Answer a few simple questions about your project. Our AI will
              recommend the best OSI-approved license based on your needs.
            </p>
            <p className="text-sm text-slate-500 font-medium">
              3–5 questions · Less than 60 seconds
            </p>
          </div>

          <div>
            <button 
              onClick={handleStart}
              className="bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-6 rounded-md flex items-center gap-2 transition-colors"
            >
              Get Started 
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>

          <div className="mt-12 p-6 border border-slate-800 rounded-lg bg-[#0f111a] flex gap-4 items-start">
            <div className="text-slate-500 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">Legal Disclaimer</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                LAICENSE provides informational guidance based on standard open-source practices. This does not constitute legal advice. Consult a qualified attorney for legal decisions regarding intellectual property and software licensing.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --- UI: 2. LOADING SCREEN ---
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0B0D13] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="text-center space-y-6">
           <div className="w-12 h-12 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin mx-auto"></div>
           <p className="text-slate-400 text-lg animate-pulse">Analyzing optimal licensing paths...</p>
        </div>
      </main>
    );
  }

  // --- UI: 3. QUESTION SCREEN ---
  if (currentData && currentData.status === "question") {
    return (
      <main className="min-h-screen bg-[#0B0D13] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-center mb-8">
            {currentData.question_text}
          </h2>
          
          <div className="flex flex-col gap-4">
            {currentData.options.map((option: string, index: number) => (
              <button 
                key={index}
                onClick={() => handleAnswerClick(option)}
                className="w-full text-left p-5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-violet-500 transition-all duration-200 text-lg font-medium"
              >
                {option}
              </button>
            ))}
          </div>
          
          <div className="text-sm text-slate-500 text-center mt-12 pt-8 border-t border-slate-800/50">
            Question {currentData.turn_number} of 5
          </div>
        </div>
      </main>
    );
  }

  // --- UI: 4. FINAL RESULTS SCREEN ---
  if (currentData && currentData.status === "recommendation") {
    return (
      <main className="min-h-screen bg-[#0B0D13] text-white flex flex-col items-center justify-center p-6 font-sans py-12">
        <div className="max-w-3xl w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Main Recommendation Header */}
          <div className="text-center space-y-4">
            <h2 className="text-violet-400 font-semibold tracking-wider uppercase text-sm">Recommended License</h2>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">{currentData.recommended_license}</h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mt-4">
              {currentData.short_summary}
            </p>
          </div>

          {/* Pros and Cons Grid */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {/* Pros Card */}
            <div className="bg-slate-900/50 border border-emerald-900/50 rounded-xl p-6">
              <h3 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                What this allows
              </h3>
              <ul className="space-y-3 text-slate-300">
                {currentData.pros?.map((pro: string, idx: number) => (
                  <li key={idx} className="flex gap-3 text-sm leading-relaxed">
                    <span className="text-emerald-500">•</span> {pro}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons / Limitations Card */}
            <div className="bg-slate-900/50 border border-rose-900/50 rounded-xl p-6">
              <h3 className="text-rose-400 font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Limitations & Conditions
              </h3>
              <ul className="space-y-3 text-slate-300">
                {currentData.cons?.map((con: string, idx: number) => (
                  <li key={idx} className="flex gap-3 text-sm leading-relaxed">
                    <span className="text-rose-500">•</span> {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* NEW: Similar Alternatives Section */}
          {currentData.similar_alternatives && currentData.similar_alternatives.length > 0 && (
            <div className="mt-10 pt-8 border-t border-slate-800/80">
              <h3 className="text-lg font-medium text-slate-300 mb-5">Similar Alternatives</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {currentData.similar_alternatives.map((alt: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-5 hover:bg-slate-800/60 transition-colors">
                    <h4 className="text-violet-300 font-semibold mb-2">{alt.name}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{alt.comparison}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 pt-8 border-t border-slate-800/50">
            <a 
              href={currentData.official_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-8 rounded-md text-center transition-colors"
            >
              Read Official License Text
            </a>
            <button 
              onClick={handleRestart}
              className="bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium py-3 px-8 rounded-md transition-colors"
            >
              Start Over
            </button>
          </div>

        </div>
      </main>
    );
  }

  return null;
}