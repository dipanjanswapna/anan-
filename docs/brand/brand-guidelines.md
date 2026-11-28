# ANAN Brand Guidelines

Version 1.0 · November 2026  
Applies to: public storefront, Seller Centre, Admin console, Social Studio and future mobile apps.

## Brand idea

**ANAN makes everyday discovery feel clear, warm and dependable.** The experience should feel like a thoughtful modern marketplace: curated rather than noisy, confident rather than pushy, friendly without looking childish.

Brand principles:
1. Trust before hype — explain what is verified and what is not.
2. Clarity before decoration — prices, delivery, stock and next steps are easy to scan.
3. Warm premium — generous space, tactile cards, restrained gradients and editorial photography.
4. Bangladesh-first — BDT formatting, local delivery context and excellent Bangla typography.
5. Consistency everywhere — storefront, seller tools and Admin share the same design language.

## Logo and wordmark

- Use the lowercase **anan.** wordmark in the primary brand lockup.
- The standalone mark is a lowercase “a” in a rounded square; use the approved gradient mark on light backgrounds.
- Clear space around the mark: at least the height of the mark.
- Never stretch, rotate, outline, add glow, or recolour the wordmark arbitrarily.
- Minimum digital wordmark width: 84px; standalone mark: 28px.

## Colour palette

| Token | Hex | Purpose |
|---|---|---|
| Brand 950 | #211137 | Deep brand ink, premium dark panels |
| Brand 900 | #2D1749 | Hero backgrounds, dark navigation |
| Brand 800 | #45216F | Strong emphasis on light surfaces |
| Brand 700 | #5D2CA3 | Hover/active states, links |
| Brand 600 | #7434DF | Primary actions and brand signature |
| Brand 500 | #8754E8 | Gradient highlight |
| Brand 100 | #EEE6FF | Selected states and quiet emphasis |
| Brand 50 | #F7F3FF | Soft surfaces |
| Ink | #211A2D | Primary text |
| Muted | #756B82 | Secondary text |
| Line | #ECE7F2 | Borders and separators |
| Canvas | #FBFAFF | App page background |
| White | #FFFFFF | Cards and content surfaces |

Use semantic colours sparingly: green for success, amber for warning, red for destructive/error. Never communicate status by colour alone.

## Typography

- Latin: Inter, weights 400–800.
- Bangla: Noto Sans Bengali, weights 400–800.
- Display headlines: 700–800, tight tracking, line-height 1.05–1.15.
- Body: 14–16px desktop, 13–15px mobile, line-height 1.55–1.7.
- Metadata: 11–12px; do not use tiny text for essential information.
- Use sentence case. Avoid all-caps except short eyebrow labels.

## Layout and spacing

- Content max width: 1320px; desktop gutters 24px, mobile gutters 14px.
- Use a 4px spacing rhythm: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Public content should have clear section rhythm and generous whitespace.
- Cards: 18–22px radius; large hero/promo panels: 22–28px radius.
- Borders are subtle. Shadows are reserved for floating layers and hover elevation.
- Desktop grids should use consistent card heights and aligned baselines.

## Navigation and shell

- Storefront: compact utility strip, sticky primary header, prominent search, category navigation, clear account/wishlist/cart actions.
- Mobile: compact header, full-width search, accessible drawer with grouped categories/account links; close on navigation and Escape.
- Seller/Admin: persistent, clearly labelled workspace navigation; active item uses brand surface and a strong indicator. On narrow screens, navigation becomes horizontally scrollable or a drawer, never clipped without a way to reach items.
- Use one consistent icon family (Lucide) with 16–20px line icons. Icons supplement labels; do not replace labels for primary navigation on desktop.

## Hero and campaign imagery

- Hero is editorial and compact, not a full-screen billboard. Target 340px mobile, 380px tablet, 420–450px desktop.
- Keep one primary message, one primary CTA and one quieter secondary CTA per slide.
- Use real campaign imagery with a dark gradient scrim behind text; ensure contrast on every crop.
- Carousel auto-rotation: 6–7 seconds, pause on hover/focus, visible pause control, touch swipe, arrow controls, keyboard support and reduced-motion support.
- Avoid urgency claims, discounts or delivery promises unless supported by live data and current policy.

## Components and interaction

- Primary CTA: solid Brand 600, pill or 12–14px radius, minimum 44px touch target.
- Secondary CTA: quiet border or text action.
- Inputs: clear label, visible focus ring, helper/error text and 44px minimum height.
- Product cards: consistent image ratio, readable title, BDT price, honest stock/sale state, seller context and accessible action labels.
- Empty/loading/error/success states must be designed, not left blank.
- Hover lift is subtle (2–3px); respect prefers-reduced-motion.
- Use skeletons only when layout dimensions are stable.

## Responsive breakpoints

| Range | Guidance |
|---|---|
| 320–375 | Small mobile: one-column forms, compact controls, no horizontal page overflow |
| 376–430 | Mobile: two-column product grids where cards remain readable |
| 431–767 | Large mobile: flexible grids, drawer navigation |
| 768–1023 | Tablet: compact multi-column layouts, avoid desktop density |
| 1024–1439 | Laptop: full navigation, balanced content width |
| 1440–1919 | Desktop: 1320px content max, more whitespace |
| 1920+ | Large desktop: keep readable max width; do not stretch content |

## Accessibility and content

- Target WCAG 2.2 AA contrast and keyboard operability.
- Visible focus, skip link, semantic landmarks, descriptive labels and logical heading order.
- Motion must respect prefers-reduced-motion; never rely on animation to convey meaning.
- Product image alt text describes the image, not promotional claims.
- Keep language plain, specific and honest. Current checkout is COD-only unless payment integrations are actually enabled.
- Never fabricate ratings, reviews, seller verification, stock, delivery times or promotional scarcity.

## Do / Don't

**Do:** calm purple accents, warm neutral backgrounds, consistent spacing, clear price hierarchy, honest copy, strong mobile layouts.

**Don't:** rainbow gradients, excessive glassmorphism, tiny grey text, multiple competing CTAs, arbitrary emoji icons, fake badges, full-screen hero banners or unverified claims.

## Governance

New screens and components should use the shared tokens and primitives in `apps/web/src/app/globals.css`. Any new colour, type scale, radius or shadow should be added here before being used broadly. Review the storefront, Seller Centre and Admin together to prevent visual drift.
