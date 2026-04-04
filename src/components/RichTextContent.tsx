import type { ReactNode } from 'react';

type RichTextContentProps = {
  content: string;
  className?: string;
};

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={`strong-${key++}`} className="font-semibold text-[#111111]">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={`em-${key++}`} className="italic">{token.slice(1, -1)}</em>);
    } else {
      parts.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function getBlocks(content: string) {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  return normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export default function RichTextContent({ content, className = '' }: RichTextContentProps) {
  const blocks = getBlocks(content);

  return (
    <div className={`space-y-5 text-base leading-relaxed text-gray-600 ${className}`.trim()}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const isList = lines.every((line) => /^[-*]\s+/.test(line));

        if (isList) {
          return (
            <ul key={`list-${blockIndex}`} className="list-disc space-y-2 pl-6">
              {lines.map((line, lineIndex) => (
                <li key={`item-${blockIndex}-${lineIndex}`}>{renderInline(line.replace(/^[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`paragraph-${blockIndex}`}>
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
}
