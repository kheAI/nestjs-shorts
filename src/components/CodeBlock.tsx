import React from "react";

const CARD_BG = "#13131a";
const TEXT_DEFAULT = "#f8fafc";
const FONT_CODE = "JetBrains Mono, monospace";

interface CodeLine {
  text: string;
  color?: string;
}

interface CodeBlockProps {
  lines: CodeLine[];
  width?: number;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ lines, width = 900 }) => {
  return (
    <div
      style={{
        width,
        backgroundColor: CARD_BG,
        borderRadius: 16,
        padding: "40px 48px",
        boxSizing: "border-box",
        fontFamily: FONT_CODE,
        fontSize: 28,
        lineHeight: 1.6,
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            color: line.color ?? TEXT_DEFAULT,
            whiteSpace: "pre",
          }}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
};
