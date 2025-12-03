

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || 'dummy_key'; 
// Note: In a real scenario, this would fail without a key. 
// For this demo structure, we assume the key is present in the environment.

const ai = new GoogleGenAI({ apiKey });

export const generateProposal = async (
  clientName: string,
  services: string,
  value: number,
  tone: 'formal' | 'friendly' | 'urgent'
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Act as a professional Kenyan sales consultant. 
      Generate a business proposal for a client named "${clientName}".
      
      Context:
      - Services/Products: ${services}
      - Total Value: KES ${value.toLocaleString()}
      - Tone: ${tone}
      
      Structure the proposal with Markdown:
      1. Executive Summary
      2. Scope of Work
      3. Investment Breakdown (in KES)
      4. Next Steps (mention M-Pesa or Bank Transfer)
      
      Keep it concise (under 300 words).
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Could not generate proposal. Please try again.";
  } catch (error) {
    console.error("Error generating proposal:", error);
    return "Error connecting to AI service. Please check your connection or API key.";
  }
};

export const generateChatReply = async (
  lastMessage: string,
  clientName: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-lite'; // Fast model for chat
    const prompt = `
      You are an AI assistant for a Kenyan business. 
      The client "${clientName}" just sent: "${lastMessage}".
      Draft a short, professional, and helpful reply. 
      If they ask about price, say you need to check the catalogue.
      Keep it under 50 words.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "I'm not sure how to reply to that.";
  } catch (error) {
    console.error("Error generating chat reply:", error);
    return "System is offline.";
  }
};

export const interpretCrmCommand = async (input: string, userRole: string) => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are "Amplify Copilot", an advanced AI agent managing an Enterprise CRM connected via Telegram.
      User Role: ${userRole}
      User Input: "${input}"

      Your goal is to parse natural language into precise CRM commands.
      
      INTENTS:
      1. CREATE_LEAD: User wants to add a new opportunity. Extract 'name' (company/person) and 'value'. Default value to 0 if not specified.
      2. UPDATE_LEAD: User wants to modify an existing deal. Extract 'name' (to match against), 'field' (stage, value, probability), and 'newValue'.
      3. DELETE_LEAD: User wants to remove a deal. Extract 'name'.
      4. QUERY_LEAD: User wants to see stats, counts, or a visualization of the pipeline.
      5. ANALYZE_LEAD: User wants deep BANT qualification, risk assessment, or insights on a specific lead. Extract 'name'.
      6. SYSTEM_STATUS: User asks about server health, API latency, or system uptime.
      7. GENERAL_CHAT: Greetings, help requests, or off-topic queries.

      MAPPING RULES:
      - Money: "1.5m" -> 1500000, "50k" -> 50000.
      - Stages: Map vague terms to: 'Intake', 'Qualified', 'Proposal', 'Negotiation', 'Closed', 'Lost'.
      - Probability: Extract percentage as integer (0-100).

      OUTPUT SCHEMA (JSON ONLY):
      {
        "intent": "CREATE_LEAD" | "UPDATE_LEAD" | "DELETE_LEAD" | "QUERY_LEAD" | "ANALYZE_LEAD" | "SYSTEM_STATUS" | "GENERAL_CHAT",
        "data": {
          "name": string | null,
          "value": number | null,
          "field": "value" | "stage" | "probability" | null,
          "newValue": string | number | null
        },
        "response_text": string // A professional, brief confirmation of the action or the answer to the chat.
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Command interpretation failed", error);
    return { intent: 'GENERAL_CHAT', response_text: "I am having trouble processing that command. Please try again." };
  }
};

export const analyzePipeline = async (leadsCount: number, revenue: number): Promise<string> => {
   try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Analyze this daily sales snapshot:
      - Active Leads: ${leadsCount}
      - Potential Revenue: KES ${revenue.toLocaleString()}
      
      Give me 3 short, bulleted strategic actions to close more deals this week. 
      Focus on Kenyan business culture (relationship building, follow-ups).
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "No insights available.";
  } catch (error) {
    return "AI Insights currently unavailable.";
  }
};

export const qualifyLead = async (name: string, company: string, notes: string, value: number) => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Act as a Senior Sales Director. Perform a deep BANT (Budget, Authority, Need, Timeline) analysis on this lead.
      
      Lead: ${name} from ${company}
      Deal Value: KES ${value}
      Notes: ${notes}

      Return a JSON object with NO markdown:
      {
        "score": number (0-100),
        "summary": "One sentence summary.",
        "strengths": ["string", "string"],
        "weaknesses": ["string", "string"],
        "bant_breakdown": {
            "budget": "High/Medium/Low",
            "authority": "Direct/Influencer/Gatekeeper",
            "need": "Critical/Nice-to-have",
            "timeline": "Immediate/Quarterly/Long-term"
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Qualification error", error);
    return { score: 50, summary: "AI analysis failed, manual review required.", strengths: [], weaknesses: [] };
  }
};

export const generateFollowUpStrategy = async (name: string, company: string, stage: string, lastContact: string, notes: string) => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a Sales Coach. Generate a follow-up strategy for this lead.
      
      Lead: ${name} from ${company}
      Current Stage: ${stage}
      Last Contact: ${lastContact}
      Notes: ${notes}

      Output strict JSON:
      {
        "suggested_action": "Email/Call/Meeting",
        "rationale": "Why this action now?",
        "email_draft": "Subject line and body for a short, punchy email.",
        "sms_draft": "Short WhatsApp/SMS message (under 20 words)."
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { suggested_action: "Review", rationale: "AI Offline", email_draft: "", sms_draft: "" };
  }
};

export const generateLeads = async (industry: string, location: string, useMaps: boolean = false, quantity: number = 5) => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Configure tools based on mode
    // Maps grounding is excellent for physical businesses, Search for digital/service presence
    const tools = useMaps ? [{ googleMaps: {} }] : [{ googleSearch: {} }];
    
    const prompt = `
      ROLE: Enterprise Sales Development Representative.
      TASK: Scout for ${quantity} high-potential B2B verified leads in the "${industry}" sector located in "${location}".
      
      STRATEGY:
      ${useMaps 
        ? 'USE GOOGLE MAPS to find physical businesses. Verify they are open and have a high rating.' 
        : 'SCRAPE THE WEB for official company websites, and attempt to find social profiles (LinkedIn, Twitter) and specific contact details.'
      }
      
      CRITERIA:
      1. Must be an active operating business.
      2. Prioritize businesses with reachable contact methods.
      3. Try to find the specific contact person if possible.

      OUTPUT FORMAT:
      Return ONLY a JSON Array with this exact structure (no markdown code blocks, just raw JSON):
      [
        {
          "company": "Official Business Name",
          "contact": "Contact Person or 'Procurement Team'",
          "email": "Email address (or 'N/A')",
          "phone": "Phone number (or 'N/A')",
          "website": "Website URL (or 'N/A')",
          "address": "Physical Address",
          "socials": {
             "linkedin": "URL or N/A",
             "twitter": "URL or N/A"
          },
          "value": 50000,
          "rationale": "Why this is a good lead based on search results.",
          "growth_potential": "High/Medium/Low - Brief reason",
          "risk_assessment": "Low/Medium/High - Brief reason"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: tools,
      }
    });

    let text = response.text || "[]";
    
    // Extract grounding metadata (sources)
    let sources: any[] = [];
    
    // Handle Maps or Web Grounding extraction
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        sources = groundingChunks
            .filter((c: any) => c.web?.uri || c.web?.title)
            .map((c: any) => ({
                title: c.web?.title || 'Verified Source',
                uri: c.web?.uri || '#'
            }));
    }

    // Cleanup JSON
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const jsonString = jsonMatch ? jsonMatch[0] : "[]";
    
    const leads = JSON.parse(jsonString);

    return { leads, sources };

  } catch (error) {
    console.error("Lead Gen error", error);
    return { leads: [], sources: [] };
  }
};

