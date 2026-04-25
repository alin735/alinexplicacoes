import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

type RichTextContentProps = {
  content: string;
  className?: string;
};

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        const isExternal = href.startsWith('http://') || href.startsWith('https://');

        parts.push(
          isExternal ? (
            <a
              key={`link-${key++}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#3f6c93] underline underline-offset-2"
            >
              {label}
            </a>
          ) : (
            <Link
              key={`link-${key++}`}
              href={href}
              className="font-semibold text-[#3f6c93] underline underline-offset-2"
            >
              {label}
            </Link>
          ),
        );
      } else {
        parts.push(token);
      }
    } else if (token.startsWith('**') && token.endsWith('**')) {
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

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

export default function RichTextContent({ content, className = '' }: RichTextContentProps) {
  const blocks = getBlocks(content);

  return (
    <div className={`space-y-5 text-base leading-relaxed text-gray-600 ${className}`.trim()}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const isList = lines.every((line) => /^[-*]\s+/.test(line));
        const isHeading = lines.length === 1 && /^##\s+/.test(lines[0]);
        const isSubheading = lines.length === 1 && /^###\s+/.test(lines[0]);
        const isYouTube = lines.length === 1 && /^!youtube\s+/.test(lines[0]);
        const isImage = lines.length === 1 && /^!image\s+/.test(lines[0]);

        if (isList) {
          return (
            <ul key={`list-${blockIndex}`} className="list-disc space-y-2 pl-6">
              {lines.map((line, lineIndex) => (
                <li key={`item-${blockIndex}-${lineIndex}`}>{renderInline(line.replace(/^[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }

        if (isHeading) {
          return (
            <h2 key={`heading-${blockIndex}`} className="text-2xl font-black text-[#111111]">
              {renderInline(lines[0].replace(/^##\s+/, ''))}
            </h2>
          );
        }

        if (isSubheading) {
          return (
            <h3 key={`subheading-${blockIndex}`} className="text-xl font-black text-[#111111]">
              {renderInline(lines[0].replace(/^###\s+/, ''))}
            </h3>
          );
        }

        if (isYouTube) {
          const rawUrl = lines[0].replace(/^!youtube\s+/, '').trim();
          const embedUrl = getYouTubeEmbedUrl(rawUrl);

          if (embedUrl) {
            return (
              <div key={`youtube-${blockIndex}`} className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
                <div className="relative aspect-video">
                  <iframe
                    src={embedUrl}
                    title="Vídeo do YouTube"
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            );
          }
        }

        if (isImage) {
          const rawValue = lines[0].replace(/^!image\s+/, '').trim();
          const [src, altText] = rawValue.split('|').map((entry) => entry.trim());

          if (src) {
            return (
              <figure
                key={`image-${blockIndex}`}
                className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
              >
                <div className="relative aspect-[16/9]">
                  <Image
                    src={src}
                    alt={altText || 'Imagem do artigo'}
                    fill
                    className="object-contain bg-white"
                  />
                </div>
              </figure>
            );
          }
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
