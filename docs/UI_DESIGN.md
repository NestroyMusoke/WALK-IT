# WALK IT interface direction

The entry screen uses a restrained editorial layout inspired by the user-supplied 8B product landing page template. A raised pill navigation bar, asymmetrical hero, generous sections and tactile surfaces give each part of the story room to breathe. The flock is contained in its own framed panel beside the product promise. The Hairline route study is a small interactive object with a dogleg of paving stones, one start and one arrival. No template product, photo, price, claim, form or script was imported. Template source: https://github.com/8bsite/product-landing-page-template (MIT).

The product type is a bold sans for practical controls and a warm serif italic for the human payoff. A quiet pale-green surface carries most of the page; deep blue-green frames the flock and the field-build section, while warm amber marks the human path. The visual system avoids invented performance numbers, simulated maps and photos that could be mistaken for test evidence. Both hero and figure are illustrative, never diagnostic or navigation proof.

The primary action opens the current capture and tracking field build. Evidence has a separate clear link. The camera page keeps its existing controls and safety language while the actual navigation gate remains open. Do not run the flock animation on the camera screen. Future visitor UI should have a single large directional cue, a persistent state line (tracking / checking / pause), and a stop action; arrows stay hidden without verified localization.

`/` and `/welcome.html` show the product entry. The previous root calibration test is at `/diagnostic.html`; `/live.html` and `/evidence.html` retain their paths.

The entry page is React/TypeScript with Tailwind 4, under `apps/web`. The requested copied component lives at `apps/web/src/components/ui/murmuration-wordmark.tsx`; this is the standard `/components/ui` folder relative to the app's `src`. `@/` maps to that `src`, and `apps/web/components.json` enables shadcn CLI additions later. No shadcn primitives, icon package, stock images or hosted fonts are needed for this screen.

For reduced motion, the flock forms a static wordmark. The figure itself respects Hairline's motion preference; both are kept below the camera test. All essential words and actions are HTML text, with keyboard focus and a named illustration iframe.

The page order is the promise, the gap between pin and destination, the one-walk route, the pause rule, then the current build and evidence. This replaces the earlier full-screen flock layout. The embedded Hairline view shows the route drawing; its own full study stays available through a link. No em dashes appear in page copy.

Entry actions and field/diagnostic buttons use the same liquid-glass language: translucent edge, inset light, hover lift where hover exists, and a small pressed response on touch. The main action uses warm amber; secondary controls remain clear. The camera screen uses CSS only, so no SVG displacement filter runs during tracking. Links remain links, buttons remain buttons, and reduced-motion settings suppress movement. Hairline's standalone figure controls retain their original design.
