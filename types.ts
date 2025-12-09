export enum BlockType {
  TEXT = 'text',
  FIGURE = 'figure'
}

export interface ContentBlock {
  type: BlockType;
  content?: string; // Markdown/Latex text
  imageBase64?: string; // The cropped image data
  box_2d?: number[]; // [ymin, xmin, ymax, xmax] normalized 0-1
}

export interface PageResult {
  pageNumber: number;
  blocks: ContentBlock[];
}

export interface ProcessStatus {
  total: number;
  current: number;
  message: string;
}