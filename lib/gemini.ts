import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export interface ItemClassification {
  name: string;
  category: string;
  color: string;
  description: string;
}

/**
 * Convert image URI to base64 data
 * @param uri - Image URI
 * @returns Base64 encoded image data
 */
async function imageUriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      // Remove the data:image/...;base64, prefix
      const base64 = base64data.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate item classification using Google Gemini AI with image
 * @param imageUri - Required image URI to analyze
 * @returns Generated item classification
 */
export async function generateItemClassification(
  imageUri: string
): Promise<ItemClassification> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  if (!imageUri) {
    throw new Error('Image is required for auto-fill');
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Convert image to base64
    const base64Image = await imageUriToBase64(imageUri);
    
    const prompt = `Analyze this clothing item image and provide a detailed classification. Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just the JSON):
{
  "classifications": [
    {
      "name": "descriptive name for the item",
      "category": "one of: Tops, Bottoms, or Shoes",
      "color": "primary color of the item",
      "description": "short description of the item (1-2 sentences)"
    }
  ]
}

Important: Category MUST be exactly one of: Tops, Bottoms, or Shoes. Analyze the image carefully to determine the correct category, color, and provide an accurate description.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg'
        }
      }
    ]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    // Remove markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
    }

    const parsed = JSON.parse(jsonText);
    
    if (!parsed.classifications || !parsed.classifications[0]) {
      throw new Error('Invalid response format from AI');
    }

    const classification = parsed.classifications[0];

    // Validate and normalize the category
    const validCategories = ['Tops', 'Bottoms', 'Shoes'];
    let category = classification.category;
    
    // Normalize category to match our valid categories
    if (!validCategories.includes(category)) {
      // Try case-insensitive match
      const matchedCategory = validCategories.find(
        c => c.toLowerCase() === category.toLowerCase()
      );
      category = matchedCategory || 'Tops'; // Default to Tops if no match
    }

    return {
      name: classification.name || '',
      category: category,
      color: classification.color || '',
      description: classification.description || '',
    };
  } catch (error) {
    console.error('Error generating item classification:', error);
    throw new Error('Failed to generate item classification. Please try again.');
  }
}
