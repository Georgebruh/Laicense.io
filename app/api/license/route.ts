// app/api/license/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 1. Initialize Gemini securely (This runs on the server, keeping your key safe)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// 2. The Strict Logic Engine Prompt
const SYSTEM_INSTRUCTION = `
You are the core logic engine for "LAICENSE", an expert Open Source Software (OSS) licensing consultant. 
Your goal is to recommend the single best OSI-approved software license for a user's project by asking them a series of dynamic questions.

Constraints:
1. You must reach a conclusion within a minimum of 3 and a maximum of 5 questions.
2. You may only ask exactly ONE question per turn.
3. You may ONLY recommend from this list: MIT, Apache 2.0, GNU GPLv3, GNU AGPLv3, GNU LGPLv3, BSD 2-Clause, BSD 3-Clause, Mozilla Public License 2.0, or The Unlicense. Do NOT invent licenses.
4. Keep questions brief, simple, and free of dense legal jargon. 
5. You MUST respond entirely in valid JSON format. Do not use markdown wrappers like \`\`\`json.

JSON Output Schemas:

Schema A (When asking a question):
{
  "status": "question",
  "turn_number": <integer>,
  "question_text": "<Your simple question>",
  "options": ["<Option 1>", "<Option 2>", "<Option 3>"]
}

Schema B (When making the final recommendation):
{
  "status": "recommendation",
  "recommended_license": "<Name of license>",
  "short_summary": "<2-sentence plain English summary>",
  "pros": ["<Pro 1>", "<Pro 2>"],
  "cons": ["<Con 1>"],
  "official_link": "<URL to choosealicense.com or opensource.org>"
}
`;

export async function POST(req: Request) {
  try {
    // 3. Receive the conversation history from the frontend
    const body = await req.json();
    const { history } = body;

    // 4. Configure the AI Model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: "application/json", // Forces structured output
        temperature: 0.2, // Low temperature so it doesn't get overly creative
      }
    });

    // 5. Start the chat with the provided history
    const chat = model.startChat({
      history: history || [],
    });

    // 6. Trigger the AI 
    // If it's the first turn (no history), we ask it to start. Otherwise, we just say "continue".
    const messageToSend = history && history.length > 0 
      ? "Process the next turn based on my answer." 
      : "Hello, please ask me the first question to determine my software license.";

    const result = await chat.sendMessage(messageToSend);
    const responseText = result.response.text();

    // 7. Parse and return the JSON
    const jsonResponse = JSON.parse(responseText);
    return NextResponse.json(jsonResponse);

  } catch (error) {
    console.error("Error in AI Route:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}