import Image from 'next/image';
import { getBrandEmojiPath } from '@/lib/brand-emojis';

type BrandIconProps = {
  token: string;
  size?: number;
  className?: string;
};

const BRAND_ICON_SCALE = 1.1;

export default function BrandIcon({ token, size = 16, className = '' }: BrandIconProps) {
  const renderedSize = Math.round(size * BRAND_ICON_SCALE);

  return (
    <Image
      src={getBrandEmojiPath(token)}
      alt=""
      aria-hidden
      width={renderedSize}
      height={renderedSize}
      className={`inline-block object-contain align-[-0.15em] ${className}`.trim()}
    />
  );
}
