// app/page.tsx
"use client";

import { useState } from "react";

export default function Home() {
  // --- STATE MANAGEMENT ---
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState<any>(null);
  
  // Array to hold the conversation history for the AI
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
      
      // Return the AI's response so we can append it to our history
      return data;
    } catch (error) {
      console.error("Failed to fetch from API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    setHasStarted(true);
    
    // The first trigger message
    const initialMessage = { role: "user", parts: [{ text: "Hello, please ask me the first question to determine my software license." }] };
    const newHistory = [initialMessage];
    
    const aiResponse = await callAI(newHistory);
    
    // Save both our prompt and the AI's response
    setHistory([
      ...newHistory,
      { role: "model", parts: [{ text: JSON.stringify(aiResponse) }] }
    ]);
  };

  const handleAnswerClick = async (answer: string) => {
    // Append the user's answer to the history
    const userMessage = { role: "user", parts: [{ text: answer }] };
    const historyWithUserAnswer = [...history, userMessage];
    
    // Update state immediately so it's ready
    setHistory(historyWithUserAnswer);
    
    // Call AI with the updated history
    const aiResponse = await callAI(historyWithUserAnswer);
    
    // Append AI's new response to history
    setHistory([
      ...historyWithUserAnswer,
      { role: "model", parts: [{ text: JSON.stringify(aiResponse) }] }
    ]);
  };

  // --- UI: 1. WELCOME SCREEN ---
  if (!hasStarted) {
    return (
      <main className="min-h-screen bg-[#0B0D13] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-2xl w-full space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">LAICENSE</h1>
            <h2 className="text-xl md:text-2xl text-slate-300">
              Find the right open-source license in under a minute
            </h2>
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
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
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

  // --- UI: 4. PLACEHOLDER RESULTS SCREEN ---
  if (currentData && currentData.status === "recommendation") {
    return (
      <main className="min-h-screen bg-[#0B0D13] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="text-center space-y-4">
          <h2 className="text-3xl text-violet-400 font-bold">Recommendation Found!</h2>
          <p className="text-xl">License: {currentData.recommended_license}</p>
          <p className="text-slate-400 text-sm">We will build the beautiful result card in the next step.</p>
        </div>
      </main>
    );
  }

  return null;
}