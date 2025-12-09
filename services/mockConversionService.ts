import { ConversionResult } from '../types';

/**
 * Simulates a PDF to Word conversion service.
 * In a real application, this would involve sending the PDF to a backend
 * API that performs the actual conversion.
 *
 * @param pdfFile The PDF file to be "converted".
 * @returns A promise that resolves with a mock ConversionResult after a delay.
 */
export const mockConvertPdfToWord = async (pdfFile: File): Promise<ConversionResult> => {
  // Simulate network delay and processing time
  await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 seconds delay

  // In a real scenario, the backend would process the PDF and return a unique
  // download URL for the generated Word document.
  // For this mock, we create a dummy file name and a placeholder download link.
  const wordFileName = pdfFile.name.replace(/\.pdf$/i, '.docx');
  const dummyDownloadUrl = `https://example.com/downloads/${encodeURIComponent(wordFileName)}`;

  // You can also imagine an error scenario here:
  // if (Math.random() < 0.2) { // 20% chance of error
  //   throw new Error('Conversion failed due to an unexpected server error.');
  // }

  return {
    fileName: wordFileName,
    downloadUrl: dummyDownloadUrl,
  };
};