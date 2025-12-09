import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } from "docx";
import { PageResult, BlockType } from "../types";

export const generateDocx = async (results: PageResult[]): Promise<Blob> => {
  const children: (Paragraph | ImageRun)[] = [];

  children.push(
    new Paragraph({
      text: "Math OCR Export",
      heading: HeadingLevel.TITLE,
    })
  );

  for (const page of results) {
    children.push(
      new Paragraph({
        text: `Page ${page.pageNumber}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      })
    );

    for (const block of page.blocks) {
      if (block.type === BlockType.TEXT && block.content) {
        // Simple splitting by newline to create paragraphs
        const lines = block.content.split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: 24, // 12pt
                  })
                ],
                spacing: { after: 120 }
              })
            );
          }
        });
      } else if (block.type === BlockType.FIGURE && block.imageBase64) {
        // Convert base64 data URL to ArrayBuffer
        const res = await fetch(block.imageBase64);
        const buffer = await res.arrayBuffer();
        
        // Add Image
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: buffer,
                transformation: {
                  width: 400, // Standard width, aspect ratio preserved
                  height: 300,
                },
                type: "png"
              }),
            ],
            spacing: { before: 200, after: 200 }
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: children as any // Casting due to docx types complexity
    }],
  });

  return await Packer.toBlob(doc);
};