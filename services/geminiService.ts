import { GoogleGenAI, Schema, Type } from "@google/genai";
import { BlockType, ContentBlock } from "../types";

const processImageWithGemini = async (base64Image: string, mimeType: string): Promise<ContentBlock[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing in process.env.API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: [BlockType.TEXT, BlockType.FIGURE],
          description: "Identify if the section is text (including inline math) or a visual figure/graph."
        },
        content: {
          type: Type.STRING,
          description: "For 'text', provide the OCR content with LaTeX for math. For 'figure', leave empty."
        },
        box_2d: {
          type: Type.ARRAY,
          items: { type: Type.NUMBER },
          description: "The PRECISE bounding box [ymin, xmin, ymax, xmax] (0-1) for figures. Must include all labels."
        }
      },
      required: ["type"]
    }
  };

  const prompt = `
    You are a specialized Math OCR engine for Vietnamese High School Mathematics.
    
    CRITICAL OBJECTIVES:
    1. EXTRACT TEXT: 
       - Convert all text to standard format.
       - Convert all Math expressions (formulas, equations) to LaTeX format (e.g., $f(x) = x^2 + 1$).
    
    2. DETECT FIGURES (Type: 'figure'):
       - You MUST detect ALL visual elements that cannot be represented purely by text.
       - Specifically look for:
         * "Bảng biến thiên" (Variation Tables) -> This is a FIGURE.
         * "Đồ thị hàm số" (Function Graphs) -> This is a FIGURE.
         * "Hình học" (Geometry figures: Triangles, circles, cubes) -> This is a FIGURE.
         * Coordinate systems with curves or lines.
    
    3. PRECISE CROPPING INSTRUCTIONS:
       - For every detected figure, return the 'box_2d' coordinates [ymin, xmin, ymax, xmax].
       - The box must be EXTREMELY PRECISE but inclusive.
       - Include:
         * All axis labels (x, y, O, values on axes).
         * All point labels (A, B, C, M, N...).
         * The entire border of the "Bảng biến thiên".
         * Legend text describing the graph if it is visually attached.
       - Do NOT include the question number (e.g., "Câu 1:") inside the figure box unless it overlaps the drawing.
    
    4. OUTPUT:
       - Return a JSON array of blocks in top-to-bottom reading order.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as ContentBlock[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export { processImageWithGemini };