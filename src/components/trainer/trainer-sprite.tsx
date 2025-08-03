import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useTrainerSpriteData } from '@/hooks/useTrainerSpriteData';

interface TrainerSpriteProps {
  className?: string;
  trainerName: string;
  variant?: string;
  alt?: string;
  // Legacy prop for backward compatibility
  src?: string;
}

export function TrainerSprite({ 
  className, 
  trainerName, 
  variant,
  alt,
  src 
}: TrainerSpriteProps) {
  const { spriteInfo, isLoading } = useTrainerSpriteData(trainerName, variant);
  
  // Fallback to legacy src prop if provided and sprite data not available
  const finalSrc = spriteInfo?.url || src;
  const width = spriteInfo?.width || 64;
  const height = spriteInfo?.height || 64;

  if (isLoading) {
    return (
      <div
        className={cn(
          'relative bg-white p-2 w-16 h-16 rounded-lg',
          'animate-pulse border border-gray-200',
          className,
        )}
      />
    );
  }

  if (!finalSrc) {
    return (
      <div
        className={cn(
          'relative bg-white p-2 w-16 h-16 rounded-lg',
          'flex items-center justify-center text-gray-400 border border-gray-200',
          className,
        )}
      >
        ?
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative bg-white p-2 w-16 h-16 rounded-lg shadow-sm border border-gray-200',
        className,
      )}
    >
      <Image
        src={finalSrc}
        alt={alt || `${trainerName} ${variant ? `(${variant})` : ''} sprite`}
        width={width}
        height={height}
        className="mx-auto relative top-1/2 -translate-y-1/2 object-contain"
        priority={false}
        quality={85}
      />
    </div>
  );
}