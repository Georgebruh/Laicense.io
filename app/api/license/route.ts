// app/api/license/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const LICENSE_DATABASE = [
  // --- Public Domain ---
  { name: "The Unlicense", category: "Public Domain", traits: { copyleft: "none", patent_protection: false, attribution_required: false } },
  { name: "Creative Commons Zero v1.0 Universal", category: "Public Domain", traits: { copyleft: "none", patent_protection: false, attribution_required: false, software_focused: false } },

  // --- Permissive ---
  { name: "MIT License", category: "Permissive", traits: { copyleft: "none", patent_protection: false, attribution_required: true } },
  { name: "Apache License 2.0", category: "Permissive", traits: { copyleft: "none", patent_protection: true, attribution_required: true } },
  { name: "BSD 2-Clause \"Simplified\" License", category: "Permissive", traits: { copyleft: "none", patent_protection: false, attribution_required: true, forbids_endorsement: false } },
  { name: "BSD 3-Clause \"New\" or \"Revised\" License", category: "Permissive", traits: { copyleft: "none", patent_protection: false, attribution_required: true, forbids_endorsement: true } },
  { name: "Boost Software License 1.0", category: "Permissive", traits: { copyleft: "none", patent_protection: false, attribution_required: "source-code-only" } },

  // --- Weak Copyleft ---
  { name: "Mozilla Public License 2.0", category: "Weak Copyleft", traits: { copyleft: "file-level", patent_protection: true, attribution_required: true } },
  { name: "Eclipse Public License 2.0", category: "Weak Copyleft", traits: { copyleft: "file-level", patent_protection: true, attribution_required: true, corporate_focused: true } },
  { name: "GNU Lesser General Public License v2.1", category: "Weak Copyleft", traits: { copyleft: "library-level", patent_protection: false, attribution_required: true } },

  // --- Strong Copyleft ---
  { name: "GNU General Public License v2.0", category: "Strong Copyleft", traits: { copyleft: "project-level", patent_protection: false, attribution_required: true, network_saas_restriction: false } },
  { name: "GNU General Public License v3.0", category: "Strong Copyleft", traits: { copyleft: "project-level", patent_protection: true, attribution_required: true, network_saas_restriction: false } },
  { name: "GNU Affero General Public License v3.0", category: "Strong Copyleft", traits: { copyleft: "project-level", patent_protection: true, attribution_required: true, network_saas_restriction: true } },
];

const DB_COMPACT = JSON.stringify(LICENSE_DATABASE);

const buildSystemInstruction = (turnNumber: number, maybeStreakCount: number) => `
You are LAICENSE, an open-source licensing consultant. Narrow down the perfect license in 3–5 turns.

# License Database (authoritative — use ONLY these licenses)
${DB_COMPACT}

# Session State (injected server-side — trust these values)
- Current turn: ${turnNumber}
- Consecutive "Maybe" answers from user: ${maybeStreakCount}

# Core Rules
1. **Akinator Strategy:** Each question must be about the trait that splits the remaining candidate pool as evenly in half as possible. Never ask about a trait that all remaining candidates share.
2. **Turn 1 behavior:** If turn is 1, ask the single broadest splitting question to start.
3. **Subsequent turns:** The last user message is their answer. Filter the database by that answer, then ask the next best splitting question — or recommend if only one candidate remains.
4. **Maybe tiebreak:** If maybeStreakCount >= 2 for the same trait axis, treat the answer as "No" and eliminate those candidates.
5. **ZERO JARGON (critical):** Never use: copyleft, patent, permissive, SaaS, liability, viral, attribution. Translate everything into plain human scenarios:
   - copyleft → "If someone changes your code, must they share their new version publicly?"
   - patent_protection → "Did you invent something new in this code you want protected from lawsuits?"
   - attribution_required → "Must people who use your code give you credit?"
   - network_saas_restriction → "If someone runs your code as a website or online service, must they share their code too?"
   - software_focused → "Is this for software/code (vs. writing, art, or data)?"
6. **Question brevity:** Maximum 15 words per question.
7. **Options:** Always exactly ["Yes", "No", "Maybe"].
8. **Recommendation rule:** When one candidate remains (or turn >= 5), recommend it. For the two alternatives, pick licenses from DIFFERENT categories than the primary recommendation so the user can see the tradeoff spectrum.

# Output — strict JSON only, no markdown, no prose outside JSON

Schema A (question):
{
  "status": "question",
  "turn_number": ${turnNumber},
  "question_text": "<plain-English question, max 15 words>",
  "options": ["Yes", "No", "Maybe"]
}

Schema B (recommendation):
{
  "status": "recommendation",
  "recommended_license": "<exact name from database>",
  "short_summary": "<1–2 jargon-free sentences explaining why this fits>",
  "pros": ["<Pro 1>", "<Pro 2>"],
  "cons": ["<Con 1>"],
  "official_link": "<choosealicense.com or opensource.org URL>",
  "similar_alternatives": [
    {
      "name": "<license from a DIFFERENT category than the primary>",
      "comparison": "<1 sentence on how it differs from the primary recommendation>"
    },
    {
      "name": "<license from yet another DIFFERENT category>",
      "comparison": "<1 sentence on how it differs from the primary recommendation>"
    }
  ]
}
`;

function deriveSessionState(history: { role: string; parts: { text: string }[] }[]) {
  const turnNumber = Math.floor(history.filter((h) => h.role === "user").length) + 1;

  let maybeStreakCount = 0;
  const userMessages = history.filter((h) => h.role === "user").map((h) => h.parts[0]?.text?.trim().toLowerCase());
  for (let i = userMessages.length - 1; i >= 0; i--) {
    if (userMessages[i] === "maybe") {
      maybeStreakCount++;
    } else {
      break;
    }
  }

  return { turnNumber, maybeStreakCount };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { history } = body as {
      history: { role: string; parts: { text: string }[] }[];
    };

    const { turnNumber, maybeStreakCount } = deriveSessionState(history ?? []);

    // 1. Separate previous history from the latest user message to prevent role duplication
    const safeHistory = history ?? [];
    const previousHistory = safeHistory.slice(0, -1);
    const latestUserMessage = safeHistory.length > 0 
      ? safeHistory[safeHistory.length - 1].parts[0].text 
      : "Hello";

    // 2. Initialize the model with a valid model name
    // 2. Initialize the model with the current, valid model name
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // <-- Change this back from 1.5!
      systemInstruction: buildSystemInstruction(turnNumber, maybeStreakCount),
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    // 3. Start chat with strictly alternating previous history
    const chat = model.startChat({ history: previousHistory });

    // 4. Send the new user message
    const result = await chat.sendMessage(latestUserMessage);

    const responseText = result.response.text();
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