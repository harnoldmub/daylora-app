# Design Guidelines: Marie & Julien Wedding Website - Golden Love 2026

## Design Approach: Elegant Wedding Experience
**Reference-Based Approach**: Drawing inspiration from luxury wedding platforms like The Knot and Joy, combined with the refined aesthetics of premium hospitality sites. This creates an emotional, memorable experience celebrating love.

## Core Design Principles
- **Elegance First**: Sophisticated, romantic atmosphere with timeless appeal
- **Emotional Connection**: Design that evokes joy and anticipation
- **Effortless Navigation**: Intuitive flow guiding guests through the story
- **Mobile Excellence**: Flawless experience on all devices (mobile-first)

## Color Palette

### Light Mode (Primary)
- **Primary Gold**: 43 45% 62% (signature #C8A96A gold for accents, borders, highlights)
- **Background**: 0 0% 100% (pure white for main backgrounds)
- **Secondary Background**: 40 33% 97% (soft ivory for section alternation)
- **Text Primary**: 0 0% 15% (soft black for readability)
- **Text Secondary**: 0 0% 45% (medium gray for supporting text)
- **Success**: 142 71% 45% (for confirmation messages)

### Dark Mode (Private Admin Area)
- **Background**: 0 0% 10% (deep charcoal)
- **Surface**: 0 0% 15% (elevated surfaces)
- **Gold Accent**: 43 45% 55% (adjusted for dark backgrounds)
- **Text**: 0 0% 95% (off-white)

## Typography

### Font Families (Google Fonts CDN)
- **Display/Headings**: 'Playfair Display', serif (elegant, romantic)
- **Body Text**: 'Lato', sans-serif (clean, highly readable)
- **Accents**: 'Great Vibes', cursive (for decorative elements only)

### Type Scale
- **Hero Title**: text-6xl md:text-7xl lg:text-8xl, font-display
- **Section Headings**: text-3xl md:text-4xl lg:text-5xl, font-display
- **Subheadings**: text-xl md:text-2xl, font-sans font-light
- **Body**: text-base md:text-lg, font-sans leading-relaxed
- **Small Text**: text-sm, font-sans

## Layout System

### Spacing Scale (Tailwind Units)
- **Primary spacing**: 4, 8, 12, 16, 24 (for consistent rhythm)
- **Section padding**: py-16 md:py-24 lg:py-32
- **Component spacing**: gap-8 md:gap-12
- **Container**: max-w-7xl mx-auto px-6 md:px-12

### Grid Structure
- **Gallery**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- **Dates Section**: grid-cols-1 md:grid-cols-2 (two key dates side-by-side)
- **Story Section**: single column max-w-4xl for optimal reading

## Component Library

### Hero Section
- Full-viewport height (min-h-screen) with blurred couple photo background
- Centered content with elegant typography hierarchy
- Gold decorative divider elements
- Soft gradient overlay (from transparent to white at bottom)
- Smooth scroll indicator with gold accent

### Story Cards
- White cards with subtle shadow (shadow-lg)
- Rounded corners (rounded-2xl)
- Photo frames with gold border (border-2 border-gold)
- Breathing room padding (p-8 md:p-12)

### Date Display Blocks
- Icon-first design with calendar/heart iconography
- Gold accent borders on hover
- Clear date formatting with emphasized month/day
- Countdown timer with gold number highlights

### Gallery Grid
- Masonry-style responsive layout
- Hover: subtle scale transform (hover:scale-105) with gold border overlay
- Lightbox modal: centered image with backdrop blur
- Navigation arrows with gold accent

### RSVP Form
- Clean white card with ample padding (p-10 md:p-16)
- Input fields: border-2 with gold focus state
- Custom select dropdown with gold arrow
- Primary CTA button: solid gold background with soft black text
- Validation: inline gold checkmarks, subtle error states
- Success message: gold checkmark icon with fade-in animation

### Navigation (Admin Area)
- Sticky header with backdrop blur
- Gold active state indicators
- Subtle hover effects on menu items

### Footer
- Two-column layout (contact info | copyright)
- Muted text on soft ivory background
- Gold social media icons
- Thin gold top border separator

## Interactive Elements

### Buttons
- **Primary**: bg-gold text-black rounded-full px-8 py-4 hover:bg-gold/90
- **Secondary**: border-2 border-gold text-gold bg-transparent (use backdrop-blur-md when on images)
- **Ghost**: text-gold hover:bg-gold/10

### Animations (Minimal & Purposeful)
- **Page Load**: Fade-in hero content (duration-1000)
- **Scroll**: Subtle parallax on hero background only
- **Interactions**: Scale on gallery hover (duration-300), button press feedback
- **Form**: Success message slide-down with bounce
- **NO**: Excessive scroll animations, auto-playing carousels, or distracting effects

## Images

### Hero Section
**Main Hero Image**: Romantic couple photo (Marie & Julien)
- Placement: Full-screen background, fixed attachment
- Treatment: Gaussian blur (blur-sm), slight darkening overlay
- Fallback: Soft gold gradient if image fails to load

### Story Section
**Couple Photos**: Individual portraits of Marie and Julien
- Placement: Side-by-side below story text (grid-cols-1 md:grid-cols-2)
- Treatment: Circular frames (rounded-full) with gold border (border-4 border-gold)
- Caption: Names and birth dates centered below each photo

### Gallery Section
**6-8 Milestone Photos**: Engagement, dates, candid moments
- Placement: Responsive grid (1-2-3 columns based on viewport)
- Treatment: Subtle shadow, rounded corners, hover zoom
- Quality: High-resolution, optimized for web

### Admin Area
**No decorative images needed** - focus on functional UI

## Accessibility
- Maintain WCAG AA contrast ratios (gold on white = adequate, verify text)
- Focus indicators: 2px gold outline
- Form labels clearly associated with inputs
- Alt text for all images describing the moment
- Keyboard navigation throughout
- Screen reader friendly RSVP flow

## Responsive Breakpoints
- **Mobile**: base (320px+) - single column, stacked layout
- **Tablet**: md (768px+) - 2-column grids, larger typography
- **Desktop**: lg (1024px+) - 3-column gallery, full layout hierarchy
- **Large**: xl (1280px+) - maximum container width constraints

## Admin Area Specifics
- Dark mode throughout for reduced eye strain during long sessions
- Table view for guest list with inline editing
- Drag-and-drop seating chart (visual table arrangement)
- Search and filter functionality with gold accent highlights
- Export functionality (PDF/CSV) with gold branding