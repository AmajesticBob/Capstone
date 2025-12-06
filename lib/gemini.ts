import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export interface ItemClassification {
  name: string;
  category: string;
  color: string;
  colorHex: string;
  description: string;
}

export interface VirtualTryOnResult {
  description: string;
  imageData?: string; // Base64 encoded generated image
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
      "colorHex": "hex code for the primary color (e.g., #FF5733)",
      "description": "short description of the item (1-2 sentences)"
    }
  ]
}

Important: Category MUST be exactly one of: Tops, Bottoms, or Shoes. Analyze the image carefully to determine the correct category, color, colorHex (in hex format like #RRGGBB), and provide an accurate description.`;

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
      colorHex: classification.colorHex || '#000000',
      description: classification.description || '',
    };
  } catch (error) {
    console.error('Error generating item classification:', error);
    throw new Error('Failed to generate item classification. Please try again.');
  }
}

/**
 * Generate virtual try-on image using Google Gemini AI Image Generation
 * @param modelImageUri - Image URI of the model/person
 * @param topImageUri - Optional image URI of the top clothing item
 * @param bottomImageUri - Optional image URI of the bottom clothing item
 * @param shoeImageUri - Optional image URI of the shoe item
 * @returns Generated image and description of the model wearing the selected items
 */
export async function generateVirtualTryOn(
  modelImageUri: string,
  topImageUri?: string,
  bottomImageUri?: string,
  shoeImageUri?: string
): Promise<VirtualTryOnResult> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  if (!modelImageUri) {
    throw new Error('Model image is required for virtual try-on');
  }

  if (!topImageUri && !bottomImageUri && !shoeImageUri) {
    throw new Error('Please select at least one clothing item');
  }

  try {
    console.log('Initializing GoogleGenAI with API key:', API_KEY ? 'Present' : 'Missing');
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const modelBase64 = await imageUriToBase64(modelImageUri);
    
    const promptParts: any[] = [];
    
    if (topImageUri) {
      const topBase64 = await imageUriToBase64(topImageUri);
      promptParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: topBase64,
        }
      });
    }
    
    if (bottomImageUri) {
      const bottomBase64 = await imageUriToBase64(bottomImageUri);
      promptParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: bottomBase64,
        }
      });
    }
    
    if (shoeImageUri) {
      const shoeBase64 = await imageUriToBase64(shoeImageUri);
      promptParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: shoeBase64,
        }
      });
    }

    // Add model image last
    promptParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: modelBase64,
      }
    });

    // Build description of clothing items
    let clothingItems = [];
    if (topImageUri) clothingItems.push('top/shirt');
    if (bottomImageUri) clothingItems.push('bottom/pants');
    if (shoeImageUri) clothingItems.push('shoes');
    const clothingList = clothingItems.join(', ');

    promptParts.push({
      text: `Create a professional fashion photo. Take the ${clothingList} from the first ${clothingItems.length} image(s) and let the person from the last image wear them. Generate a realistic, full-body shot of the person wearing these clothing items, with natural lighting and shadows. The photo should look like a professional fashion e-commerce shot with the person modeling the outfit in a neutral or complementary background.`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: promptParts,
    });

    console.log('Response received:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', Object.keys(response || {}));

    let generatedImageData: string | undefined;
    let descriptionText = '';

    let parts: any[] | undefined;
    
    if (response && response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      console.log('Candidate:', candidate);
      console.log('Candidate keys:', Object.keys(candidate));
      
      if (candidate.content && candidate.content.parts) {
        parts = candidate.content.parts;
      } else if (candidate.content && Array.isArray(candidate.content)) {
        parts = candidate.content;
      }
    } else if (response && (response as any).parts) {
      parts = (response as any).parts;
    }

    if (parts && parts.length > 0) {
      console.log('Found parts, count:', parts.length);
      for (const part of parts) {
        console.log('Part keys:', Object.keys(part));
        console.log('Part:', JSON.stringify(part, null, 2));
        if (part.text) {
          descriptionText += part.text;
          console.log('Found text:', part.text);
        }
        if (part.inlineData) {
          generatedImageData = part.inlineData.data;
          console.log('Found image data via inlineData, length:', generatedImageData?.length);
        } else if (part.inline_data) {
          generatedImageData = (part as any).inline_data.data;
          console.log('Found image data via inline_data, length:', generatedImageData?.length);
        } else if ((part as any).image) {
          generatedImageData = (part as any).image;
          console.log('Found image data via image property, length:', generatedImageData?.length);
        }
      }
    } else {
      console.error('No parts found in response');
      console.error('Full response:', JSON.stringify(response, null, 2));
    }

    console.log('Generated image data exists:', !!generatedImageData);
    console.log('Description:', descriptionText);

    return {
      description: descriptionText || 'Virtual try-on image generated successfully!',
      imageData: generatedImageData,
    };
  } catch (error) {
    console.error('Error generating virtual try-on:', error);
    throw new Error('Failed to generate virtual try-on. Please try again.');
  }
}
