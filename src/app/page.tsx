"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import {
  ConformityElementKey,
  ConformitySheetData,
  EMPTY_SHEET,
  FONT_OPTIONS,
  ImageLayout,
  RATIO_PRESETS,
  TextStyle,
  ratioLabel,
} from "@/lib/conformity";

function ComicButton({
  children,
  onClick,
  variant = "outline",
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "outline" | "solid";
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`shrink-0 rounded-lg border-[2.5px] border-black px-3 py-1.5 text-xs font-bold uppercase tracking-wide shadow-comic-sm transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
        variant === "solid"
          ? "bg-black text-white hover:bg-white hover:text-black"
          : "bg-white text-black hover:bg-black hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function RoundIconButton({
  children,
  onClick,
  disabled,
  title,
  variant = "outline",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  variant?: "outline" | "solid";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[2.5px] border-black shadow-comic-sm transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black ${
        variant === "solid"
          ? "bg-black text-white hover:bg-white hover:text-black"
          : "bg-white text-black hover:bg-black hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function UndoIcon({ flipped }: { flipped?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      style={flipped ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function FullscreenIcon({ active }: { active?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {active ? (
        <>
          <path d="M9 4v5H4" />
          <path d="M15 4v5h5" />
          <path d="M9 20v-5H4" />
          <path d="M15 20v-5h5" />
        </>
      ) : (
        <>
          <path d="M4 9V4h5" />
          <path d="M20 9V4h-5" />
          <path d="M4 15v5h5" />
          <path d="M20 15v5h-5" />
        </>
      )}
    </svg>
  );
}

function LanguageMenu({
  lang,
  open,
  onToggle,
  onSelect,
  t,
}: {
  lang: Lang;
  open: boolean;
  onToggle: () => void;
  onSelect: (lang: Lang) => void;
  t: Strings;
}) {
  return (
    <div data-lang-menu className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex shrink-0 items-center gap-1 rounded-lg border-[2.5px] border-black bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-black shadow-comic-sm transition hover:bg-black hover:text-white"
      >
        {lang === "fr" ? t.langMenuFr : t.langMenuEn}
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-32 overflow-hidden rounded-lg border-[2.5px] border-black bg-white shadow-comic-sm">
          <button
            type="button"
            onClick={() => onSelect("fr")}
            className={`block w-full px-3 py-1.5 text-left text-xs font-bold uppercase tracking-wide ${
              lang === "fr" ? "bg-black text-white" : "bg-white text-black hover:bg-black/10"
            }`}
          >
            {t.langMenuFr}
          </button>
          <button
            type="button"
            onClick={() => onSelect("en")}
            className={`block w-full px-3 py-1.5 text-left text-xs font-bold uppercase tracking-wide ${
              lang === "en" ? "bg-black text-white" : "bg-white text-black hover:bg-black/10"
            }`}
          >
            {t.langMenuEn}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-wide text-black/70">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border-[2px] border-black bg-white px-2.5 py-1.5 text-sm font-semibold outline-none focus:shadow-comic-sm";

function formatDateFr(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

type Lang = "fr" | "en";

interface Strings {
  headerNew: string;
  headerExportPng: string;
  headerExportPdf: string;
  headerPrint: string;
  hint: string;
  fieldProduction: string;
  fieldProductionPlaceholder: string;
  fieldSubtitle: string;
  fieldSubtitlePlaceholder: string;
  fieldCamera: string;
  fieldCameraPlaceholder: string;
  fieldChefOp: string;
  fieldCameraModel: string;
  fieldCameraModelPlaceholder: string;
  fieldCameraSerial: string;
  fieldCameraSerialPlaceholder: string;
  fieldCodec: string;
  fieldCodecPlaceholder: string;
  fieldResolution: string;
  fieldResolutionPlaceholder: string;
  fieldRatio: string;
  fieldFps: string;
  fieldFpsPlaceholder: string;
  fieldRatioCustom: string;
  fieldRatioCustomPlaceholder: string;
  fieldLens: string;
  fieldLensPlaceholder: string;
  fieldDistortion: string;
  fieldDistortionPlaceholder: string;
  fieldDate: string;
  fieldNotes: string;
  fieldNotesPlaceholder: string;
  fieldImages: (max: number) => string;
  dropzoneText: string;
  dropzoneMax: (max: number) => string;
  removeImageTitle: string;
  resizeTitle: string;
  altPreview: string;
  altFrameRef: string;
  ratioCustomLabel: string;
  sheetProductionPlaceholder: string;
  sheetTitle: string;
  sheetCamera: string;
  sheetDistortionPrefix: string;
  sheetChefOpPrefix: string;
  sheetDatePrefix: string;
  styleTitle: string;
  styleFont: string;
  styleSize: (n: number) => string;
  styleColor: string;
  styleCustomColor: string;
  imageStyleTitle: string;
  imageStyleSize: (n: number) => string;
  undoTitle: string;
  redoTitle: string;
  deleteTitle: string;
  fullscreenEnter: string;
  fullscreenExit: string;
  toastFullscreenUnavailable: string;
  toastPngExported: string;
  toastPdfExported: string;
  toastPageReset: string;
  toastImageLoadFail: string;
  confirmReset: string;
  fontDisplaySuffix: string;
  close: string;
  langMenuFr: string;
  langMenuEn: string;
}

const STRINGS: Record<Lang, Strings> = {
  fr: {
    headerNew: "Nouveau",
    headerExportPng: "Export PNG",
    headerExportPdf: "Export PDF",
    headerPrint: "Imprimer",
    hint: "Astuce : sur l'aperçu à droite, faites glisser un texte pour le repositionner, ou cliquez dessus pour changer sa police, sa taille, son style et sa couleur. Chaque image se déplace aussi et se redimensionne (par sa poignée en bas à droite, ou par le curseur de taille une fois sélectionnée). Sélectionnez un élément puis appuyez sur Retour arrière ou l'icône poubelle pour le supprimer. Les flèches en bas à droite (ou Ctrl+Z / Ctrl+Maj+Z) annulent et rétablissent.",
    fieldProduction: "Nom de la production",
    fieldProductionPlaceholder: "Ex. Pax Massilia",
    fieldSubtitle: "Référence / épisode / bloc",
    fieldSubtitlePlaceholder: "Ex. S3 Bloc 2",
    fieldCamera: "Caméra",
    fieldCameraPlaceholder: "A",
    fieldChefOp: "Chef opérateur",
    fieldCameraModel: "Modèle caméra",
    fieldCameraModelPlaceholder: "Ex. ARRI Alexa 35",
    fieldCameraSerial: "N° de série",
    fieldCameraSerialPlaceholder: "Ex. #65706",
    fieldCodec: "Codec",
    fieldCodecPlaceholder: "ARRIRAW",
    fieldResolution: "Résolution",
    fieldResolutionPlaceholder: "4.6K",
    fieldRatio: "Ratio image",
    fieldFps: "Cadence",
    fieldFpsPlaceholder: "25 fps",
    fieldRatioCustom: "Ratio personnalisé",
    fieldRatioCustomPlaceholder: "Ex. 1.66:1",
    fieldLens: "Objectif",
    fieldLensPlaceholder: "Ex. Leitz Summicron-C 50mm",
    fieldDistortion: "Info distorsion",
    fieldDistortionPlaceholder: "Ex. Anamorphique 1.8x, correction en post…",
    fieldDate: "Date",
    fieldNotes: "Réglages / notes complémentaires",
    fieldNotesPlaceholder: "Tout réglage à préciser pour la post-prod…",
    fieldImages: (max: number) => `Images de référence (optionnel, max ${max})`,
    dropzoneText: "Glissez-déposez une ou plusieurs images ici, ou cliquez pour parcourir",
    dropzoneMax: (max: number) => `Maximum ${max} images atteint`,
    removeImageTitle: "Retirer",
    resizeTitle: "Redimensionner",
    altPreview: "Aperçu",
    altFrameRef: "Référence de cadre",
    ratioCustomLabel: "Personnalisé",
    sheetProductionPlaceholder: "Nom de la production",
    sheetTitle: "Conformité Cadre",
    sheetCamera: "Caméra",
    sheetDistortionPrefix: "Distorsion : ",
    sheetChefOpPrefix: "Chef opérateur : ",
    sheetDatePrefix: "Date : ",
    styleTitle: "Style du texte",
    styleFont: "Police",
    styleSize: (n: number) => `Taille — ${n}px`,
    styleColor: "Couleur",
    styleCustomColor: "Couleur personnalisée",
    imageStyleTitle: "Image",
    imageStyleSize: (n: number) => `Taille — ${n}%`,
    undoTitle: "Annuler (Ctrl+Z)",
    redoTitle: "Rétablir (Ctrl+Maj+Z)",
    deleteTitle: "Supprimer l'élément sélectionné (Retour arrière)",
    fullscreenEnter: "Plein écran",
    fullscreenExit: "Quitter le plein écran (Échap)",
    toastFullscreenUnavailable: "Plein écran indisponible sur cet appareil",
    toastPngExported: "PNG exporté",
    toastPdfExported: "PDF exporté",
    toastPageReset: "Page réinitialisée",
    toastImageLoadFail: "Impossible de charger cette image",
    confirmReset: "Réinitialiser la page ? Toutes les données saisies seront perdues.",
    fontDisplaySuffix: "(affichage)",
    close: "Fermer",
    langMenuFr: "Français",
    langMenuEn: "English",
  },
  en: {
    headerNew: "New",
    headerExportPng: "Export PNG",
    headerExportPdf: "Export PDF",
    headerPrint: "Print",
    hint: "Tip: on the preview to the right, drag a text to reposition it, or click it to change its font, size, style and color. Images can also be moved and resized (via the handle at the bottom right, or the size slider once selected). Select an element then press Backspace or the trash icon to delete it. The arrows at the bottom right (or Ctrl+Z / Ctrl+Shift+Z) undo and redo.",
    fieldProduction: "Production name",
    fieldProductionPlaceholder: "E.g. Pax Massilia",
    fieldSubtitle: "Reference / episode / block",
    fieldSubtitlePlaceholder: "E.g. S3 Block 2",
    fieldCamera: "Camera",
    fieldCameraPlaceholder: "A",
    fieldChefOp: "Director of photography",
    fieldCameraModel: "Camera model",
    fieldCameraModelPlaceholder: "E.g. ARRI Alexa 35",
    fieldCameraSerial: "Serial No.",
    fieldCameraSerialPlaceholder: "E.g. #65706",
    fieldCodec: "Codec",
    fieldCodecPlaceholder: "ARRIRAW",
    fieldResolution: "Resolution",
    fieldResolutionPlaceholder: "4.6K",
    fieldRatio: "Aspect ratio",
    fieldFps: "Frame rate",
    fieldFpsPlaceholder: "25 fps",
    fieldRatioCustom: "Custom ratio",
    fieldRatioCustomPlaceholder: "E.g. 1.66:1",
    fieldLens: "Lens",
    fieldLensPlaceholder: "E.g. Leitz Summicron-C 50mm",
    fieldDistortion: "Distortion info",
    fieldDistortionPlaceholder: "E.g. Anamorphic 1.8x, corrected in post…",
    fieldDate: "Date",
    fieldNotes: "Additional settings / notes",
    fieldNotesPlaceholder: "Any settings to note for post-production…",
    fieldImages: (max: number) => `Reference images (optional, max ${max})`,
    dropzoneText: "Drag and drop one or more images here, or click to browse",
    dropzoneMax: (max: number) => `Maximum of ${max} images reached`,
    removeImageTitle: "Remove",
    resizeTitle: "Resize",
    altPreview: "Preview",
    altFrameRef: "Frame reference",
    ratioCustomLabel: "Custom",
    sheetProductionPlaceholder: "Production name",
    sheetTitle: "Frame Conformity",
    sheetCamera: "Camera",
    sheetDistortionPrefix: "Distortion: ",
    sheetChefOpPrefix: "Director of photography: ",
    sheetDatePrefix: "Date: ",
    styleTitle: "Text style",
    styleFont: "Font",
    styleSize: (n: number) => `Size — ${n}px`,
    styleColor: "Color",
    styleCustomColor: "Custom color",
    imageStyleTitle: "Image",
    imageStyleSize: (n: number) => `Size — ${n}%`,
    undoTitle: "Undo (Ctrl+Z)",
    redoTitle: "Redo (Ctrl+Shift+Z)",
    deleteTitle: "Delete selected element (Backspace)",
    fullscreenEnter: "Fullscreen",
    fullscreenExit: "Exit fullscreen (Esc)",
    toastFullscreenUnavailable: "Fullscreen unavailable on this device",
    toastPngExported: "PNG exported",
    toastPdfExported: "PDF exported",
    toastPageReset: "Page reset",
    toastImageLoadFail: "Unable to load this image",
    confirmReset: "Reset the page? All entered data will be lost.",
    fontDisplaySuffix: "(display)",
    close: "Close",
    langMenuFr: "Français",
    langMenuEn: "English",
  },
};

function ratioPresetLabel(preset: string, t: Strings): string {
  return preset === "Personnalisé" ? t.ratioCustomLabel : preset;
}

function fontOptionLabel(label: string, t: Strings): string {
  return label.replace("(affichage)", t.fontDisplaySuffix);
}

// true only if the browser's own <img> can actually decode this source —
// some formats (notably HEIC straight from an iPhone's photo library)
// produce a src that <img> silently refuses to render
function imageSrcRenders(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

const MAX_IMAGE_DIMENSION = 2000;

// last-resort recovery for a file <img> can't render directly: decode it via
// createImageBitmap (broader native codec support, e.g. HEIC in Safari) and
// re-encode as a JPEG every browser can display. Downscaled to stay well
// under canvas size/memory limits on phones for very high-resolution photos.
async function normalizeViaCanvas(file: File): Promise<string | null> {
  try {
    const bitmap = await Promise.race([
      createImageBitmap(file),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
    ]);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return null;
  }
}

// resolves to a URL the browser can actually render as an <img>. Uses a
// blob: URL (not a base64 data: URL) as the fast path: Mobile Safari has a
// known limitation where large data: URIs — exactly what a full-resolution
// phone photo produces — can silently fail to render, while blob: URLs
// (backed by the File directly, no base64 re-encoding) don't have that
// ceiling. If the format itself still can't be decoded (rare), falls back to
// decoding via createImageBitmap and re-encoding as JPEG.
async function fileToImageSrc(file: File): Promise<string> {
  const blobUrl = URL.createObjectURL(file);
  if (await imageSrcRenders(blobUrl)) return blobUrl;
  const normalized = await normalizeViaCanvas(file);
  return normalized ?? blobUrl;
}

const SHEET_RATIO_PCT = (210 / 297) * 100; // A4 landscape height-as-%-of-width, locked via a padding-bottom spacer

interface SheetElement {
  key: ConformityElementKey;
  value: string;
  align: "left" | "center" | "right";
  uppercase?: boolean;
}

const MAX_IMAGES = 4;

interface SheetImage {
  id: string;
  src: string;
  layout: ImageLayout;
}

interface Doc {
  sheet: ConformitySheetData;
  images: SheetImage[];
}

type ClearableField = Exclude<keyof ConformitySheetData, "layout" | "hiddenElements">;

// which sheet fields to clear when a given canvas text element is deleted —
// "title" has no field of its own (it's a fixed label), it's only ever
// removed from view via hiddenElements
const CLEARABLE_FIELDS: Partial<Record<ConformityElementKey, ClearableField[]>> = {
  production: ["production"],
  subtitle: ["subtitle"],
  specs1: ["codec", "resolution"],
  specs2: ["fps"],
  cameraInfo: ["cameraModel", "cameraSerial"],
  lens: ["lens"],
  distortion: ["distortion"],
  notes: ["notes"],
  chefOp: ["chefOp"],
  date: ["date"],
};

// the reverse mapping — editing one of these fields in the sidebar means the
// user wants that element back, so un-hide it even if it was deleted before
const FIELD_TO_ELEMENTS: Partial<Record<ClearableField, ConformityElementKey[]>> = {
  production: ["production"],
  subtitle: ["subtitle"],
  cameraLetter: ["title"],
  codec: ["specs1"],
  resolution: ["specs1"],
  ratioPreset: ["specs2"],
  ratioCustom: ["specs2"],
  fps: ["specs2"],
  cameraModel: ["cameraInfo"],
  cameraSerial: ["cameraInfo"],
  lens: ["lens"],
  distortion: ["distortion"],
  notes: ["notes"],
  chefOp: ["chefOp"],
  date: ["date"],
};

function defaultImageLayout(index: number): ImageLayout {
  const xs = [0.22, 0.42, 0.62, 0.82];
  return { pos: { x: xs[index % xs.length], y: 0.8 }, size: { w: 0.18, h: 0.14 } };
}

function DraggableText({
  el,
  pos,
  style,
  selected,
  onSelect,
  onDrag,
  onDragStart,
}: {
  el: SheetElement;
  pos: { x: number; y: number };
  style: TextStyle;
  selected: boolean;
  onSelect: (key: ConformityElementKey) => void;
  onDrag: (key: ConformityElementKey, pos: { x: number; y: number }) => void;
  onDragStart: () => void;
}) {
  const draggedRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const sheetEl = e.currentTarget.closest("[data-sheet]") as HTMLElement | null;
    if (!sheetEl) return;
    // without this, a click-drag on text starts the browser's native text-selection
    // gesture (blue highlight) alongside the repositioning
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    draggedRef.current = false;

    // listen on window rather than the (small, text-sized) element itself: a fast drag's
    // first move can jump past the element's own bounds before any capture is established,
    // and without capture the browser only dispatches pointermove to whatever is under the
    // cursor — which by then may no longer be this element
    const move = (ev: PointerEvent) => {
      if (!draggedRef.current) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 4) return;
        draggedRef.current = true;
        onDragStart();
      }
      const rect = sheetEl.getBoundingClientRect();
      onDrag(el.key, {
        x: clamp((ev.clientX - rect.left) / rect.width, 0.02, 0.98),
        y: clamp((ev.clientY - rect.top) / rect.height, 0.02, 0.98),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    onSelect(el.key);
  };

  const translate =
    el.align === "left" ? "translate(0, -50%)" : el.align === "right" ? "translate(-100%, -50%)" : "translate(-50%, -50%)";

  return (
    <div
      data-draggable-text
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={`absolute max-w-[80%] cursor-move touch-none select-none whitespace-pre-wrap px-1 ${
        selected ? "outline outline-2 outline-dashed outline-black/50" : ""
      }`}
      style={{
        left: `${pos.x * 100}%`,
        top: `${pos.y * 100}%`,
        transform: translate,
        textAlign: el.align,
        fontSize: style.fontSize,
        fontWeight: style.bold ? 700 : 400,
        fontStyle: style.italic ? "italic" : "normal",
        color: style.color,
        fontFamily: style.fontFamily,
        textTransform: el.uppercase ? "uppercase" : undefined,
        letterSpacing: el.uppercase ? "0.05em" : undefined,
      }}
    >
      {el.value}
    </div>
  );
}

function DraggableImage({
  src,
  layout,
  selected,
  onSelect,
  onDrag,
  onResize,
  onDragStart,
  t,
}: {
  src: string;
  layout: ImageLayout;
  selected: boolean;
  onSelect: () => void;
  onDrag: (pos: { x: number; y: number }) => void;
  onResize: (next: ImageLayout) => void;
  onDragStart: () => void;
  t: Strings;
}) {
  const draggedRef = useRef(false);

  const onPointerDownMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const sheetEl = e.currentTarget.closest("[data-sheet]") as HTMLElement | null;
    if (!sheetEl) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    draggedRef.current = false;
    const move = (ev: PointerEvent) => {
      if (!draggedRef.current) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 4) return;
        draggedRef.current = true;
        onDragStart();
      }
      const rect = sheetEl.getBoundingClientRect();
      onDrag({
        x: clamp((ev.clientX - rect.left) / rect.width, 0.05, 0.95),
        y: clamp((ev.clientY - rect.top) / rect.height, 0.05, 0.95),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    onSelect();
  };

  const onPointerDownResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const sheetEl = (e.currentTarget.closest("[data-sheet]") as HTMLElement | null);
    if (!sheetEl) return;
    onDragStart();
    // keep the top-left corner fixed and let the bottom-right corner follow the cursor,
    // recomputing both size and (since pos is a center anchor) center position together
    const topLeft = { x: layout.pos.x - layout.size.w / 2, y: layout.pos.y - layout.size.h / 2 };
    const move = (ev: PointerEvent) => {
      const rect = sheetEl.getBoundingClientRect();
      const bottomRight = {
        x: clamp((ev.clientX - rect.left) / rect.width, 0, 1),
        y: clamp((ev.clientY - rect.top) / rect.height, 0, 1),
      };
      const w = clamp(bottomRight.x - topLeft.x, 0.06, 0.9);
      const h = clamp(bottomRight.y - topLeft.y, 0.06, 0.9);
      onResize({ pos: { x: topLeft.x + w / 2, y: topLeft.y + h / 2 }, size: { w, h } });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      data-draggable-text
      data-image
      onPointerDown={onPointerDownMove}
      onClick={onClick}
      className={`absolute cursor-move touch-none select-none border-[3px] border-black bg-white ${
        selected ? "outline outline-2 outline-dashed outline-black/50" : ""
      }`}
      style={{
        left: `${layout.pos.x * 100}%`,
        top: `${layout.pos.y * 100}%`,
        width: `${layout.size.w * 100}%`,
        height: `${layout.size.h * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- dropped image, rendered into an export canvas */}
      <img src={src} alt={t.altFrameRef} className="h-full w-full pointer-events-none object-contain" draggable={false} />
      <div
        onPointerDown={onPointerDownResize}
        title={t.resizeTitle}
        className="absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize rounded-sm border-[2px] border-black bg-white shadow-comic-sm"
      />
    </div>
  );
}

