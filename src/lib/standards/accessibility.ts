/**
 * ACCESSIBILITY COMPLIANCE
 * WCAG 2.1 AA Standards Implementation
 * Section 508 Compliance for Federal Accessibility
 */

export interface AccessibilityConfig {
  // Keyboard Navigation
  focusVisible: boolean;
  skipLinks: boolean;
  focusTrap: boolean;

  // Screen Reader Support
  ariaLabels: boolean;
  liveRegions: boolean;
  semanticHTML: boolean;

  // Visual Accessibility
  colorContrast: 'AA' | 'AAA';
  textResize: boolean;
  reducedMotion: boolean;

  // Cognitive Accessibility
  clearLanguage: boolean;
  consistentNavigation: boolean;
  errorPrevention: boolean;
}

export const ACCESSIBILITY_STANDARDS: AccessibilityConfig = {
  focusVisible: true,
  skipLinks: true,
  focusTrap: true,
  ariaLabels: true,
  liveRegions: true,
  semanticHTML: true,
  colorContrast: 'AA',
  textResize: true,
  reducedMotion: true,
  clearLanguage: true,
  consistentNavigation: true,
  errorPrevention: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// WCAG 2.1 COMPLIANCE CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════

export const WCAG_CHECKLIST = {
  perceivable: [
    {
      id: '1.1.1',
      name: 'Non-text Content',
      level: 'A',
      description: 'All images have alt text',
      implemented: true,
    },
    {
      id: '1.3.1',
      name: 'Info and Relationships',
      level: 'A',
      description: 'Semantic HTML used for structure',
      implemented: true,
    },
    {
      id: '1.4.1',
      name: 'Use of Color',
      level: 'A',
      description: 'Color is not the only way to convey information',
      implemented: true,
    },
    {
      id: '1.4.3',
      name: 'Contrast (Minimum)',
      level: 'AA',
      description: '4.5:1 contrast ratio for text',
      implemented: true,
    },
    {
      id: '1.4.4',
      name: 'Resize Text',
      level: 'AA',
      description: 'Text can be resized to 200% without loss',
      implemented: true,
    },
    {
      id: '1.4.10',
      name: 'Reflow',
      level: 'AA',
      description: 'Content reflows at 320px width',
      implemented: true,
    },
    {
      id: '1.4.11',
      name: 'Non-text Contrast',
      level: 'AA',
      description: '3:1 contrast for UI components',
      implemented: true,
    },
  ],
  operable: [
    {
      id: '2.1.1',
      name: 'Keyboard',
      level: 'A',
      description: 'All functionality available via keyboard',
      implemented: true,
    },
    {
      id: '2.1.2',
      name: 'No Keyboard Trap',
      level: 'A',
      description: 'Focus can be moved away from components',
      implemented: true,
    },
    {
      id: '2.4.1',
      name: 'Bypass Blocks',
      level: 'A',
      description: 'Skip navigation links provided',
      implemented: true,
    },
    {
      id: '2.4.3',
      name: 'Focus Order',
      level: 'A',
      description: 'Focus order preserves meaning',
      implemented: true,
    },
    {
      id: '2.4.6',
      name: 'Headings and Labels',
      level: 'AA',
      description: 'Headings describe topic or purpose',
      implemented: true,
    },
    {
      id: '2.4.7',
      name: 'Focus Visible',
      level: 'AA',
      description: 'Keyboard focus indicator visible',
      implemented: true,
    },
    {
      id: '2.5.3',
      name: 'Label in Name',
      level: 'A',
      description: 'Visual labels match accessible names',
      implemented: true,
    },
  ],
  understandable: [
    {
      id: '3.1.1',
      name: 'Language of Page',
      level: 'A',
      description: 'Page language is programmatically set',
      implemented: true,
    },
    {
      id: '3.2.1',
      name: 'On Focus',
      level: 'A',
      description: 'Focus does not change context',
      implemented: true,
    },
    {
      id: '3.2.3',
      name: 'Consistent Navigation',
      level: 'AA',
      description: 'Navigation is consistent across pages',
      implemented: true,
    },
    {
      id: '3.3.1',
      name: 'Error Identification',
      level: 'A',
      description: 'Errors are identified and described',
      implemented: true,
    },
    {
      id: '3.3.2',
      name: 'Labels or Instructions',
      level: 'A',
      description: 'Forms have labels and instructions',
      implemented: true,
    },
    {
      id: '3.3.3',
      name: 'Error Suggestion',
      level: 'AA',
      description: 'Error messages suggest corrections',
      implemented: true,
    },
  ],
  robust: [
    {
      id: '4.1.1',
      name: 'Parsing',
      level: 'A',
      description: 'HTML is well-formed',
      implemented: true,
    },
    {
      id: '4.1.2',
      name: 'Name, Role, Value',
      level: 'A',
      description: 'Custom components have proper ARIA',
      implemented: true,
    },
    {
      id: '4.1.3',
      name: 'Status Messages',
      level: 'AA',
      description: 'Status messages use ARIA live regions',
      implemented: true,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export function getContrastRatio(foreground: string, background: string): number {
  // Convert hex to relative luminance
  const getLuminance = (hex: string): number => {
    const rgb = hex.match(/[A-Fa-f0-9]{2}/g)?.map(x => parseInt(x, 16) / 255) || [0, 0, 0];
    const [r, g, b] = rgb.map(c =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrastRequirement(
  ratio: number,
  level: 'AA' | 'AAA',
  isLargeText: boolean
): boolean {
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

export const ARIA_LIVE_REGIONS = {
  polite: 'polite', // Announces when user is idle
  assertive: 'assertive', // Announces immediately
  off: 'off', // Does not announce
} as const;

export function generateSkipLink(targetId: string, label: string) {
  return {
    href: `#${targetId}`,
    className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded',
    children: label,
  };
}

// Focus trap for modals
export function createFocusTrap(containerRef: HTMLElement | null) {
  if (!containerRef) return { activate: () => {}, deactivate: () => {} };

  const focusableElements = containerRef.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  };

  return {
    activate: () => {
      containerRef.addEventListener('keydown', handleKeyDown);
      firstElement?.focus();
    },
    deactivate: () => {
      containerRef.removeEventListener('keydown', handleKeyDown);
    },
  };
}
