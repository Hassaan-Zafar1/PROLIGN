---
name: Organic Mentorship System
colors:
  surface: '#fff8f3'
  surface-dim: '#e6d8c5'
  surface-bright: '#fff8f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff2e1'
  surface-container: '#faecd8'
  surface-container-high: '#f5e6d3'
  surface-container-highest: '#efe0cd'
  on-surface: '#211b0f'
  on-surface-variant: '#45483f'
  inverse-surface: '#372f22'
  inverse-on-surface: '#fdefdb'
  outline: '#76786e'
  outline-variant: '#c6c7bc'
  surface-tint: '#576343'
  primary: '#202a10'
  on-primary: '#ffffff'
  primary-container: '#354024'
  on-primary-container: '#9fac88'
  inverse-primary: '#becca6'
  secondary: '#5b6239'
  on-secondary: '#ffffff'
  secondary-container: '#dce4b1'
  on-secondary-container: '#5f663d'
  tertiary: '#312403'
  on-tertiary: '#ffffff'
  tertiary-container: '#493a16'
  on-tertiary-container: '#baa477'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae8c0'
  primary-fixed-dim: '#becca6'
  on-primary-fixed: '#151f06'
  on-primary-fixed-variant: '#3f4b2e'
  secondary-fixed: '#dfe7b4'
  secondary-fixed-dim: '#c3cb9a'
  on-secondary-fixed: '#181e00'
  on-secondary-fixed-variant: '#434a24'
  tertiary-fixed: '#f8e0ae'
  tertiary-fixed-dim: '#dbc494'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#544520'
  background: '#fff8f3'
  on-background: '#211b0f'
  surface-variant: '#efe0cd'
typography:
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Source Sans 3
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  caption:
    fontFamily: Source Sans 3
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 24px
  tight: 12px
  loose: 48px
  gutter: 24px
  margin: 24px
  container-max: 1280px
---

## Brand & Style
The design system for this platform is rooted in a "Modern Naturalist" aesthetic. It targets a professional audience seeking meaningful, growth-oriented connections. By moving away from sterile corporate blues and grays, the system evokes a sense of grounded wisdom, reliability, and academic sophistication.

The style combines **Minimalism** with **Tactile** elements. It utilizes a high-quality editorial feel through its serif typography, paired with a warm, earthy color palette that feels more like a physical study or library than a digital interface. The emotional response is one of calm, focus, and trust—essential for the vulnerable and constructive nature of mentorship.

## Colors
This design system uses a strictly naturalistic palette to differentiate itself from tech-heavy competitors. 

- **Primary (Kombu Green):** Used for the most critical actions and structural sidebars. It represents growth and stability.
- **Secondary (Moss Green):** Used for accents, supportive actions, and success states. It provides a softer contrast to the primary green.
- **Tertiary (Café Noir):** This replaces pure black for all typography and deep-tone backgrounds. It keeps the interface warm and readable.
- **Surface (Tan):** Reserved for card backgrounds and form elements to create a subtle layered effect against the base.
- **Base (Bone):** The foundational canvas color, providing a soft, non-fatiguing background for long reading sessions.

## Typography
The typographic scale emphasizes an editorial hierarchy. **Playfair Display** provides an authoritative, academic tone for headings, suggesting the "Mentor" aspect of the platform. **Source Sans 3** is chosen for its exceptional legibility in data-heavy environments like scheduling dashboards and messaging threads.

For mobile devices, H1 and H2 scales are reduced to prevent awkward line breaks while maintaining the characteristic serif flair. All body text maintains a generous line height (1.6) to ensure high readability during long mentorship session notes.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a maximum container width of 1280px. A 12-column grid is used for desktop, collapsing to 4 columns on mobile. 

The "Base 24" rhythm is the primary driver of the layout. All section padding and card margins should default to 24px. This generous spacing reinforces the "calm" brand pillar, avoiding the cramped feeling of traditional SaaS tools. On mobile devices, the outer margins remain at 24px to ensure touch targets and content do not feel crowded against the screen edges.

## Elevation & Depth
Elevation is achieved through **Tonal Layers** and **Ambient Shadows**. Instead of harsh black shadows, this design system uses deep umber or Café Noir tints at very low opacity (5-8%) to create "Natural Depth."

- **Level 0 (Base):** Bone (#E5D7C4).
- **Level 1 (Cards/Inputs):** Tan (#CFBB99) with a 1px border of Moss Green at 10% opacity.
- **Level 2 (Dropdowns/Modals):** Tan (#CFBB99) with a soft, 16px blur shadow (#4C3D19 at 0.08 opacity).

The depth should feel like paper stacked on a wooden desk—subtle, physical, and intentional.

## Shapes
The shape language is "Organic Geometric." 

- **Large Containers (Cards):** 12px radius creates a friendly but structured container for content.
- **Interactive Elements (Buttons/Inputs):** 8px radius provides a sharp, professional focus.
- **Identity (Avatars):** Always 50% (circular) to contrast against the rectangular grid and emphasize the "human" element of the platform.

## Components

### Buttons
- **Primary:** Kombu Green background with Bone text. Use for main calls to action like "Book Session."
- **Secondary:** Tan background with Café Noir text. Use for tertiary or supportive actions.
- **Outlined:** Transparent background with a 2px Kombu Green border. Use for secondary actions or "Cancel."

### Input Fields
Inputs use the Tan (#CFBB99) background to sit subtly on the Bone page. On focus, they transition to a 2px Moss Green ring. Labels should always use Café Noir for maximum accessibility.

### Status Badges
Badges are pill-shaped (rounded-full) and use subtle background tints:
- **Success/Confirmed:** Moss Green background, Café Noir text.
- **Pending:** Tan background, Café Noir text.
- **Cancelled/Alert:** Muted Red (Hex #A65D57) background, Bone text.

### Cards & Lists
Cards utilize the 12px radius. Content within cards should follow the 24px padding rule. Lists should use a 1px horizontal separator in Café Noir at 10% opacity to maintain structure without adding visual noise.

### Icons
Icons must be **Outline-style** with a 1.5px stroke weight, rendered in Moss Green. This maintains a light, sophisticated feel that doesn't compete with the heavy serif typography.