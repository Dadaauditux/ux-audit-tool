// rules.js – version enrichie

// Vérifie que la donnée OCR est valide
function isValidBox(t) {
  return (
    t &&
    typeof t.text === "string" &&
    typeof t.x === "number" &&
    typeof t.y === "number" &&
    typeof t.w === "number" &&
    typeof t.h === "number" &&
    t.w > 0 &&
    t.h > 0
  );
}

// Taille minimale du texte
export function checkTextSize(textData, minSizePx = 16) {
  const issues = [];
  for (const t of textData) {
    if (isValidBox(t) && t.h < minSizePx) {
      issues.push({
        boundingBox: { x: t.x, y: t.y, w: t.w, h: t.h },
        type: "text",
        message: `Texte trop petit (${t.h}px < ${minSizePx}px)`,
        severity: "high"
      });
    }
  }
  return issues;
}

// Taille minimale des boutons
export function checkButtonSize(elements, minSize = 44) {
  const issues = [];
  for (const e of elements) {
    if (isValidBox(e) && (e.w < minSize || e.h < minSize)) {
      issues.push({
        boundingBox: { x: e.x, y: e.y, w: e.w, h: e.h },
        type: "button",
        message: `Bouton trop petit (${e.w}x${e.h}px, min ${minSize}px)`,
        severity: "high"
      });
    }
  }
  return issues;
}

// Hiérarchie visuelle des titres
export function checkHeadingHierarchy(textData) {
  const issues = [];
  const headings = textData
    .filter(t => isValidBox(t) && t.h > 20)
    .sort((a, b) => b.h - a.h);

  if (headings.length > 1) {
    for (let i = 0; i < headings.length - 1; i++) {
      if (headings[i].h < headings[i + 1].h) {
        issues.push({
          boundingBox: { x: headings[i].x, y: headings[i].y, w: headings[i].w, h: headings[i].h },
          type: "heading-hierarchy",
          message: `Hiérarchie incohérente : "${headings[i].text}" (${headings[i].h}px) < "${headings[i + 1].text}" (${headings[i + 1].h}px)`,
          severity: "medium"
        });
      }
    }
  }
  return issues;
}

// Espacement entre éléments
export function checkSpacing(textData, minSpacing = 8) {
  const issues = [];
  const sorted = [...textData].sort((a, b) => a.y - b.y);
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const spacing = next.y - (current.y + current.h);
    if (spacing > 0 && spacing < minSpacing) {
      issues.push({
        boundingBox: { x: current.x, y: current.y, w: current.w, h: current.h },
        type: "spacing",
        message: `Espacement insuffisant (${spacing}px < ${minSpacing}px)`,
        severity: "low"
      });
    }
  }
  return issues;
}

// Alignement
export function checkAlignment(textData, tolerance = 5) {
  const issues = [];
  const groups = {};
  for (const t of textData) {
    if (!isValidBox(t)) continue;
    const key = Math.round(t.y / tolerance) * tolerance;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  Object.values(groups).forEach(line => {
    const xs = line.map(e => e.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    if (maxX - minX > tolerance) {
      line.forEach(e => {
        issues.push({
          boundingBox: { x: e.x, y: e.y, w: e.w, h: e.h },
          type: "alignment",
          message: "Alignement incohérent sur la ligne",
          severity: "low"
        });
      });
    }
  });
  return issues;
}
