import express from 'express';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment. Gemini features will require the key.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Model categories per Gemini guidelines
// Complex tasks & High Thinking: 'gemini-3.1-pro-preview'
// General tasks & Search Grounding: 'gemini-3.5-flash'
// Fast tasks: 'gemini-3.1-flash-lite'
const DEFAULT_FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-flash-latest'];

async function callGenAIWithRetry<T>(
  action: (modelName: string) => Promise<T>,
  models: string[] = DEFAULT_FALLBACK_MODELS,
  maxRetriesPerModel: number = 2
): Promise<T> {
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < maxRetriesPerModel; attempt++) {
      try {
        return await action(model);
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('429') ||
          errMsg.includes('404') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('quota') ||
          errMsg.includes('rate-limit') ||
          errMsg.includes('overloaded') ||
          errMsg.includes('not found');

        console.warn(`[Gemini API] Model ${model} (attempt ${attempt + 1}) encountered: ${errMsg}`);

        if (isTransient && attempt < maxRetriesPerModel - 1) {
          const delayMs = (attempt + 1) * 800;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          // Switch to next candidate model in list
          break;
        }
      }
    }
  }

  throw lastError || new Error('All Gemini models are temporarily experiencing high demand. Please try again shortly.');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Agro-Botanist Leaf Diagnosis Endpoint
  app.post('/api/analyze-plant', async (req, res) => {
    try {
      const { 
        imageBase64, 
        mimeType = 'image/jpeg', 
        languagePreference = 'both', 
        additionalNotes = '',
        mode = 'general' // 'fast' | 'general' | 'deep_thinking'
      } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      // Clean base64 string
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const ai = getAIClient();

      const systemInstruction = `You are an expert Agro-Botanist and AI Tree Doctor for VANANSH.
Your task is to analyze photos of plant/tree leaves, diagnose any health issues (diseases, fungal infections, bacterial blights, pest damages, nutrient deficiencies like nitrogen/iron/potassium, overwatering/underwatering stress), and provide precise care instructions regarding watering, fertilization, and treatments.

Guidelines:
1. Always keep explanations simple, practical, and easy to understand for non-experts, farmers, and home gardeners.
2. Provide accurate common names in English and scientific names.
3. If the image is unclear, blurry, or not a plant/leaf, set "is_healthy" to false and explain the issue clearly in "description".
4. Provide actionable, practical organic and mineral fertilizer dosages and specific watering tips.

Analyze the image provided and output your response STRICTLY in valid JSON format matching this exact schema:
{
  "plant_info": {
    "name_english": "Common Name in English",
    "scientific_name": "Scientific Name"
  },
  "health_status": {
    "is_healthy": true,
    "condition_name": "Name of Disease/Deficiency or Healthy",
    "symptoms": ["Symptom 1", "Symptom 2"],
    "description": "Brief description of the plant's health condition."
  },
  "water_requirement": {
    "frequency": "e.g., Every 2-3 days",
    "quantity": "e.g., 500ml or until soil is moist",
    "instructions": "Specific watering advice (e.g., water only when topsoil is dry)."
  },
  "fertilizer_requirement": {
    "recommended_type": "e.g., Organic Vermicompost / NPK 19-19-19",
    "dosage_and_frequency": "e.g., 100g once every month",
    "application_method": "How to apply the fertilizer."
  },
  "care_and_treatment": [
    "Step 1 to treat or care for the plant",
    "Step 2 to treat or care for the plant"
  ]
}`;

      const userPrompt = `Please perform a thorough botanical diagnosis on this plant/tree leaf photo.
${additionalNotes ? `Additional user observation: "${additionalNotes}"` : ''}

Output strictly valid JSON matching the requested structure.`;

      // Select candidate models based on mode
      let targetModels: string[];
      let useThinking = false;

      if (mode === 'deep_thinking') {
        targetModels = ['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
        useThinking = true;
      } else if (mode === 'fast') {
        targetModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash'];
      } else {
        // general
        targetModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.7-flash'];
      }

      const response = await callGenAIWithRetry(async (modelName) => {
        const config: any = {
          systemInstruction,
          responseMimeType: 'application/json',
        };

        // Enable high thinking on gemini-3.1-pro-preview when deep reasoning requested
        if (useThinking && modelName.includes('pro')) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
          // Do not set maxOutputTokens with thinkingLevel
        } else {
          config.temperature = 0.2;
        }

        return await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: userPrompt,
                },
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          config,
        });
      }, targetModels);

      const responseText = response.text?.trim() || '{}';
      
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        // Attempt markdown code block extraction if raw JSON parsing fails
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            parsedData = JSON.parse(jsonMatch[1]);
          } catch (e2) {
            const firstBrace = jsonMatch[1].indexOf('{');
            const lastBrace = jsonMatch[1].lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
              parsedData = JSON.parse(jsonMatch[1].substring(firstBrace, lastBrace + 1));
            }
          }
        } else {
          const firstBrace = responseText.indexOf('{');
          const lastBrace = responseText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            parsedData = JSON.parse(responseText.substring(firstBrace, lastBrace + 1));
          } else {
            throw new Error('Could not parse clinical botanical diagnosis response from model.');
          }
        }
      }

      // Sanitize and guarantee all expected schema fields exist
      const sanitizedData = {
        plant_info: {
          name_english: parsedData.plant_info?.name_english || parsedData.plant_info?.common_name || 'Diagnosed Plant',
          scientific_name: parsedData.plant_info?.scientific_name || 'Botanical specimen',
        },
        health_status: {
          is_healthy: typeof parsedData.health_status?.is_healthy === 'boolean' ? parsedData.health_status.is_healthy : true,
          condition_name: parsedData.health_status?.condition_name || (parsedData.health_status?.is_healthy ? 'Healthy Foliage' : 'Botanical Condition Detected'),
          symptoms: Array.isArray(parsedData.health_status?.symptoms) && parsedData.health_status.symptoms.length > 0
            ? parsedData.health_status.symptoms
            : ['No severe visual leaf lesions detected.'],
          description: parsedData.health_status?.description || 'Leaf sample analyzed with no acute distress observed.',
        },
        water_requirement: {
          frequency: parsedData.water_requirement?.frequency || 'Every 2-3 days (when topsoil is dry)',
          quantity: parsedData.water_requirement?.quantity || 'Moderate watering (until moist)',
          instructions: parsedData.water_requirement?.instructions || 'Check soil moisture 2 inches down before watering.',
        },
        fertilizer_requirement: {
          recommended_type: parsedData.fertilizer_requirement?.recommended_type || 'Organic Compost / Balanced NPK 19-19-19',
          dosage_and_frequency: parsedData.fertilizer_requirement?.dosage_and_frequency || 'Apply once a month during active growth',
          application_method: parsedData.fertilizer_requirement?.application_method || 'Apply around drip-line perimeter and mix lightly with soil.',
        },
        care_and_treatment: Array.isArray(parsedData.care_and_treatment) && parsedData.care_and_treatment.length > 0
          ? parsedData.care_and_treatment
          : [
              'Inspect plant foliage weekly for any changes in coloration or spotting.',
              'Ensure adequate sunlight exposure and well-draining soil aeration.',
              'Maintain consistent watering without waterlogging the root zone.'
            ],
      };

      res.json({
        success: true,
        data: sanitizedData,
      });
    } catch (error: any) {
      console.error('Error analyzing plant:', error);
      
      const errMsg = error?.message || '';
      const isQuotaOrDemand =
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('quota');

      const userFriendlyMessage = isQuotaOrDemand
        ? 'The AI vision engine is currently experiencing high demand or temporary rate limits. Please try scanning again in a few moments.'
        : error.message || 'Failed to analyze plant photo';

      res.status(503).json({
        error: userFriendlyMessage,
        isTransient: isQuotaOrDemand,
      });
    }
  });

  // Agro-Botanist Multi-turn Chatbot with Search Grounding and High Thinking
  app.post('/api/botanist-chat', async (req, res) => {
    try {
      const { 
        messages = [], 
        imageBase64,
        chatMode = 'grounded' // 'grounded' (gemini-3.5-flash with search) | 'thinking' (gemini-3.1-pro-preview with ThinkingLevel.HIGH) | 'fast' (gemini-3.1-flash-lite)
      } = req.body;
      
      const ai = getAIClient();

      const systemInstruction = `You are Dr. Vriksha, a world-class AI Agro-Botanist, Tree Doctor, and Agricultural Extension Specialist for VANANSH.
You have deep expertise in:
- Plant Pathology, Leaf Disease Identification, Viral, Fungal, and Bacterial crop infections
- Tree Health, Trunk Care, Pruning, Grafting, Canopy Management
- Soil Health, NPK Balancing, Micronutrient Deficiencies (Iron Chlorosis, Zinc, Magnesium, Calcium)
- Organic Farming, Bio-pesticides (Neem oil spray, Jeevamrut, Dashparni ark, Panchagavya, Trichoderma, Beauveria bassiana)
- Modern Precision Watering, Drip Irrigation, Mulching, Weather-adaptive care
- Global and regional flora, horticulture, trees, and cash crops (Mango, Cotton, Sugarcane, Groundnut, Wheat, Guava, Citrus, Tomato, Rose, Chili, etc.)

Instructions:
1. Provide accurate, practical, and empathetic advice for farmers, tree lovers, and gardeners.
2. Respond clearly in English with practical advice.
3. Be structured with bullet points and step-by-step action items.`;

      // Format conversation history for Gemini API
      const contents = messages.map((m: any, idx: number) => {
        const parts: any[] = [{ text: m.content }];
        // If image attached in last user message
        if (idx === messages.length - 1 && imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          });
        }
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts,
        };
      });

      let candidateList: string[];
      let shouldSearch = false;
      let shouldThink = false;

      if (chatMode === 'thinking') {
        // High Thinking with gemini-3.1-pro-preview
        candidateList = ['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
        shouldThink = true;
      } else if (chatMode === 'fast') {
        // Fast with gemini-3.1-flash-lite
        candidateList = ['gemini-3.1-flash-lite', 'gemini-3.5-flash'];
      } else {
        // Search Grounded with gemini-3.5-flash (with googleSearch tool)
        candidateList = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.7-flash'];
        shouldSearch = true;
      }

      const response = await callGenAIWithRetry(async (modelName) => {
        const config: any = {
          systemInstruction,
        };

        if (shouldThink && modelName.includes('pro')) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
          // Do not set maxOutputTokens
        } else {
          config.temperature = 0.4;
        }

        if (shouldSearch) {
          config.tools = [{ googleSearch: {} }];
        }

        try {
          return await ai.models.generateContent({
            model: modelName,
            contents,
            config,
          });
        } catch (toolErr: any) {
          if (shouldSearch) {
            // If search tool fails or triggers rate-limit, fallback to standard generation without search
            console.warn(`[Gemini API] Retrying model ${modelName} without search tool`);
            const fallbackConfig = { ...config };
            delete fallbackConfig.tools;
            return await ai.models.generateContent({
              model: modelName,
              contents,
              config: fallbackConfig,
            });
          }
          throw toolErr;
        }
      }, candidateList);

      // Extract search grounding metadata if available
      const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = searchChunks
        .filter((chunk: any) => chunk.web?.uri)
        .map((chunk: any) => ({
          title: chunk.web?.title || 'Botanical Resource',
          url: chunk.web?.uri,
        }));

      res.json({
        success: true,
        reply: response.text || '',
        sources,
      });
    } catch (error: any) {
      console.error('Error in botanist chat:', error);
      const errMsg = error?.message || '';
      const isQuotaOrDemand =
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('quota');

      const userFriendlyMessage = isQuotaOrDemand
        ? 'Dr. Vriksha is currently experiencing high demand. Please try asking your question again in a few seconds.'
        : error.message || 'Chatbot encountered an error';

      res.status(503).json({
        error: userFriendlyMessage,
        isTransient: isQuotaOrDemand,
      });
    }
  });

  // AI Personalized Fertilizer & Soil Nutrient Plan Generator
  app.post('/api/fertilizer-ai', async (req, res) => {
    try {
      const { 
        cropName, 
        cropCategory, 
        soilType, 
        growthStage, 
        plantCount, 
        farmingType = 'organic', 
        specificIssues = '' 
      } = req.body;

      const ai = getAIClient();

      const prompt = `You are an expert Agronomist and Soil Nutrition Specialist for VANANSH.
Generate a tailored fertilizer and soil feeding schedule for the following crop parameters:
- Crop / Plant: ${cropName || cropCategory}
- Category: ${cropCategory}
- Soil Type: ${soilType || 'Loamy / Clay Loam'}
- Growth Stage: ${growthStage}
- Scale / Quantity: ${plantCount} plants/trees
- Approach: ${farmingType === 'organic' ? '100% Organic (Jeevamrut, Vermicompost, Bio-fertilizers)' : 'Integrated Nutrient Management (NPK + Organic base)'}
- Specific Observations / Deficiencies: ${specificIssues || 'None specified'}

Provide a structured plan with:
1. Primary base feeding (dosage, timing, application method)
2. Bio-stimulants / Micronutrient sprays (Zinc, Iron, Boron, Panchagavya, Jeevamrut)
3. Precautions & Soil moisture guidelines for optimal root absorption.
Format output cleanly in Markdown with bold headers and bullet points.`;

      const response = await callGenAIWithRetry(async (modelName) => {
        return await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: 'You are Dr. Vriksha Agricultural Soil & Nutrition Expert for VANANSH.',
            temperature: 0.3,
          },
        });
      }, ['gemini-3.5-flash', 'gemini-3.1-flash-lite']);

      res.json({
        success: true,
        plan: response.text || '',
      });
    } catch (error: any) {
      console.error('Error generating fertilizer plan:', error);
      res.status(500).json({
        error: error.message || 'Failed to generate fertilizer plan',
      });
    }
  });

  // Vite development middleware vs production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VANANSH - AI Tree Doctor server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

