import sharp from "sharp";

function luminance(rgb) {
  const a = rgb.map(v => {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastRatio(c1, c2) {
  const l1 = luminance(c1);
  const l2 = luminance(c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export async function checkTextContrast(imageBuffer, textData, threshold = 4.5) {
  const issues = [];
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const imgWidth = metadata.width;
  const imgHeight = metadata.height;

  for (const t of textData) {
    if (
      t.w > 0 &&
      t.h > 0 &&
      t.x >= 0 &&
      t.y >= 0 &&
      t.x + t.w <= imgWidth &&
      t.y + t.h <= imgHeight
    ) {
      try {
        // Zone texte
        const roi = await image
          .extract({ left: t.x, top: t.y, width: t.w, height: t.h })
          .raw()
          .toBuffer();
        const textColor = [roi[0], roi[1], roi[2]];

        // Zone fond (au-dessus)
        const bgTop = Math.max(t.y - 5, 0);
        if (bgTop + 5 <= imgHeight) {
          const bg = await image
            .extract({ left: t.x, top: bgTop, width: t.w, height: 5 })
            .raw()
            .toBuffer();
          const bgColor = [bg[0], bg[1], bg[2]];

          const ratio = contrastRatio(textColor, bgColor);

          if (ratio < threshold) {
            issues.push({
              text: t.text,
              position: { x: t.x, y: t.y, w: t.w, h: t.h },
              contrast_ratio: parseFloat(ratio.toFixed(2)),
              message: `Contraste insuffisant : ${ratio.toFixed(2)} (min ${threshold})`
            });
          }
        }
      } catch (err) {
        console.error("Erreur lors de l'extraction avec sharp :", err.message);
      }
    }
  }
  return issues;
}
