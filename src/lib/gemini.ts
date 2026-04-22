import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini AI library
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Utility to identify food from an image
export const identifyFoodFromImage = async (base64Image: string, userProfile: any) => {
  const prompt = `
    Analyze this image of food. 
    1. Identify the dish/food item.
    2. Estimate nutritional values (calories, protein, carbs, fat) based on a typical serving size.
    3. Return valid JSON only with this structure:
    {
      "name": "Food Name",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "servingSize": 0
    }
    Don't include any markdown or backticks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            { 
              inlineData: { 
                mimeType: "image/jpeg", 
                data: base64Image 
              } 
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

// Utility to get nutrition advice for a scanned item
export const getScanAdvice = async (menuItem: any, userProfile: any, todayLogs: any[]) => {

  const totalConsumed = todayLogs.reduce((acc, log) => ({
    calories: acc.calories + (log.calories * (log.quantity || 1)),
    protein: acc.protein + (log.protein * (log.quantity || 1)),
    carbs: acc.carbs + (log.carbs * (log.quantity || 1)),
    fat: acc.fat + (log.fat * (log.quantity || 1)),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const remaining = {
    calories: userProfile.dailyCalorieTarget - totalConsumed.calories,
  };

  const prompt = `
    You are LUMINA SCAN, an expert Indonesian nutrition coach. 
    Personality: ${userProfile.aiPersonality}.
    User Goal: ${userProfile.dietGoal}.
    Target: ${userProfile.dailyCalorieTarget} kcal.
    Consumed Today: ${totalConsumed.calories} kcal.
    Remaining: ${remaining.calories} kcal.

    User just scanned: ${menuItem.name}
    Nutrition: ${menuItem.calories} kcal, ${menuItem.protein}g protein, ${menuItem.carbs}g carbs, ${menuItem.fat}g fat.

    Response in Indonesian. 
    Use clear, short sections. 
    - VERDICT: [Safe/Caution/Avoid] (1 word)
    - ANALYSIS: Why? (max 2 sentences)
    - ADVICE: Action. (max 2 sentences)
    - TIP: Pro-tip. (max 1 sentence)
    
    Avoid flowery language. Keep it professional and minimalist.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Scan Error:", error);
    throw error;
  }
};

