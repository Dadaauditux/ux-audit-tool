import express from "express";
import { extractTextWithBoxes } from "./ocr.js";
import { checkTextContrast } from "./contrast.js";
import {
  checkTextSize,
  checkButtonSize,
  checkHeadingHierarchy,
  checkSpacing,
  checkAlignment
} from "./rules.js";

const router = express.Router();

function groupByLine(elements, yThreshold = 20) {
  const cleaned = elements.filter(el => el && el.boundingBox && typeof el.boundingBox.y === "number");
  const sorted = [...cleaned].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
  const groups = [];

  sorted.forEach(el => {
    let group = groups.find(g => Math.abs(g.y - el.boundingBox.y) <= yThreshold);
    if (!group) {
      group = { y: el.boundingBox.y, items: [] };
      groups.push(group);
    }
    group.items.push(el);
  });

  return groups.map(g => {
    const x = Math.min(...g.items.map(i => i.boundingBox.x));
    const y = Math.min(...g.items.map(i => i.boundingBox.y));
    const w = Math.max(...g.items.map(i => i.boundingBox.x + i.boundingBox.w)) - x;
    const h = Math.max(...g.items.map(i => i.boundingBox.y + i.boundingBox.h)) - y;
    return { ...g.items[0], boundingBox: { x, y, w, h } };
  });
}

// ✅ Route POST /upload appelée par le frontend
router.post("/upload", async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "Aucune image fournie" });
    }

    const imageBuffer = req.files.image.data;

    // Étape OCR
    const textData = await extractTextWithBoxes(imageBuffer);

    // Étape audit : règles UX
    const textSizeIssues = checkTextSize(textData, 16);
    const buttonCandidates = textData.filter(t => t.text.length > 3);
    const buttonSizeIssues = checkButtonSize(buttonCandidates, 44);
    const headingIssues = checkHeadingHierarchy(textData);
    const spacingIssues = checkSpacing(textData, 8);
    const alignmentIssues = checkAlignment(textData, 5);

    // Étape audit : contraste
    const contrastIssues = await checkTextContrast(imageBuffer, textData);

    // Réponse structurée
    res.json({
      groupedTextSizeIssues: groupByLine(textSizeIssues),
      groupedContrastIssues: groupByLine(contrastIssues),
      groupedButtonSizeIssues: groupByLine(buttonSizeIssues),
      headingIssues: groupByLine(headingIssues),
      spacingIssues: groupByLine(spacingIssues),
      alignmentIssues: groupByLine(alignmentIssues)
    });
  } catch (error) {
    console.error("❌ Erreur dans /upload :", error);
    res.status(500).json({ error: "Erreur serveur lors de l'analyse." });
  }
});

export default router;
