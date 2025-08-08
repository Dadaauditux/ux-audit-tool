import React from "react";

const issueTypes = [
  { type: "text", color: "orange", label: "Texte trop petit" },
  { type: "contrast", color: "red", label: "Contraste insuffisant" },
  { type: "button", color: "blue", label: "Bouton trop petit" },
  { type: "heading-hierarchy", color: "purple", label: "Hiérarchie des titres" },
  { type: "spacing", color: "green", label: "Problème d'espacement" },
  { type: "alignment", color: "pink", label: "Problème d'alignement" }
];

export default function LegendPanel({ visibleTypes, toggleType }) {
  return (
    <div style={{ fontSize: 14 }}>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Légende des erreurs</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {issueTypes.map(({ type, color, label }) => (
          <label
            key={type}
            htmlFor={type}
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer"
            }}
          >
            <input
              id={type}
              type="checkbox"
              checked={visibleTypes.includes(type)}
              onChange={() => toggleType(type)}
              style={{ marginRight: 8 }}
            />
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                backgroundColor: color,
                borderRadius: "50%",
                marginRight: 8
              }}
            ></span>
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
