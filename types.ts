export interface ReferenceImage {
  id: string;
  url: string;
  base64: string; // Pure base64 data without prefix for API
  mimeType: string;
  name: string;
}

export interface GenerationSettings {
  aspectRatio: "1:1" | "3:4" | "4:3" | "16:9" | "9:16";
  imageSize: "1K" | "2K"; // 4K might be too slow for previews, sticking to safer defaults
}

export interface GenerateResponse {
  imageUrl?: string;
  text?: string;
}