export const analyzeBusinessForCatalogue = async (businessName: string, url: string, additionalInfo: string) => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Highly specific prompt to prevent hallucination and force grounding
    const prompt = `
      ROLE: Specialist Product Catalogue Data Extractor.
      TARGET: "${businessName}" ${url ? `at URL: ${url}` : ''}
      CONTEXT: ${additionalInfo}
      
      INSTRUCTIONS:
      1. SEARCH Google for "${businessName} Kenya products services" to identify their ACTUAL offerings.
      2. VERIFY specific items found on their website or social media snippets.
      3. IF exact prices are not found, ESTIMATE realistic Kenyan market rates (KES) for those specific items.
      4. IF the business is NOT found, generate 4 generic but highly relevant items for that *exact* industry context.
      
      STRICT OUTPUT RULES:
      - Return ONLY a raw JSON Array.
      - NO Markdown code blocks (no \`\`\`json).
      - NO intro/outro text.
      
      REQUIRED JSON SCHEMA:
      [
        {
          "name": "Short Item Name",
          "description": "Specific details (max 12 words)",
          "price": 1500,
          "category": "Product" or "Service"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        // Search Grounding enabled to fetch real data
        tools: [{ googleSearch: {} }], 
      },
    });

    let text = response.text || "[]";
    
    // Aggressive cleanup to handle model chatty-ness
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Find the array bracket to bracket
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const jsonString = jsonMatch ? jsonMatch[0] : "[]";
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Catalogue Analysis error", error);
    return [];
  }
};

export const generatePaymentReminder = async (
  clientName: string,
  amount: number,
  invoiceNumber: string,
  daysOverdue: number
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Draft a polite but firm Telegram message for a Kenyan client named "${clientName}".
      
      Context:
      - Invoice: #${invoiceNumber}
      - Amount Due: KES ${amount.toLocaleString()}
      - Status: ${daysOverdue} days overdue
      
      Tone: Professional, preserving the relationship ("Undugu"), but emphasizing urgency. 
      Mention that M-Pesa payment is preferred for immediate settlement.
      Keep it under 60 words.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Hello, checking in on the invoice payment.";
  } catch (error) {
    return "Error generating reminder.";
  }
};