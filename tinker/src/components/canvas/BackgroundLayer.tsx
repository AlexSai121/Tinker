import { memo, useMemo } from "react";
import { Layer, Rect } from "react-konva";
import { useUiStore } from "../../stores/uiStore";

const TEXTURES_DARK: Record<string, string> = {
  pegboard: "#181715",
  concrete: "#1f1e1b",
  butcher_block: "#252320",
  grid_paper: "#181715",
};

const TEXTURES_LIGHT: Record<string, string> = {
  pegboard: "#faf9f5",
  concrete: "#f5f0e8",
  butcher_block: "#efe9de",
  grid_paper: "#faf9f5",
};

export const BackgroundLayer = memo(function BackgroundLayer({ texture }: { texture: string }) {
  const resolvedTheme = useUiStore((s) => s.resolvedTheme);
  const isLight = resolvedTheme === "light";
  const palette = isLight ? TEXTURES_LIGHT : TEXTURES_DARK;
  const color = palette[texture] ?? palette.pegboard;
  const dotColor = isLight ? "rgba(20,20,19,0.07)" : "rgba(250,249,245,0.07)";
  const lineColor = isLight ? "rgba(20,20,19,0.055)" : "rgba(250,249,245,0.045)";
  
  const gridPattern = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 48; 
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (texture === "pegboard") {
      ctx.fillStyle = dotColor;
      for (let x = 12; x < canvas.width; x += 24) {
        for (let y = 12; y < canvas.height; y += 24) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (texture === "grid_paper") {
      ctx.strokeStyle = dotColor;
      ctx.lineWidth = 1;
      for (let offset = 0; offset <= canvas.width; offset += 12) {
        ctx.beginPath();
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, offset);
        ctx.lineTo(canvas.width, offset);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }, [color, dotColor, lineColor, texture]);

  return (
    <Layer>
      <Rect x={-50000} y={-50000} width={100000} height={100000} fill={color} />
      {gridPattern && (
        <Rect 
          name="canvas-background"
          x={-50000} 
          y={-50000} 
          width={100000} 
          height={100000}
          fillPatternImage={gridPattern as unknown as HTMLImageElement} 
          fillPatternRepeat="repeat" 
        />
      )}
    </Layer>
  );
});
