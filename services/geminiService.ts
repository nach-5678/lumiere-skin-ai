
import { GoogleGenAI, Type, Schema, Modality, Chat } from "@google/genai";
import { SkinAnalysisResult, ClinicResult, SmartShelfItem, MedicalProfile, CycleTracker } from "../types";
import { getHistoricalScansAnalysis } from "./storageService";

const SYSTEM_INSTRUCTION = `
You are Lumière, a world-class AI Dermatologist producing a professional clinical report.

**CRITICAL RULE: ALL OUTPUT MUST BE IN ENGLISH LANGUAGE ONLY.**

Analyze the image and provide a JSON response. 

**Structure & Depth Requirements:**

1. **Clinical Analysis**:
   - **Skin Type**: Precise classification (Oily, Dry, etc). Compare visual evidence with user's self-reported type if provided.
   - **Detailed Metrics**: 0-100 scores for Barrier, Oil, Pigmentation, Texture, Elasticity.
   - **Zone Analysis**: Forehead, Cheeks, Nose, Chin, Under-eyes.
   
2. **Professional Classifications**:
   - Fitzpatrick (I-VI), Glogau (I-IV), Baumann.

3. **Concerns**:
   - Name, Severity, Medical Overview, Visual Indicators, Risk Factors, Coordinates (box).
   - **COORDINATES RULE**: Provide extremely TIGHT bounding box [ymin, xmin, ymax, xmax] normalized to 0-1000. The bounding box MUST exactly wrap the visible issue (e.g., the exact perimeter of a pimple or scar). Do NOT draw large generalized boxes. The image coordinate system has [0,0] at the top-left and [1000,1000] at the bottom-right. Y is the vertical axis (top to bottom), X is the horizontal axis (left to right).
   - **PRECISE LOCATION**: Provide the exact center point [y, x] normalized to 0-1000 for the specific issue. For pimples, this should be the exact head/center of the pimple. For scars, the exact center of the scar.
   - **CRITICAL**: Be highly accurate. Identify specific individual pimples, acne spots, and scars. Pay special attention to small details like individual pimples and subtle scars. Do not just point to a general region. If there are multiple pimples or scars, you MUST list them as separate concerns in the array, each with its own precise location. Ensure the coordinates precisely match the visual location of the issue on the skin. Ignore background, hair, or clothes.

4. **Routine & Products**:
   - Provide a comprehensive list of products (Indian Market). You MUST provide AT LEAST 3 distinct products for EACH of the following categories: 'Cleanser', 'Toner', 'Treatment', 'Moisturizer', 'Sunscreen'. This is a strict requirement.
   - Include 'Reason' linking ingredient to skin issue.
   - For EACH category, mark exactly one product as 'isTopPick' (the absolute best product for the user's specific problems in that category).

5. **Advanced Science (Crucial for "World's Best" status)**:
   - **Ingredient Science**: Map 3 key ingredients from the recommended routine to specific biological mechanisms (e.g., "Retinol -> Increases cell turnover -> Reduces fine lines").
   - **Recovery Timeline**: 4 distinct phases (Weeks 1-2, 3-4, 5-8, 9-12) describing exactly what the user will feel/see (e.g., "Purging phase", "Barrier strengthening").
   - **Clinical Treatments**: Suggest 2-3 in-clinic procedures (e.g., "Chemical Peel", "Laser") that would help their specific severity. Estimate price in INR/USD and downtime.

6. **Report Metadata**:
   - Scan Quality, Red Flags, Lifestyle Impact.

**Tone**: Professional, empathetic, but easy to understand for a non-medical user. Avoid overly complex medical jargon where simple terms work.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    skinType: { type: Type.STRING, enum: ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'] },
    summary: { type: Type.STRING },
    confidenceScore: { type: Type.NUMBER },
    healthScore: { type: Type.NUMBER },
    concerns: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          description: { type: Type.STRING },
          clinicalOverview: { type: Type.STRING },
          visualIndicators: { type: Type.STRING },
          riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
          coordinates: { 
            type: Type.ARRAY, 
            items: { type: Type.NUMBER }
          },
          preciseLocation: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
            description: "Center point [y, x] normalized to 0-1000"
          }
        },
        required: ['name', 'severity', 'description', 'clinicalOverview', 'visualIndicators', 'riskFactors']
      }
    },
    routine: {
      type: Type.OBJECT,
      properties: {
        morning: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              step: { type: Type.STRING },
              productType: { type: Type.STRING },
              instruction: { type: Type.STRING }
            },
            required: ['step', 'productType', 'instruction']
          }
        },
        evening: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              step: { type: Type.STRING },
              productType: { type: Type.STRING },
              instruction: { type: Type.STRING }
            },
            required: ['step', 'productType', 'instruction']
          }
        },
        weekly: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              step: { type: Type.STRING },
              productType: { type: Type.STRING },
              instruction: { type: Type.STRING }
            },
            required: ['step', 'productType', 'instruction']
          }
        },
      },
      required: ['morning', 'evening', 'weekly']
    },
    products: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING },
          category: { type: Type.STRING, enum: ['Cleanser', 'Toner', 'Treatment', 'Moisturizer', 'Sunscreen', 'Other'] },
          description: { type: Type.STRING },
          keyIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          reason: { type: Type.STRING },
          isTopPick: { type: Type.BOOLEAN },
          estimatedPrice: { type: Type.NUMBER, description: "Estimated price in INR (Rupees)" },
          priceRange: { type: Type.STRING, enum: ['₹', '₹₹', '₹₹₹'], description: "Budget class" }
        },
        required: ['name', 'type', 'category', 'description', 'keyIngredients', 'reason', 'estimatedPrice', 'priceRange']
      }
    },
    dailyTips: { type: Type.ARRAY, items: { type: Type.STRING } },
    reportData: {
      type: Type.OBJECT,
      properties: {
        barrierHealth: { type: Type.NUMBER },
        oilBalance: { type: Type.NUMBER },
        pigmentationScore: { type: Type.NUMBER },
        poreScore: { type: Type.NUMBER },
        metricsBreakdown: {
           type: Type.ARRAY,
           items: {
               type: Type.OBJECT,
               properties: {
                   name: { type: Type.STRING },
                   score: { type: Type.NUMBER },
                   status: { type: Type.STRING },
                   advice: { type: Type.STRING }
               },
               required: ['name', 'score', 'status', 'advice']
           }
        },
        scanQuality: { type: Type.NUMBER },
        zones: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              zone: { type: Type.STRING },
              condition: { type: Type.STRING },
              score: { type: Type.NUMBER }
            }
          }
        },
        ingredientScience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    ingredient: { type: Type.STRING },
                    targetConcern: { type: Type.STRING },
                    mechanism: { type: Type.STRING },
                    scientificBenefit: { type: Type.STRING }
                },
                required: ['ingredient', 'targetConcern', 'mechanism', 'scientificBenefit']
            }
        },
        recoveryTimeline: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    phase: { type: Type.STRING },
                    whatToExpect: { type: Type.STRING },
                    focus: { type: Type.STRING }
                },
                required: ['phase', 'whatToExpect', 'focus']
            }
        },
        clinicalTreatments: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    relevance: { type: Type.STRING },
                    estimatedCost: { type: Type.STRING },
                    downtime: { type: Type.STRING }
                },
                required: ['name', 'relevance', 'estimatedCost', 'downtime']
            }
        },
        lifestyleImpact: { type: Type.ARRAY, items: { type: Type.STRING } },
        redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
        fitzpatrickType: { type: Type.STRING },
        glogauScale: { type: Type.STRING },
        baumannType: { type: Type.STRING }
      },
      required: ['metricsBreakdown', 'ingredientScience', 'recoveryTimeline', 'clinicalTreatments', 'scanQuality', 'zones', 'lifestyleImpact', 'redFlags', 'fitzpatrickType', 'glogauScale', 'baumannType']
    }
  },
  required: ['skinType', 'summary', 'healthScore', 'concerns', 'routine', 'products', 'dailyTips', 'reportData']
};

// Helper to clean JSON string from Markdown code blocks or extraneous text
const cleanJsonString = (text: string): string => {
  let cleaned = text.trim();
  const jsonBlockMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
      cleaned = jsonBlockMatch[1];
  } else {
      const firstOpen = cleaned.indexOf('{');
      const lastClose = cleaned.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
          cleaned = cleaned.substring(firstOpen, lastClose + 1);
      }
  }
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  cleaned = cleaned.replace(/}\s*{/g, '}, {');
  return cleaned;
};

export const analyzeSkinImage = async (base64Image: string, medicalProfile?: MedicalProfile, selfReportedSkinType?: string, cycleTracker?: CycleTracker, budgetPreference?: string): Promise<SkinAnalysisResult> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/.+;base64,/, '');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct dynamic medical constraints
    let medicalContext = "";
    
    if (budgetPreference) {
        medicalContext += `\n\n**BUDGET PREFERENCE:** ${budgetPreference}. Ensure product recommendations align with this budget class (budget: <₹500, mid-range: ₹500-₹1500, luxury: >₹1500).`;
    }
    
    // Inject self-reported skin type
    if (selfReportedSkinType) {
        medicalContext += `\n\n**USER SELF-REPORTED SKIN TYPE:** ${selfReportedSkinType}. Check if visual evidence confirms this. If contradictory, trust visual evidence but note discrepancy.`;
    }

    if (medicalProfile) {
        const contraindications = [];
        if (medicalProfile.isPregnant || medicalProfile.isBreastfeeding) contraindications.push("NO Retinoids, NO Hydroquinone, NO High-dose Salicylic Acid");
        if (medicalProfile.onAccutane) contraindications.push("NO Exfoliants, NO Actives, Focus on Barrier Repair & Hydration Only");
        if (medicalProfile.hasNutAllergy) contraindications.push("NO Nut Oils (Almond, Macadamia, etc)");
        if (medicalProfile.hasAspirinAllergy) contraindications.push("NO Salicylic Acid");
        if (medicalProfile.isSensitive) contraindications.push("NO Fragrance, Low Alcohol");

        if (contraindications.length > 0) {
            medicalContext += `\n\n**MEDICAL SAFETY CONTRAINDICATIONS (STRICTLY ENFORCE):**\n${contraindications.join('\n')}\n`;
        }
    }

    if (cycleTracker && cycleTracker.isTracking) {
        const lastPeriod = new Date(cycleTracker.lastPeriodDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastPeriod.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const currentDayOfCycle = (diffDays % cycleTracker.averageCycleLength) + 1;
        const daysUntilNextPeriod = cycleTracker.averageCycleLength - currentDayOfCycle;
        
        medicalContext += `\n\n**HORMONAL/MENSTRUAL CYCLE SYNC:** The user is currently on day ${currentDayOfCycle} of their ${cycleTracker.averageCycleLength}-day menstrual cycle. Their next period is expected in ${daysUntilNextPeriod} days.`;
        
        if (daysUntilNextPeriod <= 7) {
            medicalContext += `\n**CRITICAL PREDICTION:** The user is in the luteal phase (pre-menstrual). Hormonal acne flare-ups on the chin and jawline are highly likely in the coming days due to increased sebum production. You MUST explicitly predict this in the summary or concerns, and proactively adjust their routine (e.g., recommend starting Salicylic Acid or a spot treatment today to prevent the breakout).`;
        } else if (currentDayOfCycle <= 7) {
            medicalContext += `\n**CYCLE PHASE:** The user is in the menstrual phase. Skin may be more sensitive and dry. Focus on hydration and barrier support.`;
        } else if (currentDayOfCycle > 7 && currentDayOfCycle <= 14) {
            medicalContext += `\n**CYCLE PHASE:** The user is in the follicular phase. Skin is typically at its best. Good time for active ingredients and exfoliation.`;
        }
    }

    // Fetch history for consistency and accurate scoring
    try {
        const history = await getHistoricalScansAnalysis(5);
        if (history && history.length > 0) {
            const latestScan = history[0];
            const recentDate = new Date(latestScan.timestamp);
            const today = new Date();
            const isSameDay = recentDate.getDate() === today.getDate() && 
                              recentDate.getMonth() === today.getMonth() && 
                              recentDate.getFullYear() === today.getFullYear();
            
            const prev = latestScan.analysis;
            
            if (isSameDay) {
                medicalContext += `\n\n**CRITICAL: SAME-DAY SCAN CONSISTENCY:** The user has already scanned their face today. To ensure a stable and trustworthy experience, you MUST maintain high consistency with their previous scan from today. Do NOT invent new skin issues, change the severity of existing issues randomly, or completely change the product recommendations unless there is an undeniable, massive visual difference. \n\nHere is the data from their previous scan today:\n- Skin Type: ${prev.skinType}\n- Score: ${latestScan.score}\n- Concerns: ${JSON.stringify(prev.concerns.map(c => ({name: c.name, severity: c.severity})))}\n- Routine: ${JSON.stringify(prev.routine)}\n- Products: ${JSON.stringify(prev.products.map(p => p.name))}\n\nBase your new analysis heavily on this previous data to provide an ID-accurate, highly consistent result.`;
            } else {
                medicalContext += `\n\n**USER SCAN HISTORY:** The user has scanned their face previously. Their last scan was on ${recentDate.toLocaleDateString()}. \n\nHere is the data from their last scan:\n- Skin Type: ${prev.skinType}\n- Score: ${latestScan.score}\n- Concerns: ${JSON.stringify(prev.concerns.map(c => ({name: c.name, severity: c.severity})))}\n\nPlease use this history to provide an ID-accurate analysis. Track the progress of these specific concerns if they are still visible, and maintain consistency in your overall assessment unless there are clear visual changes.`;
            }

            if (history.length > 1) {
                const historicalScores = history.map(h => ({ date: new Date(h.timestamp).toLocaleDateString(), score: h.score }));
                medicalContext += `\n\n**HISTORICAL SCORE TREND:** Here are the user's past skin health scores: ${JSON.stringify(historicalScores)}. \n\n**CRITICAL SCORING INSTRUCTION:** The skin health score MUST reflect actual visual changes compared to historical data. If the skin shows improvement (fewer defects, reduced severity), the score MUST increase. If the skin is worse, the score MUST decrease. Do NOT give the exact same score as the previous scan unless the skin condition is absolutely identical. Calculate the new score dynamically based on the delta of defects.`;
            }
        }
    } catch (e) {
        console.warn("Could not fetch scan history for context", e);
    }

    console.log("Starting skin analysis...");
    const startTime = Date.now();
    const selectedModel = localStorage.getItem('lumiere_model') || 'gemini-3.1-pro-preview';
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: `Analyze this face for skin health. ${medicalContext} Provide a valid JSON response matching the schema exactly.` }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + medicalContext,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      }
    });
    console.log(`Skin analysis completed in ${Date.now() - startTime}ms`);

    if (response.text) {
      const cleanedText = cleanJsonString(response.text);
      let data;
      try {
        data = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error("Failed to parse analysis results. Please try again.");
      }
      
      if (!data.reportData.metricsBreakdown) {
          data.reportData.metricsBreakdown = [
              { name: 'Barrier Health', score: 50, status: 'N/A', advice: 'Maintain a healthy skin barrier.' }
          ];
      }
      
      data.reportData = {
          ...data.reportData,
          reportId: `RPT-${Math.floor(Math.random() * 1000000)}`,
          analysisVersion: "Lumière AI v3.5 Pro",
      };
      return data as SkinAnalysisResult;
    }
    throw new Error("No analysis result returned from model");
  } catch (error) {
    console.error("Skin analysis error:", error);
    throw error;
  }
};