const SWATCHES = ["#000000", "#ffffff", "#dc2626", "#2563eb", "#16a34a", "#ca8a04"];

const panelPositionClass =
  "fixed inset-x-4 top-4 z-30 rounded-lg border-[2.5px] border-black bg-white p-3 shadow-comic-lg lg:inset-x-auto lg:top-auto lg:bottom-24 lg:right-4 lg:w-60";

function StylePanel({
  style,
  onChange,
  onClose,
  onSliderDragStart,
  t,
}: {
  style: TextStyle;
  onChange: (patch: Partial<TextStyle>) => void;
  onClose: () => void;
  onSliderDragStart: () => void;
  t: Strings;
}) {
  return (
    <div data-floating-ui className={panelPositionClass}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-xs font-bold uppercase tracking-wide">{t.styleTitle}</span>
        <button onClick={onClose} className="text-sm font-bold leading-none" title={t.close}>
          ×
        </button>
      </div>

      <label className="mb-1 block text-[10px] font-bold uppercase text-black/60">{t.styleFont}</label>
      <select
        className="mb-3 w-full rounded border-[1.5px] border-black px-1.5 py-1 text-xs"
        value={style.fontFamily}
        onChange={(e) => {
          onSliderDragStart();
          onChange({ fontFamily: e.target.value });
        }}
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f.value} value={f.value}>
            {fontOptionLabel(f.label, t)}
          </option>
        ))}
      </select>

      <label className="mb-1 block text-[10px] font-bold uppercase text-black/60">
        {t.styleSize(style.fontSize)}
      </label>
      <input
        type="range"
        min={8}
        max={64}
        value={style.fontSize}
        onPointerDown={onSliderDragStart}
        onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
        className="mb-3 w-full"
      />

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => {
            onSliderDragStart();
            onChange({ bold: !style.bold });
          }}
          className={`flex-1 rounded border-[1.5px] border-black py-1 text-sm font-bold ${
            style.bold ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          G
        </button>
        <button
          onClick={() => {
            onSliderDragStart();
            onChange({ italic: !style.italic });
          }}
          className={`flex-1 rounded border-[1.5px] border-black py-1 text-sm italic ${
            style.italic ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          I
        </button>
      </div>

      <label className="mb-1 block text-[10px] font-bold uppercase text-black/60">{t.styleColor}</label>
      <div className="flex flex-wrap items-center gap-1.5">
        {SWATCHES.map((c) => (
          <button
            key={c}
            onClick={() => {
              onSliderDragStart();
              onChange({ color: c });
            }}
            className={`h-6 w-6 rounded-full border-[1.5px] border-black ${
              style.color.toLowerCase() === c ? "ring-2 ring-black ring-offset-1" : ""
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
        <input
          type="color"
          value={style.color}
          onPointerDown={onSliderDragStart}
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-6 w-8 cursor-pointer rounded border-[1.5px] border-black bg-transparent p-0"
          title={t.styleCustomColor}
        />
      </div>
    </div>
  );
}

function ImageStylePanel({
  layout,
  onResize,
  onClose,
  onSliderDragStart,
  t,
}: {
  layout: ImageLayout;
  onResize: (next: ImageLayout) => void;
  onClose: () => void;
  onSliderDragStart: () => void;
  t: Strings;
}) {
  const widthPct = Math.round(layout.size.w * 100);
  return (
    <div data-floating-ui className={panelPositionClass}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-xs font-bold uppercase tracking-wide">{t.imageStyleTitle}</span>
        <button onClick={onClose} className="text-sm font-bold leading-none" title={t.close}>
          ×
        </button>
      </div>

      <label className="mb-1 block text-[10px] font-bold uppercase text-black/60">{t.imageStyleSize(widthPct)}</label>
      <input
        type="range"
        min={6}
        max={90}
        value={widthPct}
        onPointerDown={onSliderDragStart}
        onChange={(e) => {
          const newW = Number(e.target.value) / 100;
          const aspect = layout.size.h / layout.size.w;
          const newH = clamp(newW * aspect, 0.06, 0.9);
          onResize({ pos: layout.pos, size: { w: newW, h: newH } });
        }}
        className="w-full"
      />
    </div>
  );
}

export default function ConformityPage() {
  const [sheet, setSheetRaw] = useState<ConformitySheetData>(EMPTY_SHEET);
  const [images, setImagesRaw] = useState<SheetImage[]>([]);
  const [past, setPast] = useState<Doc[]>([]);
  const [future, setFuture] = useState<Doc[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selected, setSelected] = useState<ConformityElementKey | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lang, setLang] = useState<Lang>("fr");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const t = STRINGS[lang];
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // always mirrors the latest state so history snapshots taken from event
  // handlers (which run after render) never read a stale closure
  const sheetRef = useRef(sheet);
  const imagesRef = useRef(images);
  sheetRef.current = sheet;
  imagesRef.current = images;

  const editSnapshotRef = useRef<Doc | null>(null);

  useEffect(() => {
    // the page is statically prerendered, so today's date can't be baked
    // into the initial state — set it client-side once mounted. The sheet
    // always starts blank; nothing is persisted across page loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the client's current date, not derivable at prerender time
    setSheetRaw((s) => ({ ...s, date: todayIso() }));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!langMenuOpen) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-lang-menu]")) return;
      setLangMenuOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [langMenuOpen]);

  // Escape exiting fullscreen is handled natively by the browser — this just
  // keeps the button's icon in sync when that (or any other) exit happens
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // on desktop, the rest of the page has no scroll of its own (see the
  // lg:overflow-hidden root) — redirect any wheel/trackpad scroll to the
  // sidebar no matter where the pointer is, so the header and preview never
  // move. Native controls (select dropdowns, the notes textarea, the
  // floating style panels) keep their own scroll behavior.
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-floating-ui]") || target.closest("select") || target.closest("textarea")) return;
      const sidebar = sidebarRef.current;
      if (!sidebar) return;
      e.preventDefault();
      sidebar.scrollTop += e.deltaY;
    };
    window.addEventListener("wheel", handler, { passive: false });
    return () => window.removeEventListener("wheel", handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {
        setToast(t.toastFullscreenUnavailable);
      });
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    if (!selected) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-floating-ui]") || target.closest("[data-draggable-text]")) return;
      setSelected(null);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [selected]);

  useEffect(() => {
    if (!selectedImageId) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-floating-ui]") || target.closest("[data-image]")) return;
      setSelectedImageId(null);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [selectedImageId]);

  // history: undo/redo snapshots -----------------------------------------

  const commitSnapshot = useCallback(() => {
    setPast((p) => [...p, { sheet: sheetRef.current, images: imagesRef.current }].slice(-50));
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [{ sheet: sheetRef.current, images: imagesRef.current }, ...f].slice(0, 50));
      setSheetRaw(prev.sheet);
      setImagesRaw(prev.images);
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, { sheet: sheetRef.current, images: imagesRef.current }].slice(-50));
      setSheetRaw(next.sheet);
      setImagesRaw(next.images);
      return f.slice(1);
    });
  }, []);

  const beginFieldEdit = useCallback(() => {
    editSnapshotRef.current = { sheet: sheetRef.current, images: imagesRef.current };
  }, []);

  const endFieldEdit = useCallback(() => {
    const snap = editSnapshotRef.current;
    editSnapshotRef.current = null;
    if (!snap) return;
    // deferred so any pending state update from the field's own change has
    // definitely flushed (and sheetRef/imagesRef updated) before comparing
    requestAnimationFrame(() => {
      if (snap.sheet === sheetRef.current && snap.images === imagesRef.current) return;
      setPast((p) => [...p, snap].slice(-50));
      setFuture([]);
    });
  }, []);

  // Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y) — skipped while typing in a field so the
  // browser's own native undo-within-that-field keeps working as expected
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // selection + deletion ---------------------------------------------------

  const selectText = useCallback((key: ConformityElementKey) => {
    setSelectedImageId(null);
    setSelected(key);
  }, []);

  const selectImage = useCallback((id: string) => {
    setSelected(null);
    setSelectedImageId(id);
  }, []);

  const clearElement = useCallback(
    (key: ConformityElementKey) => {
      commitSnapshot();
      setSheetRaw((s) => {
        const fields = CLEARABLE_FIELDS[key];
        const next = { ...s, hiddenElements: Array.from(new Set([...s.hiddenElements, key])) };
        if (fields) for (const f of fields) next[f] = "";
        return next;
      });
    },
    [commitSnapshot]
  );

  const deleteSelected = useCallback(() => {
    if (selectedImageId) {
      commitSnapshot();
      setImagesRaw((imgs) => imgs.filter((img) => img.id !== selectedImageId));
      setSelectedImageId(null);
    } else if (selected) {
      clearElement(selected);
      setSelected(null);
    }
  }, [selected, selectedImageId, commitSnapshot, clearElement]);

  useEffect(() => {
    if (!selected && !selectedImageId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      deleteSelected();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, selectedImageId, deleteSelected]);

  // sheet / image mutations -------------------------------------------------

  const update = useCallback(
    <K extends keyof ConformitySheetData>(key: K, value: ConformitySheetData[K]) => {
      setSheetRaw((s) => {
        const unhide = FIELD_TO_ELEMENTS[key as ClearableField];
        const hiddenElements = unhide ? s.hiddenElements.filter((k) => !unhide.includes(k)) : s.hiddenElements;
        return { ...s, [key]: value, hiddenElements };
      });
    },
    []
  );

  const updatePos = useCallback((key: ConformityElementKey, pos: { x: number; y: number }) => {
    setSheetRaw((s) => ({ ...s, layout: { ...s.layout, [key]: { ...s.layout[key], pos } } }));
  }, []);

  const updateStyle = useCallback((key: ConformityElementKey, patch: Partial<TextStyle>) => {
    setSheetRaw((s) => ({
      ...s,
      layout: { ...s.layout, [key]: { ...s.layout[key], style: { ...s.layout[key].style, ...patch } } },
    }));
  }, []);

  const updateImagePos = useCallback((id: string, pos: { x: number; y: number }) => {
    setImagesRaw((imgs) => imgs.map((img) => (img.id === id ? { ...img, layout: { ...img.layout, pos } } : img)));
  }, []);

  const updateImageLayout = useCallback((id: string, next: ImageLayout) => {
    setImagesRaw((imgs) => imgs.map((img) => (img.id === id ? { ...img, layout: next } : img)));
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      // accept files with no reported MIME type too — some mobile browsers
      // (notably iOS Safari for HEIC photos picked from the library) leave
      // file.type empty even though the OS picker already restricted the
      // selection to images via the input's accept="image/*"
      const files = Array.from(fileList).filter((f) => f.type === "" || f.type.startsWith("image/"));
      const room = MAX_IMAGES - images.length;
      if (room <= 0 || files.length === 0) return;
      commitSnapshot();
      files.slice(0, room).forEach((file) => {
        const id = `img_${Math.random().toString(36).slice(2, 10)}`;
        fileToImageSrc(file)
          .then((src) => {
            setImagesRaw((cur) =>
              cur.length >= MAX_IMAGES ? cur : [...cur, { id, src, layout: defaultImageLayout(cur.length) }]
            );
          })
          .catch(() => setToast(t.toastImageLoadFail));
      });
    },
    [images.length, commitSnapshot]
  );

  const removeImage = useCallback(
    (id: string) => {
      commitSnapshot();
      setImagesRaw((cur) => cur.filter((i) => i.id !== id));
      setSelectedImageId((cur) => (cur === id ? null : cur));
    },
    [commitSnapshot]
  );

  const fileName = `${sheet.production.trim().replace(/\s+/g, "_") || "confo_cadre"}`;

  const clearSelectionAndWait = useCallback(async () => {
    setSelected(null);
    setSelectedImageId(null);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, []);

  const handleExportPng = useCallback(async () => {
    if (!previewRef.current) return;
    await clearSelectionAndWait();
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(previewRef.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${fileName}.png`;
    a.click();
    setToast(t.toastPngExported);
  }, [fileName, clearSelectionAndWait]);

  const handleExportPdf = useCallback(async () => {
    if (!previewRef.current) return;
    await clearSelectionAndWait();
    const { toPng } = await import("html-to-image");
    const { jsPDF } = await import("jspdf");
    const dataUrl = await toPng(previewRef.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
    // the sheet's own box is locked to the A4-landscape ratio (see the padding-bottom
    // spacer below), so stretching it to fill a fixed landscape A4 page is always exact —
    // the PDF can never flip to portrait, no matter what content (image, long notes) is on it
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(dataUrl, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
    pdf.save(`${fileName}.pdf`);
    setToast(t.toastPdfExported);
  }, [fileName, clearSelectionAndWait]);

  const handlePrint = useCallback(async () => {
    await clearSelectionAndWait();
    window.print();
  }, [clearSelectionAndWait]);

  const handleReset = useCallback(() => {
    if (!window.confirm(t.confirmReset)) return;
    commitSnapshot();
    setSheetRaw({ ...EMPTY_SHEET, date: todayIso() });
    setImagesRaw([]);
    setSelected(null);
    setSelectedImageId(null);
    setToast(t.toastPageReset);
  }, [commitSnapshot]);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const ratio = ratioLabel(sheet);

  const rawElements: SheetElement[] = [
    { key: "production", value: sheet.production || t.sheetProductionPlaceholder, align: "left", uppercase: true },
    { key: "subtitle", value: sheet.subtitle, align: "right", uppercase: true },
    {
      key: "title",
      value: `${t.sheetTitle}${sheet.cameraLetter ? ` — ${t.sheetCamera} ${sheet.cameraLetter}` : ""}`,
      align: "center",
      uppercase: true,
    },
    { key: "specs1", value: [sheet.codec, sheet.resolution].filter(Boolean).join(" – "), align: "center", uppercase: true },
    { key: "specs2", value: [ratio, sheet.fps].filter(Boolean).join(" · "), align: "center", uppercase: true },
    { key: "cameraInfo", value: [sheet.cameraModel, sheet.cameraSerial].filter(Boolean).join(" "), align: "center" },
    { key: "lens", value: sheet.lens, align: "center" },
    { key: "distortion", value: sheet.distortion ? `${t.sheetDistortionPrefix}${sheet.distortion}` : "", align: "center" },
    { key: "notes", value: sheet.notes, align: "center" },
    { key: "chefOp", value: sheet.chefOp ? `${t.sheetChefOpPrefix}${sheet.chefOp}` : "", align: "left", uppercase: true },
    { key: "date", value: sheet.date ? `${t.sheetDatePrefix}${formatDateFr(sheet.date)}` : "", align: "right", uppercase: true },
  ];
  const elements = rawElements.filter((el) => {
    if (sheet.hiddenElements.includes(el.key)) return false;
    return el.key === "production" || el.key === "title" || el.value.trim() !== "";
  });

  const selectedImage = selectedImageId ? images.find((img) => img.id === selectedImageId) ?? null : null;

  return (
    <div className="flex min-h-screen flex-col bg-white lg:h-screen lg:overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b-[3px] border-black bg-white px-4 py-2.5">
        <Logo subtitle="CONFORMITY" />
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-2">
          <ComicButton onClick={handleReset}>{t.headerNew}</ComicButton>
          <ComicButton onClick={handleExportPng}>{t.headerExportPng}</ComicButton>
          <ComicButton onClick={handleExportPdf} variant="solid">
            {t.headerExportPdf}
          </ComicButton>
          <ComicButton onClick={handlePrint}>{t.headerPrint}</ComicButton>
          <LanguageMenu lang={lang} open={langMenuOpen} onToggle={() => setLangMenuOpen((o) => !o)} onSelect={(l) => { setLang(l); setLangMenuOpen(false); }} t={t} />
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 p-4 lg:grid-cols-[380px_1fr] lg:min-h-0">
        <div ref={sidebarRef} className="flex flex-col gap-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <p className="rounded-lg border-[2px] border-black/20 bg-black/[0.03] px-2.5 py-2 text-[11px] font-semibold text-black/60">
            {t.hint}
          </p>
          <Field label={t.fieldProduction}>
            <input
              className={inputClass}
              value={sheet.production}
              onFocus={beginFieldEdit}
              onBlur={endFieldEdit}
              onChange={(e) => update("production", e.target.value)}
              placeholder={t.fieldProductionPlaceholder}
            />
          </Field>
          <Field label={t.fieldSubtitle}>
            <input
              className={inputClass}
              value={sheet.subtitle}
              onFocus={beginFieldEdit}
              onBlur={endFieldEdit}
              onChange={(e) => update("subtitle", e.target.value)}
              placeholder={t.fieldSubtitlePlaceholder}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.fieldCamera}>
              <input
                className={inputClass}
                value={sheet.cameraLetter}
                onFocus={beginFieldEdit}
                onBlur={endFieldEdit}
                onChange={(e) => update("cameraLetter", e.target.value)}
                placeholder={t.fieldCameraPlaceholder}
              />
            </Field>
            <Field label={t.fieldChefOp}>
              <input
                className={inputClass}
                value={sheet.chefOp}
                onFocus={beginFieldEdit}
                onBlur={endFieldEdit}
                onChange={(e) => update("chefOp", e.target.value)}
              />
            </Field>
          </div>

          <Field label={t.fieldCameraModel}>
            <input
              className={inputClass}
              value={sheet.cameraModel}
              onFocus={beginFieldEdit}
              onBlur={endFieldEdit}
              onChange={(e) => update("cameraModel", e.target.value)}
              placeholder={t.fieldCameraModelPlaceholder}
            />
          </Field>
          <Field label={t.fieldCameraSerial}>
            <input
              className={inputClass}
              value={sheet.cameraSerial}
              onFocus={beginFieldEdit}
              onBlur={endFieldEdit}
              onChange={(e) => update("cameraSerial", e.target.value)}
              placeholder={t.fieldCameraSerialPlaceholder}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.fieldCodec}>
              <input
                className={inputClass}
                value={sheet.codec}
                onFocus={beginFieldEdit}
                onBlur={endFieldEdit}
                onChange={(e) => update("codec", e.target.value)}
                placeholder={t.fieldCodecPlaceholder}
              />
            </Field>
            <Field label={t.fieldResolution}>
              <input
                className={inputClass}
                value={sheet.resolution}
                onFocus={beginFieldEdit}
                onBlur={endFieldEdit}
                onChange={(e) => update("resolution", e.target.value)}
                placeholder={t.fieldResolutionPlaceholder}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.fieldRatio}>
              <select
                className={inputClass}
                value={sheet.ratioPreset}
                onChange={(e) => {
                  commitSnapshot();
                  update("ratioPreset", e.target.value);
                }}
              >
                {RATIO_PRESETS.map((r) => (
                  <option key={r} value={r}>
                    {ratioPresetLabel(r, t)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.fieldFps}>
              <input
                className={inputClass}
                value={sheet.fps}
                onFocus={beginFieldEdit}
                onBlur={endFieldEdit}
                onChange={(e) => update("fps", e.target.value)}
                placeholder={t.fieldFpsPlaceholder}
              />
            </Field>
          </div>
          {sheet.ratioPreset === "Personnalisé" && (
            <Field label={t.fieldRatioCustom}>
              <input
                className={inputClass}
                value={sheet.ratioCustom}
                onFocus={beginFieldEdit}
                onBlur={endFieldEdit}
                onChange={(e) => update("ratioCustom", e.target.value)}
                placeholder={t.fieldRatioCustomPlaceholder}
              />
            </Field>
          )}

          <Field label={t.fieldLens}>
            <input
              className={inputClass}
              value={sheet.lens}
              onFocus={beginFieldEdit}
              onBlur={endFieldEdit}
              onChange={(e) => update("lens", e.target.value)}
              placeholder={t.fieldLensPlaceholder}
            />
          </Field>
          <Field label={t.fieldDistortion}>
            <input
              className={inputClass}
              value={sheet.distortion}
              onFocus={beginFieldEdit}
              onBlur={endFieldEdit}
              onChange={(e) => update("distortion", e.target.value)}
              placeholder={t.fieldDistortionPlaceholder}
            />
          </Field>
          <Field label={t.fieldDate}>
            <input
              type="date"
              className={inputClass}
              value={sheet.date}
              onFocus={beginFieldEdit}
              onBlur={endFieldEdit}
              onChange={(e) => update("date", e.target.value)}
            />
          </Field>
          <Field label={t.fieldNotes}>
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={sheet.notes}
              onFocus={beginFieldEdit}
              onBlur={endFieldEdit}
              onChange={(e) => update("notes", e.target.value)}
              placeholder={t.fieldNotesPlaceholder}
            />
          </Field>

          <Field label={t.fieldImages(MAX_IMAGES)}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (images.length < MAX_IMAGES) setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() => images.length < MAX_IMAGES && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-[2.5px] border-dashed px-3 py-4 text-center text-xs font-semibold transition ${
                images.length >= MAX_IMAGES ? "cursor-not-allowed border-black/20 opacity-60" : "cursor-pointer"
              } ${dragActive ? "border-black bg-black/5" : "border-black/40"}`}
            >
              {images.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {images.map((img) => (
                    <div key={img.id} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element -- pasted/dropped image, not a static asset */}
                      <img
                        src={img.src}
                        alt={t.altPreview}
                        className="h-14 w-14 rounded border-[2px] border-black object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.id);
                        }}
                        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-black bg-white text-[10px] font-bold leading-none"
                        title={t.removeImageTitle}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <span className="text-black/60">
                {images.length >= MAX_IMAGES ? t.dropzoneMax(MAX_IMAGES) : t.dropzoneText}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          </Field>
        </div>

        <div className="flex items-start justify-center gap-4 lg:min-h-0">
          <div className="relative w-full max-w-3xl">
            {/* padding-bottom spacer locks the box to the A4-landscape ratio regardless of
                content height (an added image or long notes can never push it into portrait) */}
            <div style={{ paddingBottom: `${SHEET_RATIO_PCT}%` }} />
            <div
              ref={previewRef}
              data-sheet
              className="print-area absolute inset-0 select-none overflow-hidden border-[3px] border-black bg-white shadow-comic-lg"
            >
              {elements.map((el) => (
                <DraggableText
                  key={el.key}
                  el={el}
                  pos={sheet.layout[el.key].pos}
                  style={sheet.layout[el.key].style}
                  selected={selected === el.key}
                  onSelect={selectText}
                  onDrag={updatePos}
                  onDragStart={commitSnapshot}
                />
              ))}
              {images.map((img) => (
                <DraggableImage
                  key={img.id}
                  src={img.src}
                  layout={img.layout}
                  selected={selectedImageId === img.id}
                  onSelect={() => selectImage(img.id)}
                  onDrag={(pos) => updateImagePos(img.id, pos)}
                  onResize={(next) => updateImageLayout(img.id, next)}
                  onDragStart={commitSnapshot}
                  t={t}
                />
              ))}
            </div>
          </div>

          {/* on desktop, a normal flex sibling docked beside the sheet (the sheet shrinks
              to make room, so this never overlaps its border/corner); on mobile (no room
              to the right) it reverts to a fixed overlay in the bottom-right of the viewport */}
          <div
            data-floating-ui
            className="fixed bottom-4 right-4 z-40 grid w-24 shrink-0 grid-cols-2 gap-2 lg:static lg:self-end"
          >
            <RoundIconButton onClick={undo} disabled={past.length === 0} title={t.undoTitle}>
              <UndoIcon />
            </RoundIconButton>
            <RoundIconButton onClick={redo} disabled={future.length === 0} title={t.redoTitle}>
              <UndoIcon flipped />
            </RoundIconButton>
            <RoundIconButton
              onClick={deleteSelected}
              disabled={!selected && !selectedImageId}
              title={t.deleteTitle}
              variant="solid"
            >
              <TrashIcon />
            </RoundIconButton>
            <RoundIconButton
              onClick={toggleFullscreen}
              title={isFullscreen ? t.fullscreenExit : t.fullscreenEnter}
            >
              <FullscreenIcon active={isFullscreen} />
            </RoundIconButton>
          </div>
        </div>
      </div>

      {selected && (
        <StylePanel
          style={sheet.layout[selected].style}
          onChange={(patch) => updateStyle(selected, patch)}
          onClose={() => setSelected(null)}
          onSliderDragStart={commitSnapshot}
          t={t}
        />
      )}

      {selectedImage && (
        <ImageStylePanel
          layout={selectedImage.layout}
          onResize={(next) => updateImageLayout(selectedImage.id, next)}
          onClose={() => setSelectedImageId(null)}
          onSliderDragStart={commitSnapshot}
          t={t}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-lg border-[2.5px] border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-comic">
          {toast}
        </div>
      )}
    </div>
  );
}
