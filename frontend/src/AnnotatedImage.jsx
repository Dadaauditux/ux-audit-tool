import React, { useRef, useState, useEffect, useMemo } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from "react-konva";
import useImage from "use-image";

/* ===== Constantes & helpers (hors composant => pas de warning hooks) ===== */
const COLORS = {
  text: "orange",
  contrast: "red",
  button: "blue",
  "heading-hierarchy": "purple",
  spacing: "green",
  alignment: "pink",
};

function computeStageSize(image, availableWidth) {
  if (!image || !availableWidth) {
    return { width: 0, height: 0, scale: 1 };
  }
  // pas de sur-échantillonnage au-delà de 100 %
  const scale = Math.min(1, availableWidth / image.width);
  return {
    width: Math.round(image.width * scale),
    height: Math.round(image.height * scale),
    scale,
  };
}

/**
 * AnnotatedImage
 * - S'adapte à la largeur disponible (mobile/desktop)
 * - Conserve les coordonnées d'origine (on scale la Stage)
 * - Si `containerWidth` est passé on l'utilise, sinon on observe la div conteneur
 */
export default function AnnotatedImage({ src, issues = [], containerWidth }) {
  const [image] = useImage(src);
  const containerRef = useRef(null);

  const [stageSize, setStageSize] = useState({
    width: 0,
    height: 0,
    scale: 1,
  });

  // Si containerWidth est fourni par le parent, on l'applique
  useEffect(() => {
    if (!image) return;
    if (containerWidth) {
      setStageSize(computeStageSize(image, containerWidth));
    }
  }, [image, containerWidth]);

  // Sinon, on observe la largeur réelle du conteneur
  useEffect(() => {
    if (!image || containerWidth) return;
    const el = containerRef.current;
    if (!el) return;

    const compute = () => setStageSize(computeStageSize(image, el.clientWidth));
    compute();

    let ro;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(compute);
      ro.observe(el);
    } else {
      window.addEventListener("resize", compute);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", compute);
    };
  }, [image, containerWidth]);

  // Taille de police des étiquettes: stable visuellement même quand on scale
  const labelFontSize = useMemo(() => {
    const base = 12; // taille "logique"
    return base / (stageSize.scale || 1);
  }, [stageSize.scale]);

  if (!image) {
    return <p style={{ margin: "8px 0" }}>Chargement de l'image…</p>;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        overflow: "hidden",
        borderRadius: 12,
        background: "#fff",
      }}
    >
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        scaleX={stageSize.scale}
        scaleY={stageSize.scale}
      >
        <Layer>
          {/* L'image originale ; on ne change pas ses coordonnées, on scale la Stage */}
          <KonvaImage image={image} />

          {/* Annotations */}
          {issues.map((issue, i) => {
            const { x = 0, y = 0, w = 0, h = 0 } = issue.boundingBox || {};
            const color = COLORS[issue.type] || "black";
            const strokeWidth =
              issue.severity === "high" ? 3 : issue.severity === "medium" ? 2 : 1;

            const message = issue.message || "Issue";
            // largeur cartouche (coordonnées non-scalées)
            const labelWidth = Math.max(message.length * 7 + 12, 64);
            const labelHeight = 22;
            const labelY = Math.max(y - (labelHeight + 2), 0);

            return (
              <Group key={i}>
                {/* Cadre sur la zone */}
                <Rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  dash={[4, 4]}
                  cornerRadius={4}
                  listening={false}
                />

                {/* Étiquette (fond + texte) */}
                <Group x={x} y={labelY} listening={false}>
                  <Rect
                    width={labelWidth}
                    height={labelHeight}
                    fill={color}
                    opacity={0.9}
                    cornerRadius={6}
                  />
                  <Text
                    text={message}
                    fontSize={labelFontSize}
                    fill="#fff"
                    padding={6}
                  />
                </Group>
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
