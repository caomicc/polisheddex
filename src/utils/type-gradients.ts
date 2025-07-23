import { cn } from '@/lib/utils';

/**
 * Generate CSS custom properties for dual-type gradients
 * @param type1 - First Pokemon type
 * @param type2 - Second Pokemon type (optional)
 * @returns Object with CSS custom properties
 */
export function getDualTypeGradientStyles(type1: string, type2?: string) {
  if (!type2) {
    // Single type - use same color for both stops but with different opacity
    return {
      '--type-1-color': `var(--color-${type1})`,
      '--type-2-color': `var(--color-${type1})`,
    } as React.CSSProperties;
  }

  return {
    '--type-1-color': `var(--color-${type1})`,
    '--type-2-color': `var(--color-${type2})`,
  } as React.CSSProperties;
}

/**
 * Generate className and styles for dual-type gradients
 * @param type1 - First Pokemon type
 * @param type2 - Second Pokemon type (optional)
 * @param additionalClasses - Additional CSS classes
 * @returns Object with className and style properties
 */
export function getDualTypeGradientProps(
  type1: string,
  type2?: string,
  additionalClasses?: string,
) {
  return {
    className: cn('bg-dual-type-gradient', additionalClasses),
    style: getDualTypeGradientStyles(type1, type2),
  };
}
