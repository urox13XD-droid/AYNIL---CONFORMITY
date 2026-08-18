export interface TextStyle {
  fontSize: number;
  bold: boolean;
  italic: boolean;
  color: string;
  fontFamily: string;
}

export interface ElementLayout {
  pos: { x: number; y: number };
  style: TextStyle;
}

export interface ImageLayout {
  pos: { x: number; y: number };
  size: { w: number; h: number };
}

export const ELEMENT_KEYS = [
  "production",
  "subtitle",
  "title",
  "specs1",
  "specs2",
  "cameraInfo",
  "lens",
  "notes",
  "chefOp",
  "date",
] as const;

export type ConformityElementKey = (typeof ELEMENT_KEYS)[number];

export type ConformityLayoutMap = Record<ConformityElementKey, ElementLayout>;

export interface ConformitySheetData {
  production: string;
  subtitle: string;
  cameraLetter: string;
  cameraModel: string;
  cameraSerial: string;
  codec: string;
  resolution: string;
  ratioPreset: string;
  ratioCustom: string;
  fps: string;
  lens: string;
  chefOp: string;
  date: string;
  notes: string;
  layout: ConformityLayoutMap;
  // elements explicitly removed from the sheet via the trash button / Backspace —
  // kept distinct from the underlying fields being empty, since "production" and
  // "title" always render *something* (a placeholder / a fixed label) otherwise
  hiddenElements: ConformityElementKey[];
}

export const FONT_OPTIONS = [
  { label: "Anton (affichage)", value: "var(--font-display)" },
  { label: "Space Grotesk", value: "var(--font-body)" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier New", value: '"Courier New", monospace' },
  { label: "Roboto", value: "var(--font-roboto)" },
  { label: "Oswald", value: "var(--font-oswald)" },
  { label: "Bebas Neue", value: "var(--font-bebas)" },
  { label: "Playfair Display", value: "var(--font-playfair)" },
  { label: "Montserrat", value: "var(--font-montserrat)" },
  { label: "Lato", value: "var(--font-lato)" },
  { label: "Merriweather", value: "var(--font-merriweather)" },
  { label: "Poppins", value: "var(--font-poppins)" },
  { label: "Inter", value: "var(--font-inter)" },
  { label: "Barlow Condensed", value: "var(--font-barlow)" },
];

const DISPLAY_FONT = "var(--font-display)";
const BODY_FONT = "var(--font-body)";

function ts(fontSize: number, bold: boolean, options: Partial<Pick<TextStyle, "italic" | "color" | "fontFamily">> = {}): TextStyle {
  return {
    fontSize,
    bold,
    italic: options.italic ?? false,
    color: options.color ?? "#000000",
    fontFamily: options.fontFamily ?? BODY_FONT,
  };
}

export const DEFAULT_LAYOUT: ConformityLayoutMap = {
  production: { pos: { x: 0.18, y: 0.08 }, style: ts(13, true) },
  subtitle: { pos: { x: 0.82, y: 0.08 }, style: ts(13, true) },
  title: { pos: { x: 0.5, y: 0.32 }, style: ts(30, true, { fontFamily: DISPLAY_FONT }) },
  specs1: { pos: { x: 0.5, y: 0.44 }, style: ts(19, true) },
  specs2: { pos: { x: 0.5, y: 0.52 }, style: ts(15, true) },
  cameraInfo: { pos: { x: 0.5, y: 0.6 }, style: ts(14, false) },
  lens: { pos: { x: 0.5, y: 0.67 }, style: ts(14, false) },
  notes: { pos: { x: 0.5, y: 0.86 }, style: ts(11, false, { color: "#4b5563" }) },
  chefOp: { pos: { x: 0.18, y: 0.93 }, style: ts(13, true) },
  date: { pos: { x: 0.82, y: 0.93 }, style: ts(13, true) },
};

export const RATIO_PRESETS = [
  "16:9",
  "1.85:1",
  "2:1",
  "2.39:1",
  "4:3",
  "3:2 Open Gate",
  "1:1",
  "Personnalisé",
];

export const EMPTY_SHEET: ConformitySheetData = {
  production: "",
  subtitle: "",
  cameraLetter: "",
  cameraModel: "",
  cameraSerial: "",
  codec: "",
  resolution: "",
  ratioPreset: RATIO_PRESETS[0],
  ratioCustom: "",
  fps: "",
  lens: "",
  chefOp: "",
  date: "",
  notes: "",
  layout: DEFAULT_LAYOUT,
  hiddenElements: [],
};

export function ratioLabel(sheet: ConformitySheetData): string {
  return sheet.ratioPreset === "Personnalisé" ? sheet.ratioCustom.trim() : sheet.ratioPreset;
}

