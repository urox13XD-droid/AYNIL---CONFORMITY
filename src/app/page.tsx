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
  clearDraft,
  loadDraft,
  ratioLabel,
  saveDraft,
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
}: {
  el: SheetElement;
  pos: { x: number; y: number };
  style: TextStyle;
  selected: boolean;
  onSelect: (key: ConformityElementKey) => void;
  onDrag: (key: ConformityElementKey, pos: { x: number; y: number }) => void;
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
}: {
  src: string;
  layout: ImageLayout;
  selected: boolean;
  onSelect: () => void;
  onDrag: (pos: { x: number; y: number }) => void;
  onResize: (next: ImageLayout) => void;
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
      <img src={src} alt="Référence de cadre" className="h-full w-full pointer-events-none object-contain" draggable={false} />
      <div
        onPointerDown={onPointerDownResize}
        title="Redimensionner"
        className="absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize rounded-sm border-[2px] border-black bg-white shadow-comic-sm"
      />
    </div>
  );
}

const SWATCHES = ["#000000", "#ffffff", "#dc2626", "#2563eb", "#16a34a", "#ca8a04"];

function StylePanel({
  style,
  onChange,
  onClose,
}: {
  style: TextStyle;
  onChange: (patch: Partial<TextStyle>) => void;
  onClose: () => void;
}) {
  return (
    <div
      data-style-panel
      className="fixed bottom-4 right-4 z-30 w-60 rounded-lg border-[2.5px] border-black bg-white p-3 shadow-comic-lg"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-xs font-bold uppercase tracking-wide">Style du texte</span>
        <button onClick={onClose} className="text-sm font-bold leading-none" title="Fermer">
          ×
        </button>
      </div>

      <label className="mb-1 block text-[10px] font-bold uppercase text-black/60">Police</label>
      <select
        className="mb-3 w-full rounded border-[1.5px] border-black px-1.5 py-1 text-xs"
        value={style.fontFamily}
        onChange={(e) => onChange({ fontFamily: e.target.value })}
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <label className="mb-1 block text-[10px] font-bold uppercase text-black/60">
        Taille — {style.fontSize}px
      </label>
      <input
        type="range"
        min={8}
        max={64}
        value={style.fontSize}
        onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
        className="mb-3 w-full"
      />

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => onChange({ bold: !style.bold })}
          className={`flex-1 rounded border-[1.5px] border-black py-1 text-sm font-bold ${
            style.bold ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          G
        </button>
        <button
          onClick={() => onChange({ italic: !style.italic })}
          className={`flex-1 rounded border-[1.5px] border-black py-1 text-sm italic ${
            style.italic ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          I
        </button>
      </div>

      <label className="mb-1 block text-[10px] font-bold uppercase text-black/60">Couleur</label>
      <div className="flex flex-wrap items-center gap-1.5">
        {SWATCHES.map((c) => (
          <button
            key={c}
            onClick={() => onChange({ color: c })}
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
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-6 w-8 cursor-pointer rounded border-[1.5px] border-black bg-transparent p-0"
          title="Couleur personnalisée"
        />
      </div>
    </div>
  );
}

export default function ConformityPage() {
  const [sheet, setSheet] = useState<ConformitySheetData>(EMPTY_SHEET);
  const [images, setImages] = useState<SheetImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<ConformityElementKey | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const draft = loadDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external store (localStorage) on mount
    setSheet(draft ?? { ...EMPTY_SHEET, date: todayIso() });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveDraft(sheet);
  }, [sheet, loaded]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!selected) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-style-panel]") || target.closest("[data-draggable-text]")) return;
      setSelected(null);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [selected]);

  useEffect(() => {
    if (!selectedImageId) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-image]")) return;
      setSelectedImageId(null);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [selectedImageId]);

  useEffect(() => {
    if (!selectedImageId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      e.preventDefault();
      setImages((imgs) => imgs.filter((img) => img.id !== selectedImageId));
      setSelectedImageId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedImageId]);

  const update = useCallback(
    <K extends keyof ConformitySheetData>(key: K, value: ConformitySheetData[K]) => {
      setSheet((s) => ({ ...s, [key]: value }));
    },
    []
  );

  const updatePos = useCallback((key: ConformityElementKey, pos: { x: number; y: number }) => {
    setSheet((s) => ({ ...s, layout: { ...s.layout, [key]: { ...s.layout[key], pos } } }));
  }, []);

  const updateStyle = useCallback((key: ConformityElementKey, patch: Partial<TextStyle>) => {
    setSheet((s) => ({
      ...s,
      layout: { ...s.layout, [key]: { ...s.layout[key], style: { ...s.layout[key].style, ...patch } } },
    }));
  }, []);

  const updateImagePos = useCallback((id: string, pos: { x: number; y: number }) => {
    setImages((imgs) => imgs.map((img) => (img.id === id ? { ...img, layout: { ...img.layout, pos } } : img)));
  }, []);

  const updateImageLayout = useCallback((id: string, next: ImageLayout) => {
    setImages((imgs) => imgs.map((img) => (img.id === id ? { ...img, layout: next } : img)));
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      const room = MAX_IMAGES - images.length;
      if (room <= 0 || files.length === 0) return;
      files.slice(0, room).forEach((file) => {
        const id = `img_${Math.random().toString(36).slice(2, 10)}`;
        const reader = new FileReader();
        reader.onload = () => {
          setImages((cur) =>
            cur.length >= MAX_IMAGES ? cur : [...cur, { id, src: String(reader.result), layout: defaultImageLayout(cur.length) }]
          );
        };
        reader.readAsDataURL(file);
      });
    },
    [images.length]
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
    setToast("PNG exporté");
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
    setToast("PDF exporté");
  }, [fileName, clearSelectionAndWait]);

  const handlePrint = useCallback(async () => {
    await clearSelectionAndWait();
    window.print();
  }, [clearSelectionAndWait]);

  const handleReset = useCallback(() => {
    if (!window.confirm("Réinitialiser la page ? Toutes les données saisies seront perdues.")) return;
    clearDraft();
    setSheet({ ...EMPTY_SHEET, date: todayIso() });
    setImages([]);
    setSelected(null);
    setSelectedImageId(null);
    setToast("Page réinitialisée");
  }, []);

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
    { key: "production", value: sheet.production || "Nom de la production", align: "left", uppercase: true },
    { key: "subtitle", value: sheet.subtitle, align: "right", uppercase: true },
    {
      key: "title",
      value: `Conformité de cadre${sheet.cameraLetter ? ` — Caméra ${sheet.cameraLetter}` : ""}`,
      align: "center",
      uppercase: true,
    },
    { key: "specs1", value: [sheet.codec, sheet.resolution].filter(Boolean).join(" – "), align: "center", uppercase: true },
    { key: "specs2", value: [ratio, sheet.fps].filter(Boolean).join(" · "), align: "center", uppercase: true },
    { key: "cameraInfo", value: [sheet.cameraModel, sheet.cameraSerial].filter(Boolean).join(" "), align: "center" },
    { key: "lens", value: sheet.lens, align: "center" },
    { key: "notes", value: sheet.notes, align: "center" },
    { key: "chefOp", value: sheet.chefOp ? `Chef opérateur : ${sheet.chefOp}` : "", align: "left", uppercase: true },
    { key: "date", value: sheet.date ? `Date : ${formatDateFr(sheet.date)}` : "", align: "right", uppercase: true },
  ];
  const elements = rawElements.filter(
    (el) => el.key === "production" || el.key === "title" || el.value.trim() !== ""
  );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex flex-wrap items-center gap-3 border-b-[3px] border-black bg-white px-4 py-2.5">
        <Logo subtitle="CONFORMITY" />
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-2">
          <ComicButton onClick={handleReset}>Nouveau</ComicButton>
          <ComicButton onClick={handleExportPng}>Export PNG</ComicButton>
          <ComicButton onClick={handleExportPdf} variant="solid">
            Export PDF
          </ComicButton>
          <ComicButton onClick={handlePrint}>Imprimer</ComicButton>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 p-4 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-3 lg:max-h-[calc(100vh-90px)] lg:overflow-y-auto lg:pr-1">
          <p className="rounded-lg border-[2px] border-black/20 bg-black/[0.03] px-2.5 py-2 text-[11px] font-semibold text-black/60">
            Astuce : sur l&apos;aperçu à droite, faites glisser un texte pour le repositionner, ou cliquez dessus
            pour changer sa police, sa taille, son style et sa couleur. Chaque image se déplace aussi, se
            redimensionne par sa poignée en bas à droite, et se supprime avec Retour arrière une fois cliquée.
          </p>
          <Field label="Nom de la production">
            <input
              className={inputClass}
              value={sheet.production}
              onChange={(e) => update("production", e.target.value)}
              placeholder="Ex. Pax Massilia"
            />
          </Field>
          <Field label="Référence / épisode / bloc">
            <input
              className={inputClass}
              value={sheet.subtitle}
              onChange={(e) => update("subtitle", e.target.value)}
              placeholder="Ex. S3 Bloc 2"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Caméra">
              <input
                className={inputClass}
                value={sheet.cameraLetter}
                onChange={(e) => update("cameraLetter", e.target.value)}
                placeholder="A"
              />
            </Field>
            <Field label="Chef opérateur">
              <input
                className={inputClass}
                value={sheet.chefOp}
                onChange={(e) => update("chefOp", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Modèle caméra">
            <input
              className={inputClass}
              value={sheet.cameraModel}
              onChange={(e) => update("cameraModel", e.target.value)}
              placeholder="Ex. ARRI Alexa 35"
            />
          </Field>
          <Field label="N° de série">
            <input
              className={inputClass}
              value={sheet.cameraSerial}
              onChange={(e) => update("cameraSerial", e.target.value)}
              placeholder="Ex. #65706"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Codec">
              <input
                className={inputClass}
                value={sheet.codec}
                onChange={(e) => update("codec", e.target.value)}
                placeholder="ARRIRAW"
              />
            </Field>
            <Field label="Résolution">
              <input
                className={inputClass}
                value={sheet.resolution}
                onChange={(e) => update("resolution", e.target.value)}
                placeholder="4.6K"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ratio image">
              <select
                className={inputClass}
                value={sheet.ratioPreset}
                onChange={(e) => update("ratioPreset", e.target.value)}
              >
                {RATIO_PRESETS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cadence">
              <input
                className={inputClass}
                value={sheet.fps}
                onChange={(e) => update("fps", e.target.value)}
                placeholder="25 fps"
              />
            </Field>
          </div>
          {sheet.ratioPreset === "Personnalisé" && (
            <Field label="Ratio personnalisé">
              <input
                className={inputClass}
                value={sheet.ratioCustom}
                onChange={(e) => update("ratioCustom", e.target.value)}
                placeholder="Ex. 1.66:1"
              />
            </Field>
          )}

          <Field label="Objectif">
            <input
              className={inputClass}
              value={sheet.lens}
              onChange={(e) => update("lens", e.target.value)}
              placeholder="Ex. Leitz Summicron-C 50mm"
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              className={inputClass}
              value={sheet.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </Field>
          <Field label="Réglages / notes complémentaires">
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={sheet.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Tout réglage à préciser pour la post-prod…"
            />
          </Field>

          <Field label={`Images de référence (optionnel, max ${MAX_IMAGES})`}>
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
                        alt="Aperçu"
                        className="h-14 w-14 rounded border-[2px] border-black object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImages((cur) => cur.filter((i) => i.id !== img.id));
                          if (selectedImageId === img.id) setSelectedImageId(null);
                        }}
                        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-black bg-white text-[10px] font-bold leading-none"
                        title="Retirer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <span className="text-black/60">
                {images.length >= MAX_IMAGES
                  ? `Maximum ${MAX_IMAGES} images atteint`
                  : "Glissez-déposez une ou plusieurs images ici, ou cliquez pour parcourir"}
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

        <div className="flex items-start justify-center">
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
                  onSelect={setSelected}
                  onDrag={updatePos}
                />
              ))}
              {images.map((img) => (
                <DraggableImage
                  key={img.id}
                  src={img.src}
                  layout={img.layout}
                  selected={selectedImageId === img.id}
                  onSelect={() => setSelectedImageId(img.id)}
                  onDrag={(pos) => updateImagePos(img.id, pos)}
                  onResize={(next) => updateImageLayout(img.id, next)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <StylePanel
          style={sheet.layout[selected].style}
          onChange={(patch) => updateStyle(selected, patch)}
          onClose={() => setSelected(null)}
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
