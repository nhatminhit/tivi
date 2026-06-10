"use client";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import QRCode from "qrcode";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Download,
  Copy,
  Check,
  QrCode,
  LinkIcon,
  Sparkles,
  Palette,
  Shapes,
  Frame,
  Settings2,
  ImageIcon,
  X,
} from "lucide-react";

// ── Types ──
type QRShape = "square" | "rounded" | "dots" | "diamond";
type FrameStyle = "none" | "rounded" | "square" | "circle";
type EccLevel = "L" | "M" | "Q" | "H";
type GradientDir = "vertical" | "horizontal" | "diagonal";

interface QROptions {
  url: string;
  shape: QRShape;
  fgColor: string;
  bgColor: string;
  gradientEnabled: boolean;
  gradientColor2: string;
  gradientDir: GradientDir;
  frame: FrameStyle;
  frameColor: string;
  ecc: EccLevel;
  size: number;
  logoUrl: string | null;
  margin: number;
}

// ── Preset templates ──
const PRESETS: { label: string; opts: Partial<QROptions>; preview: string }[] = [
  {
    label: "Sáng / Tối",
    opts: { fgColor: "#FFFFFF", bgColor: "#0F172A", shape: "square", frame: "none", gradientEnabled: false },
    preview: "bg-slate-900",
  },
  {
    label: "Gradient tím",
    opts: { fgColor: "#7C3AED", bgColor: "#F5F3FF", shape: "rounded", gradientEnabled: true, gradientColor2: "#3B82F6", gradientDir: "diagonal", frame: "rounded", frameColor: "#7C3AED" },
    preview: "bg-violet-100",
  },
  {
    label: "Gradient hồng",
    opts: { fgColor: "#EC4899", bgColor: "#FFF1F2", shape: "dots", gradientEnabled: true, gradientColor2: "#F97316", gradientDir: "horizontal", frame: "circle", frameColor: "#EC4899" },
    preview: "bg-pink-100",
  },
  {
    label: "Emerald xanh",
    opts: { fgColor: "#059669", bgColor: "#ECFDF5", shape: "rounded", gradientEnabled: true, gradientColor2: "#0EA5E9", gradientDir: "vertical", frame: "rounded", frameColor: "#059669" },
    preview: "bg-emerald-50",
  },
  {
    label: "Gold luxury",
    opts: { fgColor: "#D97706", bgColor: "#1C1917", shape: "diamond", gradientEnabled: true, gradientColor2: "#F59E0B", gradientDir: "diagonal", frame: "square", frameColor: "#D97706" },
    preview: "bg-stone-900",
  },
  {
    label: "Minimal đen",
    opts: { fgColor: "#18181B", bgColor: "#FFFFFF", shape: "square", gradientEnabled: false, frame: "none" },
    preview: "bg-white border border-zinc-200",
  },
  {
    label: "Ocean blue",
    opts: { fgColor: "#2563EB", bgColor: "#EFF6FF", shape: "rounded", gradientEnabled: true, gradientColor2: "#7C3AED", gradientDir: "diagonal", frame: "rounded", frameColor: "#2563EB" },
    preview: "bg-blue-50",
  },
  {
    label: "Sunset orange",
    opts: { fgColor: "#EA580C", bgColor: "#FFF7ED", shape: "dots", gradientEnabled: true, gradientColor2: "#DC2626", gradientDir: "horizontal", frame: "circle", frameColor: "#EA580C" },
    preview: "bg-orange-50",
  },
];

const SHAPE_OPTIONS: { value: QRShape; label: string }[] = [
  { value: "square", label: "Vuông" },
  { value: "rounded", label: "Bo tròn" },
  { value: "dots", label: "Chấm tròn" },
  { value: "diamond", label: "Kim cương" },
];

const FRAME_OPTIONS: { value: FrameStyle; label: string }[] = [
  { value: "none", label: "Không" },
  { value: "rounded", label: "Bo tròn" },
  { value: "square", label: "Vuông" },
  { value: "circle", label: "Tròn" },
];