export const findNearbyClinics = async (lat: number, lng: number, concerns: string[]): Promise<ClinicResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Find highly rated dermatologist clinics or skin specialists near me to help with: ${concerns.join(', ')}. 
  
  Format the output as a clear list. For each clinic, provide:
  * Name
  * Address
  * Phone Number (if available)
  * Opening Hours (if available)

  Do not provide conversational filler. Just the list.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng }
        }
      }
    },
  });

  const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text || "Here are some specialists nearby.",
    links: links as any
  };
};

export const findClinicsByCity = async (city: string, concerns: string[]): Promise<ClinicResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Find highly rated dermatologist clinics or skin specialists in ${city} to help with: ${concerns.join(', ')}. 
  
  Format the output as a clear list. For each clinic, provide:
  * Name
  * Address
  * Phone Number (if available)
  * Opening Hours (if available)

  Do not provide conversational filler. Just the list.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
    },
  });

  const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text || `Here are some specialists in ${city}.`,
    links: links as any
  };
};

export const createDrLumiereChat = (result: SkinAnalysisResult): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemContext = `
    You are Dr. Lumière, a world-class AI Dermatologist.
    You have just analyzed the user's skin and here is the report:
    
    PATIENT ANALYSIS:
    - Skin Type: ${result.skinType}
    - Score: ${result.healthScore}/100
    - Main Concerns: ${result.concerns.map(c => c.name).join(', ')}
    
    FULL DATA: ${JSON.stringify(result)}
    
    Your role is to answer follow-up questions, explain the routine, and clarify ingredients.
    - Be empathetic and professional.
    - **EXTREMELY IMPORTANT**: When you mention a specific product name or ingredient that can be bought, **ALWAYS wrap it in square brackets like this: [CeraVe Foaming Cleanser]**. This allows me to create a shopping link for the user.
    - If they ask about a specific product in the routine, explain why it was chosen based on the "reason" field.
    - Keep responses concise (under 3 paragraphs) unless asked for deep detail.
    - Use formatting (bolding, lists) to make text readable.
  `;

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: systemContext,
    }
  });
};

