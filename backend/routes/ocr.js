import tesseract from "tesseract.js";
import sharp from "sharp";

export async function extractTextWithBoxes(imageBuffer) {
  try {
    // ✅ Vérifier que le buffer n'est pas vide
    if (!imageBuffer || !imageBuffer.length) {
      console.warn("OCR: image vide ou non valide");
      return [];
    }

    // ✅ Vérifier dimensions de l'image
    const metadata = await sharp(imageBuffer).metadata();
    if (!metadata.width || !metadata.height) {
      console.warn("OCR: dimensions invalides ou image corrompue");
      return [];
    }

    // ✅ Lancer l'OCR
    const result = await tesseract.recognize(imageBuffer, "eng");

    // ✅ Nettoyer et sécuriser les résultats
    return result.data.words
      .filter(word => {
        return (
          word &&
          word.text &&
          word.text.trim() !== "" &&
          word.bbox &&
          typeof word.bbox.x0 === "number" &&
          typeof word.bbox.y0 === "number" &&
          typeof word.bbox.x1 === "number" &&
          typeof word.bbox.y1 === "number" &&
          word.bbox.x1 > word.bbox.x0 &&
          word.bbox.y1 > word.bbox.y0
        );
      })
      .map(word => ({
        text: word.text.trim(),
        x: Math.max(0, word.bbox.x0),
        y: Math.max(0, word.bbox.y0),
        w: Math.max(0, word.bbox.x1 - word.bbox.x0),
        h: Math.max(0, word.bbox.y1 - word.bbox.y0)
      }));
  } catch (err) {
    console.error("Erreur OCR :", err.message);
    return [];
  }
}