const ECC_OPTIONS: { value: EccLevel; label: string; desc: string }[] = [
  { value: "L", label: "L", desc: "7%" },
  { value: "M", label: "M", desc: "15%" },
  { value: "Q", label: "Q", desc: "25%" },
  { value: "H", label: "H", desc: "30%" },
];

const SIZE_OPTIONS = [
  { value: 200, label: "S (200px)" },
  { value: 300, label: "M (300px)" },
  { value: 400, label: "L (400px)" },
  { value: 600, label: "XL (600px)" },
];

// ── SVG QR Renderer with shape support ──
function QRCodePreview({ options }: { options: QROptions }) {
  const { url, shape, fgColor, bgColor, gradientEnabled, gradientColor2, gradientDir, frame, frameColor, ecc, size, logoUrl, margin } = options;

  const matrix = useMemo(() => {
    if (!url) return null;
    try {
      const qr = QRCode.create(url, { errorCorrectionLevel: ecc });
      return qr.modules;
    } catch {
      return null;
    }
  }, [url, ecc]);

  if (!matrix || !url) return null;

  const moduleCount = matrix.size;
  const cellSize = size / (moduleCount + margin * 2);
  const marginPx = cellSize * margin;
  const totalSize = size;

  const gradientId = "qr-gradient";
  const gradAttrs = gradientEnabled
    ? { x1: "0%", y1: "0%", x2: gradientDir === "horizontal" ? "100%" : "0%", y2: gradientDir === "vertical" ? "100%" : "100%" }
    : { x1: "0%", y1: "0%", x2: "100%", y2: "100%" };

  // Find 3 finder patterns (top-left, top-right, bottom-left) to exclude from shape rendering
  const isFinderPattern = (row: number, col: number): boolean => {
    const s = moduleCount;
    // Top-left: 0-6, 0-6
    if (row <= 6 && col <= 6) return true;
    // Top-right: 0-6, s-7..s-1
    if (row <= 6 && col >= s - 7) return true;
    // Bottom-left: s-7..s-1, 0-6
    if (row >= s - 7 && col <= 6) return true;
    return false;
  };

  const isFinderBorder = (row: number, col: number): boolean => {
    const s = moduleCount;
    const inTopLeft = row <= 7 && col <= 7;
    const inTopRight = row <= 7 && col >= s - 8;
    const inBottomLeft = row >= s - 8 && col <= 7;
    return inTopLeft || inTopRight || inBottomLeft;
  };

  const renderShape = (row: number, col: number, x: number, y: number, isFinder: boolean) => {
    const c = fgColor;
    const halfCell = cellSize * 0.9;

    // Finder patterns always use square with slight rounding
    if (isFinder) {
      const rx = shape === "rounded" ? cellSize * 0.15 : 0;
      return (
        <rect key={`${row}-${col}`} x={x} y={y} width={halfCell} height={halfCell} rx={rx} fill={`url(#${gradientId})`} />
      );
    }

    switch (shape) {
      case "dots":
        return (
          <circle key={`${row}-${col}`} cx={x + cellSize / 2} cy={y + cellSize / 2} r={cellSize * 0.38} fill={`url(#${gradientId})`} />
        );
      case "rounded":
        return (
          <rect key={`${row}-${col}`} x={x} y={y} width={halfCell} height={halfCell} rx={cellSize * 0.22} fill={`url(#${gradientId})`} />
        );
      case "diamond": {
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        const r = cellSize * 0.42;
        return (
          <polygon key={`${row}-${col}`} points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`} fill={`url(#${gradientId})`} />
        );
      }
      default: // square
        return (
          <rect key={`${row}-${col}`} x={x} y={y} width={halfCell} height={halfCell} fill={`url(#${gradientId})`} />
        );
    }
  };

  const modules: React.ReactNode[] = [];
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!matrix.get(row, col)) continue;
      const x = marginPx + col * cellSize;
      const y = marginPx + row * cellSize;
      const finder = isFinderPattern(row, col);
      modules.push(renderShape(row, col, x, y, finder));
    }
  }

  // Frame border
  const framePadding = frame === "none" ? 0 : cellSize * 1.5;
  const svgSize = totalSize + framePadding * 2;
  const qrOffset = framePadding;

  const frameBorder = (() => {
    if (frame === "none") return null;
    const fr = cellSize * 1;
    switch (frame) {
      case "rounded":
        return <rect x={fr / 2} y={fr / 2} width={svgSize - fr} height={svgSize - fr} rx={cellSize * 2} ry={cellSize * 2} fill="none" stroke={frameColor} strokeWidth={cellSize * 0.6} />;
      case "square":
        return <rect x={fr / 2} y={fr / 2} width={svgSize - fr} height={svgSize - fr} fill="none" stroke={frameColor} strokeWidth={cellSize * 0.6} />;
      case "circle":
        return <circle cx={svgSize / 2} cy={svgSize / 2} r={(svgSize - fr) / 2} fill="none" stroke={frameColor} strokeWidth={cellSize * 0.6} />;
      default:
        return null;
    }
  })();

  return (
    <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradientId} {...gradAttrs}>
          <stop offset="0%" stopColor={fgColor} />
          <stop offset="100%" stopColor={gradientEnabled ? gradientColor2 : fgColor} />
        </linearGradient>
      </defs>
      {/* Background */}
      {frame !== "none" && (
        <rect width={svgSize} height={svgSize} rx={frame === "circle" ? svgSize / 2 : cellSize * 2} fill={bgColor} />
      )}
      {frameBorder}
      {/* QR modules */}
      <g transform={`translate(${qrOffset},${qrOffset})`}>
        <rect width={totalSize} height={totalSize} rx={cellSize} fill={bgColor} />
        {modules}
      </g>
      {/* Logo */}
      {logoUrl && (
        <g transform={`translate(${qrOffset},${qrOffset})`}>
          <rect
            x={totalSize / 2 - cellSize * 3.5}
            y={totalSize / 2 - cellSize * 3.5}
            width={cellSize * 7}
            height={cellSize * 7}
            rx={cellSize * 1.2}
            fill={bgColor}
          />
          <image
            href={logoUrl}
            x={totalSize / 2 - cellSize * 3}
            y={totalSize / 2 - cellSize * 3}
            width={cellSize * 6}
            height={cellSize * 6}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      )}
    </svg>
  );
}