let healedImageCache: { original: string, healed: string } | null = null;

export const getCachedHealedSkin = (base64Image: string): string | null => {
  if (healedImageCache && healedImageCache.original === base64Image) {
    return healedImageCache.healed;
  }
  return null;
};

export const generateHealedSkin = async (base64Image: string): Promise<string> => {
  if (healedImageCache && healedImageCache.original === base64Image) {
    console.log("Returning cached healed image");
    return healedImageCache.healed;
  }

  console.log("Starting healed skin generation...");
  const startTime = Date.now();
  const cleanBase64 = base64Image.replace(/^data:image\/.+;base64,/, '');
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const retouchPrompt = `
    Act as a professional high-end photo retoucher and dermatological AI.
    I will provide an image of a person.
    Your goal is to apply dermatological improvements to the skin while strictly preserving the person's identity, facial structure, lighting, and background.

    STRICT GUIDELINES:
    1.  **Identity Lock**: Do not change the shape of the eyes, nose, lips, or jawline. Do not change the hair or clothing. The background must remain exactly as it is.
    2.  **Texture Preservation**: Do not airbrush the skin into a blur. Keep skin pores and natural texture visible.
    3.  **Targeted Healing**:
        -   Detect acne, active pimples, redness, and inflammation. Completely heal active pimples and reduce redness by blending them seamlessly with the surrounding healthy skin tone.
        -   Reduce hyperpigmentation, acne scars, and dark spots significantly, making the skin look clear and healthy, but do not remove permanent features like moles or freckles.
        -   Do NOT change the overall skin color tone globally.
    4.  **Realism**: The output should look like a raw, unedited photograph of the same person with clear, healed skin, not a beauty filter. Avoid the "plastic skin" look. The lighting and shadows must match the original image perfectly.

    Return only the modified image showcasing realistic healed skin that preserves all facial and background elements as they are but just changes the facial issues.
  `;

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
            { text: retouchPrompt },
          ]
        }
      });
      console.log(`Healed skin generation completed in ${Date.now() - startTime}ms`);

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const generatedImage = `data:image/png;base64,${part.inlineData.data}`;
          healedImageCache = { original: base64Image, healed: generatedImage };
          return generatedImage;
        }
      }
  } catch (error) {
      console.error("Healed skin generation failed:", error);
      throw error;
  }
  
  throw new Error("No image generated");
};

