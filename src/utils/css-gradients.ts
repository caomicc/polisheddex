/**
 * CSS-based Pokemon type gradient utilities
 * Works with CSS custom properties defined in globals.css
 */

/**
 * Generate CSS custom properties for type gradients
 * @param type1 - First Pokemon type
 * @param type2 - Second Pokemon type (optional)
 * @param opacity - Gradient opacity percentage (default: 20)
 * @returns CSS custom properties object
 */
export function getTypeGradientCSSProps(
  type1: string,
  type2?: string,
  opacity: number = 20
): React.CSSProperties {
  if (type2) {
    // Dual type gradient
    return {
      '--type-1-color': `var(--color-${type1})`,
      '--type-2-color': `var(--color-${type2})`,
      '--gradient-opacity': `${opacity}%`,
    } as React.CSSProperties
  } else {
    // Single type gradient
    return {
      '--type-color': `var(--color-${type1})`,
      '--gradient-opacity': `${opacity}%`,
    } as React.CSSProperties
  }
}

/**
 * Get the appropriate CSS class for type gradients
 * @param type1 - First Pokemon type
 * @param type2 - Second Pokemon type (optional)
 * @param direction - Gradient direction ('vertical' | 'horizontal' | 'diagonal')
 * @returns CSS class name for the gradient
 */
export function getTypeGradientClass(
  type1: string,
  type2?: string,
  direction: 'vertical' | 'horizontal' | 'diagonal' = 'vertical'
): string {
  if (type2) {
    // Dual type gradient
    switch (direction) {
      case 'horizontal':
        return 'bg-dual-type-gradient-horizontal'
      case 'diagonal':
        return 'bg-dual-type-gradient-diagonal'
      default:
        return 'bg-dual-type-gradient'
    }
  } else {
    // Single type gradient (only vertical for single type)
    return 'bg-single-type-gradient'
  }
}

/**
 * Complete gradient props for React components
 * @param type1 - First Pokemon type
 * @param type2 - Second Pokemon type (optional)
 * @param direction - Gradient direction
 * @param opacity - Gradient opacity
 * @returns Object with className and style properties
 */
export function getTypeGradientProps(
  type1: string,
  type2?: string,
  direction: 'vertical' | 'horizontal' | 'diagonal' = 'vertical',
  opacity: number = 20
) {
  return {
    className: getTypeGradientClass(type1, type2, direction),
    style: getTypeGradientCSSProps(type1, type2, opacity),
  }
}