// ── Download as PNG via canvas ──
function downloadQR(options: QROptions) {
  const svg = document.getElementById("qr-export-svg")?.querySelector("svg");
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const img = new Image();
  img.onload = () => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}

// ── Main Page ──
export default function QRPage() {
  const [url, setUrl] = useState("");
  const [shape, setShape] = useState<QRShape>("square");
  const [fgColor, setFgColor] = useState("#FFFFFF");
  const [bgColor, setBgColor] = useState("#0F172A");
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientColor2, setGradientColor2] = useState("#3B82F6");
  const [gradientDir, setGradientDir] = useState<GradientDir>("diagonal");
  const [frame, setFrame] = useState<FrameStyle>("none");
  const [frameColor, setFrameColor] = useState("#7C3AED");
  const [ecc, setEcc] = useState<EccLevel>("H");
  const [size, setSize] = useState(400);
  const [margin, setMargin] = useState(2);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Active tab in settings panel
  const [activeTab, setActiveTab] = useState<"style" | "frame" | "settings">("style");

  useEffect(() => setMounted(true), []);

  const options: QROptions = useMemo(() => ({
    url, shape, fgColor, bgColor, gradientEnabled, gradientColor2, gradientDir, frame, frameColor, ecc, size, logoUrl, margin,
  }), [url, shape, fgColor, bgColor, gradientEnabled, gradientColor2, gradientDir, frame, frameColor, ecc, size, logoUrl, margin]);

  const isValid = url.trim().length > 0;

  const handleCopyUrl = useCallback(() => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    const o = preset.opts;
    if (o.fgColor) setFgColor(o.fgColor);
    if (o.bgColor) setBgColor(o.bgColor);
    if (o.shape) setShape(o.shape);
    if (o.frame) setFrame(o.frame);
    if (o.frameColor) setFrameColor(o.frameColor);
    if (o.gradientEnabled !== undefined) setGradientEnabled(o.gradientEnabled);
    if (o.gradientColor2) setGradientColor2(o.gradientColor2);
    if (o.gradientDir) setGradientDir(o.gradientDir);
  }, []);

  const tabs = [
    { key: "style" as const, label: "Màu sắc", icon: Palette },
    { key: "frame" as const, label: "Khung", icon: Frame },
    { key: "settings" as const, label: "Tuỳ chỉnh", icon: Settings2 },
  ];

  return (
    <div className="min-h-[calc(100dvh-4rem)] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary/8 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container py-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-primary font-medium">
            <QrCode className="h-3.5 w-3.5" />
            Tạo mã QR
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Tạo mã QR <span className="text-primary">cho link</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Tùy chỉnh màu sắc, kiểu dáng, khung viền và logo cho mã QR của bạn.
          </p>
        </div>

        {/* URL Input */}
        <div className="glass-card rounded-2xl p-5 mb-6 max-w-2xl mx-auto">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-primary" />
              Đường dẫn
            </label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com..."
                className="flex-1 h-12 glass rounded-xl border-white/5 focus:border-primary/50 focus:ring-primary/25 text-sm"
              />
              <Button variant="ghost" size="icon" onClick={handleCopyUrl} disabled={!isValid}
                className="h-12 w-12 glass rounded-xl hover:bg-white/5 shrink-0" title="Copy link">
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Preset Templates */}
        <div className="mb-6 max-w-2xl mx-auto">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3 block">Mẫu có sẵn</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="group flex flex-col items-center gap-1.5 p-2 rounded-xl glass border-white/5 hover:border-primary/30 transition-all"
              >
                <div className={`w-8 h-8 rounded-lg ${p.preview} flex items-center justify-center`}>
                  <QrCode className="h-3.5 w-3.5 opacity-60" />
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main layout: Settings + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Settings panels */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab bar */}
            <div className="flex gap-1 glass rounded-xl p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === t.key
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Style tab */}
            {activeTab === "style" && (
              <div className="glass-card rounded-2xl p-5 space-y-5">
                {/* Shape */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                    <Shapes className="h-3.5 w-3.5" />
                    Kiểu dáng module
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {SHAPE_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setShape(s.value)}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-xs font-medium transition-all ${
                          shape === s.value
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "glass border-white/5 text-muted-foreground hover:text-foreground hover:border-white/15"
                        }`}
                      >
                        <ShapeIcon shape={s.value} active={shape === s.value} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-3">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5" />
                    Màu sắc
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-muted-foreground">Mã QR</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)}
                          className="h-8 w-8 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                        <span className="text-[11px] text-muted-foreground font-mono">{fgColor}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-muted-foreground">Nền</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                          className="h-8 w-8 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                        <span className="text-[11px] text-muted-foreground font-mono">{bgColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gradient */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Gradient</label>
                    <button
                      onClick={() => setGradientEnabled(!gradientEnabled)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${gradientEnabled ? "bg-primary" : "bg-white/10"}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${gradientEnabled ? "left-5.5" : "left-0.5"}`} />
                    </button>
                  </div>
                  {gradientEnabled && (
                    <div className="space-y-3 pl-0">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-muted-foreground">Màu 1</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)}
                              className="h-8 w-8 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                            <span className="text-[11px] text-muted-foreground font-mono">{fgColor}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-muted-foreground">Màu 2</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={gradientColor2} onChange={(e) => setGradientColor2(e.target.value)}
                              className="h-8 w-8 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                            <span className="text-[11px] text-muted-foreground font-mono">{gradientColor2}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-muted-foreground">Hướng</label>
                        <div className="flex gap-2">
                          {([["vertical", "↕"], ["horizontal", "↔"], ["diagonal", "⤡"]] as const).map(([d, arrow]) => (
                            <button
                              key={d}
                              onClick={() => setGradientDir(d)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                gradientDir === d ? "bg-primary/15 text-primary border border-primary/30" : "glass border-white/5 text-muted-foreground"
                              }`}
                            >
                              {arrow} {d === "vertical" ? "Dọc" : d === "horizontal" ? "Ngang" : "Chéo"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick colors */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Màu nhanh</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { fg: "#FFFFFF", bg: "#0F172A" },
                      { fg: "#000000", bg: "#FFFFFF" },
                      { fg: "#7C3AED", bg: "#F5F3FF" },
                      { fg: "#059669", bg: "#ECFDF5" },
                      { fg: "#DC2626", bg: "#FEF2F2" },
                      { fg: "#2563EB", bg: "#EFF6FF" },
                      { fg: "#D97706", bg: "#1C1917" },
                      { fg: "#EC4899", bg: "#FDF2F8" },
                      { fg: "#0EA5E9", bg: "#F0F9FF" },
                      { fg: "#18181B", bg: "#FFFFFF" },
                    ].map((c, i) => (
                      <button
                        key={i}
                        onClick={() => { setFgColor(c.fg); setBgColor(c.bg); }}
                        className="h-8 rounded-lg border border-white/10 hover:border-white/25 transition-colors relative overflow-hidden group"
                        title={`${c.fg} / ${c.bg}`}
                      >
                        <div className="absolute inset-0" style={{ background: c.bg }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-sm" style={{ background: c.fg }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Frame tab */}
            {activeTab === "frame" && (
              <div className="glass-card rounded-2xl p-5 space-y-5">
                {/* Frame style */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                    <Frame className="h-3.5 w-3.5" />
                    Khung viền
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {FRAME_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setFrame(f.value)}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-xs font-medium transition-all ${
                          frame === f.value
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "glass border-white/5 text-muted-foreground hover:text-foreground hover:border-white/15"
                        }`}
                      >
                        <FrameIcon style={f.value} active={frame === f.value} />
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {frame !== "none" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-muted-foreground">Màu khung</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={frameColor} onChange={(e) => setFrameColor(e.target.value)}
                        className="h-8 w-8 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                      <span className="text-[11px] text-muted-foreground font-mono">{frameColor}</span>
                    </div>
                  </div>
                )}

                {/* Logo */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Logo trung tâm
                  </label>
                  <div className="flex gap-2">
                    <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <Button
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      className="flex-1 h-10 glass rounded-xl border-white/10 hover:bg-white/5 text-xs"
                    >
                      <ImageIcon className="h-3.5 w-3.5 mr-2" />
                      {logoUrl ? "Đổi logo" : "Chọn logo"}
                    </Button>
                    {logoUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLogoUrl(null)}
                        className="h-10 w-10 glass rounded-xl hover:bg-red-500/10 shrink-0"
                      >
                        <X className="h-4 w-4 text-red-400" />
                      </Button>
                    )}
                  </div>
                  {logoUrl && (
                    <div className="flex items-center gap-2 p-2 glass rounded-lg">
                      <img src={logoUrl} alt="Logo preview" className="h-8 w-8 rounded object-contain" />
                      <span className="text-[11px] text-muted-foreground">Logo sẽ hiển thị giữa mã QR</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings tab */}
            {activeTab === "settings" && (
              <div className="glass-card rounded-2xl p-5 space-y-5">
                {/* Size */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Kích thước tải về</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SIZE_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSize(s.value)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          size === s.value
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "glass border-white/5 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Margin */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Khoảng trắng: {margin}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={1}
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0</span><span>5</span>
                  </div>
                </div>

                {/* ECC */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Hiệu chỉnh lỗi (ECC)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {ECC_OPTIONS.map((e) => (
                      <button
                        key={e.value}
                        onClick={() => setEcc(e.value)}
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-xs font-medium transition-all ${
                          ecc === e.value
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "glass border-white/5 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="font-bold">{e.label}</span>
                        <span className="text-[10px] opacity-60">{e.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: QR Preview */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-6 sticky top-24">
              {isValid ? (
                <>
                  {/* Preview */}
                  <div className="flex items-center justify-center p-6 rounded-2xl" style={{ background: bgColor }}>
                    <QRCodePreview options={options} />
                  </div>

                  {/* Hidden SVG for export */}
                  <div id="qr-export-svg" className="hidden">
                    <QRCodePreview options={options} />
                  </div>

                  <p className="text-xs text-muted-foreground text-center max-w-sm break-all font-mono leading-relaxed">
                    {url}
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-3 w-full max-w-xs">
                    <Button
                      onClick={() => downloadQR(options)}
                      className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Tải PNG
                    </Button>
                    <Button
                      onClick={handleCopyUrl}
                      variant="outline"
                      className="flex-1 h-11 rounded-xl glass border-white/10 hover:bg-white/5 font-medium"
                    >
                      {copied ? (
                        <><Check className="h-4 w-4 mr-2 text-green-400" /> Đã copy</>
                      ) : (
                        <><Copy className="h-4 w-4 mr-2" /> Copy link</>
                      )}
                    </Button>
                  </div>

                  {/* Info badges */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-2.5 py-1 rounded-full glass text-[10px] text-muted-foreground">
                      Shape: {SHAPE_OPTIONS.find(s => s.value === shape)?.label}
                    </span>
                    {frame !== "none" && (
                      <span className="px-2.5 py-1 rounded-full glass text-[10px] text-muted-foreground">
                        Frame: {FRAME_OPTIONS.find(f => f.value === frame)?.label}
                      </span>
                    )}
                    {gradientEnabled && (
                      <span className="px-2.5 py-1 rounded-full glass text-[10px] text-muted-foreground">
                        Gradient
                      </span>
                    )}
                    {logoUrl && (
                      <span className="px-2.5 py-1 rounded-full glass text-[10px] text-muted-foreground">
                        Logo
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full glass text-[10px] text-muted-foreground">
                      ECC: {ecc}
                    </span>
                    <span className="px-2.5 py-1 rounded-full glass text-[10px] text-muted-foreground">
                      {size}px
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 space-y-4">
                  <div className="h-20 w-20 rounded-2xl glass flex items-center justify-center mx-auto">
                    <QrCode className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Nhập đường dẫn để tạo mã QR</p>
                    <p className="text-xs text-muted-foreground/60">Hỗ trợ URL website, link kênh IPTV, hoặc bất kỳ nội dung nào</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick fill */}
        {mounted && (
          <div className="text-center mt-6">
            <button
              onClick={() => setUrl(window.location.href)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Tạo QR cho trang này
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mini shape icons ──
function ShapeIcon({ shape, active }: { shape: QRShape; active: boolean }) {
  const color = active ? "text-primary" : "text-muted-foreground";
  const size = 16;
  switch (shape) {
    case "square":
      return <svg width={size} height={size} viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="currentColor" className={color} /></svg>;
    case "rounded":
      return <svg width={size} height={size} viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="3" fill="currentColor" className={color} /></svg>;
    case "dots":
      return <svg width={size} height={size} viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="currentColor" className={color} /></svg>;
    case "diamond":
      return <svg width={size} height={size} viewBox="0 0 16 16"><polygon points="8,1 15,8 8,15 1,8" fill="currentColor" className={color} /></svg>;
  }
}

// ── Mini frame icons ──
function FrameIcon({ style, active }: { style: FrameStyle; active: boolean }) {
  const color = active ? "text-primary" : "text-muted-foreground";
  const size = 16;
  if (style === "none") {
    return <svg width={size} height={size} viewBox="0 0 16 16"><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" className={color} strokeWidth="1.5" /></svg>;
  }
  switch (style) {
    case "rounded":
      return <svg width={size} height={size} viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" rx="3" fill="none" stroke="currentColor" className={color} strokeWidth="1.5" /></svg>;
    case "square":
      return <svg width={size} height={size} viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" fill="none" stroke="currentColor" className={color} strokeWidth="1.5" /></svg>;
    case "circle":
      return <svg width={size} height={size} viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" className={color} strokeWidth="1.5" /></svg>;
  }
}
