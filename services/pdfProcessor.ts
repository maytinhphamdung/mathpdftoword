import * as pdfjsLib from 'pdfjs-dist';
import { processImageWithGemini } from './geminiService';
import { ContentBlock, PageResult, BlockType } from '../types';

let workerPromise: Promise<void> | null = null;

// Robust worker loader that fetches the MJS worker and creates a local Blob
// This bypasses "Failed to fetch dynamically imported module" errors.
const loadWorker = () => {
  if (workerPromise) return workerPromise;

  workerPromise = (async () => {
    if (pdfjsLib.GlobalWorkerOptions.workerSrc) return;

    const version = pdfjsLib.version;
    // We use unpkg to get the exact version match. 
    // We MUST use .mjs because pdfjs-dist@5+ acts as an ES module and spawns a module worker.
    const workerUrl = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.mjs`;

    try {
      const response = await fetch(workerUrl);
      if (!response.ok) throw new Error(`Failed to fetch worker: ${response.statusText}`);
      
      const script = await response.text();
      // Create a Blob with the worker code.
      // type: "application/javascript" is crucial.
      const blob = new Blob([script], { type: 'application/javascript' });
      pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
      console.log("PDF Worker loaded successfully via Blob");
    } catch (error) {
      console.warn("Failed to load worker via Blob, falling back to CDN URL (might fail)", error);
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    }
  })();

  return workerPromise;
};

/**
 * Crops a region from a base64 image based on normalized coordinates.
 */
const cropImageFromBase64 = (base64Source: string, box: number[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const [ymin, xmin, ymax, xmax] = box;
      const width = img.width;
      const height = img.height;

      // Calculate pixel coordinates
      const sX = xmin * width;
      const sY = ymin * height;
      const sW = (xmax - xmin) * width;
      const sH = (ymax - ymin) * height;

      // Precision padding:
      // We add a very small padding (10px) to ensure we don't cut off stroke lines
      // but keep it tight as requested.
      const padding = 10;

      // Clamp coordinates to image boundaries
      const cropX = Math.max(0, sX - padding);
      const cropY = Math.max(0, sY - padding);
      const cropX2 = Math.min(width, sX + sW + padding);
      const cropY2 = Math.min(height, sY + sH + padding);
      
      const finalW = cropX2 - cropX;
      const finalH = cropY2 - cropY;

      if (finalW <= 0 || finalH <= 0) {
          resolve(base64Source); 
          return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = finalW;
      canvas.height = finalH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      // Fill white background to handle transparency (common in PDFs)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, finalW, finalH);

      // Draw the specific region
      ctx.drawImage(img, cropX, cropY, finalW, finalH, 0, 0, finalW, finalH);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => reject(new Error("Failed to load image for cropping"));
    img.src = `data:image/jpeg;base64,${base64Source}`; // Ensure prefix is present
  });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Accept the PDFDocumentProxy directly instead of ArrayBuffer to avoid detached buffer issues
const renderPdfPageToImage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<string> => {
  const page = await pdf.getPage(pageNum);
  
  // High quality scale for OCR and Cropping
  const scale = 3.0; 
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  if (!context) throw new Error("Canvas context missing");

  await page.render({ canvasContext: context, viewport }).promise;
  // Return plain base64 string without data prefix for consistency in processing
  return canvas.toDataURL('image/jpeg', 0.95);
};

export const processFile = async (
  file: File, 
  onProgress: (msg: string, current: number, total: number) => void
): Promise<PageResult[]> => {
  // Ensure worker is loaded before starting
  await loadWorker();

  const results: PageResult[] = [];

  try {
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      // Use Uint8Array to prevent some browser-specific buffer detachment issues immediately,
      // though the main fix is reusing the `pdf` object below.
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        onProgress(`Processing Page ${i} of ${totalPages}...`, i, totalPages);
        
        // Pass the EXISTING pdf document object, NOT the ArrayBuffer
        const fullDataUrl = await renderPdfPageToImage(pdf, i);
        const base64Data = fullDataUrl.split(',')[1]; 

        // Send to Gemini
        const blocks = await processImageWithGemini(base64Data, 'image/jpeg');

        // Crop Figures
        const processedBlocks: ContentBlock[] = [];
        for (const block of blocks) {
          if (block.type === BlockType.FIGURE && block.box_2d) {
             const croppedBase64 = await cropImageFromBase64(base64Data, block.box_2d);
             processedBlocks.push({ ...block, imageBase64: croppedBase64 });
          } else {
             processedBlocks.push(block);
          }
        }

        results.push({ pageNumber: i, blocks: processedBlocks });
      }

    } else if (file.type.startsWith('image/')) {
      onProgress("Analyzing Image...", 1, 1);
      const fullBase64 = await fileToBase64(file);
      const base64Data = fullBase64.split(',')[1];
      
      const blocks = await processImageWithGemini(base64Data, file.type);
      
      const processedBlocks: ContentBlock[] = [];
      for (const block of blocks) {
        if (block.type === BlockType.FIGURE && block.box_2d) {
           // For image files, we might need to handle the data prefix carefully
           const croppedBase64 = await cropImageFromBase64(base64Data, block.box_2d);
           processedBlocks.push({ ...block, imageBase64: croppedBase64 });
        } else {
           processedBlocks.push(block);
        }
      }
      
      results.push({ pageNumber: 1, blocks: processedBlocks });
    }
  } catch (err: any) {
    console.error("PDF Processing Error:", err);
    throw new Error(`Failed to process file: ${err.message}`);
  }

  return results;
};