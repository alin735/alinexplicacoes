import Image from 'next/image';
import { getBrandEmojiPath } from '@/lib/brand-emojis';

type BrandIconProps = {
  token: string;
  size?: number;
  className?: string;
  /** Texto alternativo. Sem ele o ícone é decorativo e fica escondido dos leitores de ecrã. */
  alt?: string;
};

const BRAND_ICON_SCALE = 1.1;

export default function BrandIcon({ token, size = 16, className = '', alt }: BrandIconProps) {
  const renderedSize = Math.round(size * BRAND_ICON_SCALE);

  return (
    <Image
      src={getBrandEmojiPath(token)}
      alt={alt ?? ''}
      aria-hidden={alt ? undefined : true}
      width={renderedSize}
      height={renderedSize}
      className={`inline-block object-contain align-[-0.15em] ${className}`.trim()}
    />
  );
}
