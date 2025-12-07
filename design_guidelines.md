# Vibe Drinks - Design Guidelines

## Design Approach
**Reference-Based**: Premium delivery platform inspired by iFood's organizational structure combined with luxury beverage aesthetics (think high-end spirits brands like Ciroc, Grey Goose). Focus on sophisticated, modern minimalism with bold metallic accents.

## Color System
**Primary Palette** (strictly enforced):
- **Black**: `#000000` - Primary backgrounds, text, headers
- **Gold**: `#FFD700` - Premium accents, CTAs, highlights
- **Yellow**: `#FFC400` - Secondary accents, hover states, badges
- **White**: `#FFFFFF` - Content backgrounds, text on dark surfaces

**Usage Rules**:
- Dark surfaces dominate (70% black backgrounds)
- Gold for primary actions and premium elements
- Yellow for secondary interactions and energy
- White for cards, modals, and content containers

## Typography
**Font Families**:
- **Headings**: Playfair Display (luxury serif) - Gold/White on black
- **Body**: Inter (clean sans-serif) - White/Black for readability
- **UI Elements**: Inter Medium/Semibold

**Hierarchy**:
- Hero Title: 4xl-6xl, Playfair Display, Gold
- Section Headers: 3xl-4xl, Playfair Display, White
- Product Names: xl-2xl, Inter Semibold, White
- Body Text: base-lg, Inter, White/Gray-200
- Prices: 2xl-3xl, Inter Bold, Yellow/Gold

## Layout System
**Spacing**: Use Tailwind units of 4, 6, 8, 12, 16, 20, 24 (e.g., p-4, gap-8, mb-12)

**Containers**:
- Full-width sections with inner max-w-7xl
- Content cards: rounded-2xl with subtle gold borders (1px)
- Premium elevation: shadows with gold/yellow glow effects

## Page-Specific Layouts

### Home Page (iFood-inspired structure)
**Hero Section**:
- Full viewport (100vh) video background with dark overlay (60% opacity)
- Video from Supabase Storage, looped, muted
- Centered content: Large Playfair Display title in gold, subtitle in white
- Gold CTA button with blur background, subtle glow effect
- Subtle gradient overlay (black to transparent top to bottom)

**Banner Carousel**:
- Horizontal scrollable cards (4:1 ratio)
- Admin-managed promotional banners
- Rounded-2xl, subtle gold border, shadow with yellow glow
- Auto-advance every 5 seconds, manual navigation

**Category Carousel**:
- Horizontal scroll with 3D/Creughar style icons (stored in Supabase)
- Circular containers (120px) with gold borders
- Icon + category name below
- Smooth scroll, no pagination dots
- Active category: yellow glow, enlarged scale (1.1)

**Product Grid**:
- 2-4 column grid (responsive: 1 mobile, 2 tablet, 3-4 desktop)
- Product cards: white background, rounded-xl, hover: gold border + lift
- Product image (from Supabase), name, price in yellow, "Add to Cart" button in gold

### Admin Dashboard
**Layout**: Sidebar navigation (black background) + main content area (dark gray #1a1a1a)
- Sidebar: Gold icons, white text, yellow active state with gold vertical accent
- 9 tabs: Pedidos, Delivery, Financeiro, Clientes, Produtos, Categorias, Banners, Motoboys, Configurações
- Content: White cards on dark background, gold headers, yellow accent borders

**Order Cards**: 
- White rounded cards with colored status badges (yellow/gold gradient)
- Client info, items list, payment method, delivery fee prominent
- Status buttons: outline style, gold border, fill on active state

### Kitchen (KDE) Interface
**Order Queue**:
- Large cards (white) showing orders in "Aceito" and "Em Produção" states
- Timer badge (top-right, yellow) showing elapsed time
- Items list with quantities bold
- Large action buttons: "Iniciar Produção" (gold), "Pedido Pronto" (yellow)

### Motoboy Interface
**Assigned Orders**:
- Full-screen cards (one at a time) with map integration
- Address prominent at top, gold background section
- Payment method, delivery fee, client notes in separate white sections
- Large "Marcar Entregue" button at bottom (gold, full-width)

### Customer Interface
**Cart**:
- Slide-out panel (right side), black background
- Item cards: white, rounded, with quantity controls (gold)
- Delivery fee calculation: yellow highlight box
- Combo detection: Green badge "Combo Vibe - 15% OFF" with strikethrough original price
- Payment method selector: cards with icons, gold border on selected

## Component Library

**Buttons**:
- Primary: Gold background, black text, rounded-full, shadow-lg with gold glow
- Secondary: Gold border, white text, rounded-full, transparent background
- Ghost: No border, yellow text, underline on hover
- All buttons: blur background when over images/video

**Input Fields**:
- Black background with gold border (1px)
- White text, gold focus ring
- Rounded-lg, padding-4

**Cards**:
- Product: White background, rounded-xl, subtle shadow, hover lift + gold border
- Order: White background, rounded-2xl, gold accent border on left
- Category: Transparent with gold border, circular for icons

**Badges/Tags**:
- Status: Rounded-full, small text, colored backgrounds (yellow/gold/green gradients)
- Combo: Green with gold border, "15% OFF" text

**Modals/Overlays**:
- Black background (90% opacity)
- Content card: white with gold header section
- Rounded-2xl, centered, max-w-2xl

## Images & Media

**Product Images**: 
- Square format (1:1), high-quality bottle photography
- White/transparent backgrounds preferred
- Minimum 800x800px from Supabase Storage

**Category Icons**: 
- 3D rendered style (Creughar aesthetic)
- Transparent background PNG
- 512x512px minimum
- Gold/yellow color schemes

**Banners**: 
- 1920x480px landscape format
- Dark overlays with gold accents
- Text overlays in Playfair Display

**Hero Video**: 
- Premium beverage footage (bottles, pours, lifestyle)
- Dark moody lighting, gold/amber tones
- 1080p minimum, optimized for web
- 10-30 seconds, seamless loop

**Motoboy Photos**: 
- Professional headshots, circular crop
- 400x400px minimum

## Animations
**Minimal & Purposeful**:
- Page transitions: Fade (200ms)
- Card hover: Lift 4px, gold border fade-in (150ms)
- Button interactions: Scale 0.98 on press, glow intensify on hover
- Carousel: Smooth slide (300ms ease-in-out)
- Real-time updates: Gentle pulse on new orders (gold glow)
- No parallax, no complex scroll animations

## Accessibility
- Gold/Yellow on black: WCAG AA compliant
- Focus states: 2px gold ring, offset 2px
- All interactive elements: minimum 44x44px touch targets
- Form validation: Yellow text, inline messaging

## Responsive Behavior
- **Mobile**: Single column, full-width cards, bottom nav
- **Tablet**: 2-column grids, sidebar collapses to drawer
- **Desktop**: Multi-column (3-4), fixed sidebar, expanded layouts

This premium aesthetic balances luxury with usability, ensuring the Vibe Drinks brand feels exclusive while maintaining the efficiency required for a delivery platform.