export type DocType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'scan';

export type ScanFilter = 'original' | 'magic' | 'bw' | 'grayscale';

export type ScanMode = 'Whiteboard' | 'Form' | 'Document' | 'Business Card' | 'ID Card';

export interface AnnotationItem {
  id: string;
  type: 'signature' | 'text' | 'draw' | 'image';
  x: number;
  y: number;
  text?: string;
  fontSize?: number;
  bold?: boolean;
  underline?: boolean;
  color?: string;
  paths?: string[];
  imageUri?: string;
  width?: number;
  height?: number;
}

export interface DocumentPage {
  id: string;
  imageUri?: string;
  contentTitle?: string;
  contentBody?: string;
  filter?: ScanFilter;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: DocType;
  date: string;
  size: string;
  uri?: string;
  pages: DocumentPage[];
  annotations: AnnotationItem[];
  isStarred?: boolean;
  isSigned?: boolean;
  summary?: string;
}

export interface SavedSignature {
  id: string;
  name: string;
  paths: string[];
  color: string;
}
