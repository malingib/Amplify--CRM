
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
      Act as a Senior Sales Director. Analyze this lead based on BANT (Budget, Authority, Need, Timeline).
      
      Lead: ${name} from ${company}
      Deal Value: KES ${value}
      Notes: ${notes}

      Return a JSON object with NO markdown formatting:
      {
        "score": number (0-100),
        "summary": "One sentence explanation of the score."
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    const text = response.text || "{}";
    // Clean cleanup code block markers if present
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Qualification error", error);
    return { score: 50, summary: "AI analysis failed, manual review required." };
  }
};

export const generateLeads = async (industry: string, location: string) => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Generate 3 fictional but realistic B2B leads for a CRM system in Kenya.
      Target Industry: ${industry}
      Target Location: ${location}
      
      Return a JSON array with NO markdown formatting. Each object should look like:
      {
        "name": "Full Name",
        "company": "Company Name Ltd",
        "email": "email@company.co.ke",
        "value": number (between 50000 and 500000),
        "notes": "Brief context on what they need"
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    const text = response.text || "[]";
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Lead Gen error", error);
    return [];
  }
};