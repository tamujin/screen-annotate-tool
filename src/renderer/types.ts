export interface ScreenSource {
  id: string;
  name: string;
  thumbnail: {
    toDataURL: () => string;
    getSize: () => { width: number; height: number };
  };
  display_id?: string;
  appIcon?: {
    toDataURL: () => string;
  };
}

export type AnnotationType = 'arrow' | 'circle' | 'rectangle' | 'text';

export interface Annotation {
  id: string;
  type: AnnotationType;
  color: string;
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  text?: string;
  width?: number;
  height?: number;
}

export interface ColorOption {
  id: string;
  value: string;
  name: string;
  shortcut: string;
} 