export const analyzeShelfProduct = async (base64Image: string, recommendedContext: string): Promise<SmartShelfItem> => {
    const cleanBase64 = base64Image.replace(/^data:image\/.+;base64,/, '');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        Analyze this image of a skincare product bottle.
        
        1. Identify the Product Name and Type.
        2. Identify key active ingredients (e.g. Retinol, Salicylic Acid, Vitamin C).
        3. Compare these ingredients against the user's recommended routine context provided below.
        4. Determine if there is a CONFLICT (e.g. mixing Retinol with Vitamin C, or using too many exfoliants).
        
        RECOMMENDED ROUTINE CONTEXT:
        ${recommendedContext}

        Return strictly valid JSON:
        {
            "productName": "string",
            "type": "string",
            "activeIngredients": ["string", "string"],
            "isCompatible": boolean,
            "conflictReason": "string or null if compatible",
            "usageAdvice": "string (e.g. 'Use on alternate nights')"
        }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                { text: prompt }
            ]
        },
        config: {
            responseMimeType: "application/json"
        }
    });

    if (response.text) {
        const cleaned = cleanJsonString(response.text);
        const data = JSON.parse(cleaned);
        return {
            id: Date.now().toString(),
            image: base64Image,
            ...data
        };
    }
    throw new Error("Failed to analyze product");
};

export const speakSummary = async (text: string): Promise<ArrayBuffer> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say gently and simply: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};
