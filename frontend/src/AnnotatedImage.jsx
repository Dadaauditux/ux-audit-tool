// AnnotatedImage.jsx
import React from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from "react-konva";
import useImage from "use-image";

// Palette de couleurs
const COLORS = {
  text: { stroke: "orange", fill: "rgba(255,165,0,0.15)", label: "orange" },
  contrast: { stroke: "red", fill: "rgba(255,0,0,0.15)", label: "red" },
  button: { stroke: "blue", fill: "rgba(0,0,255,0.15)", label: "blue" },
  "heading-hierarchy": { stroke: "purple", fill: "rgba(128,0,128,0.15)", label: "purple" },
  spacing: { stroke: "green", fill: "rgba(0,128,0,0.15)", label: "green" },
  alignment: { stroke: "deeppink", fill: "rgba(255,192,203,0.15)", label: "deeppink" }
};

export default function AnnotatedImage({ src, issues, containerWidth }) {
  const [image] = useImage(src);
  if (!image) return <p>Chargement de l'image...</p>;

  // Échelle responsive
  const scale = containerWidth ? Math.min(1, containerWidth / image.width) : 1;

  // Tableau des positions déjà utilisées pour éviter les chevauchements
  const placedLabels = [];

  return (
    <Stage
      width={image.width * scale}
      height={image.height * scale}
      scaleX={scale}
      scaleY={scale}
    >
      <Layer>
        {/* Image de fond */}
        <KonvaImage image={image} />

        {/* Dessin des zones + labels */}
        {issues.map((issue, i) => {
          const color = COLORS[issue.type] || COLORS.text;
          const { x, y, w, h } = issue.boundingBox;

          // Calcul position initiale du label
          let labelX = x;
          let labelY = y - 24 < 0 ? y + h + 4 : y - 24;

          // Évite chevauchement : on vérifie toutes les positions déjà placées
          while (
            placedLabels.some(
              (pos) =>
                Math.abs(pos.x - labelX) < 50 && // tolérance horizontale
                Math.abs(pos.y - labelY) < 20    // tolérance verticale
            )
          ) {
            labelY += 22; // décale vers le bas
          }

          // Enregistre cette position comme utilisée
          placedLabels.push({ x: labelX, y: labelY });

          return (
            <Group key={i}>
              {/* Rectangle semi-transparent */}
              <Rect
                x={x}
                y={y}
                width={w}
                height={h}
                stroke={color.stroke}
                strokeWidth={2}
                dash={[6, 4]}
                cornerRadius={4}
                fill={color.fill}
              />

              {/* Label façon “badge” */}
              <Group>
                <Rect
                  x={labelX}
                  y={labelY}
                  height={20}
                  fill={color.label}
                  cornerRadius={4}
                  shadowColor="rgba(0,0,0,0.2)"
                  shadowBlur={2}
                  shadowOffset={{ x: 1, y: 1 }}
                  shadowOpacity={0.4}
                  width={issue.message.length * 7 + 12} // largeur auto en fonction du texte
                />
                <Text
                  x={labelX + 6}
                  y={labelY + 3}
                  text={issue.message}
                  fontSize={12}
                  fontStyle="bold"
                  fill="white"
                />
              </Group>
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
}
