// Tailwind config for the design-system export only — the app keeps the root
// tailwind.config.ts untouched.
//
// Same theme as the app, but two deliberate differences:
//
// 1. `content` also covers .design-sync/previews/**. Tailwind is JIT, so a
//    class that appears only in an authored preview is otherwise never emitted
//    and that card renders unstyled.
//
// 2. A `safelist`. This is the important one. A design agent building screens
//    from this system renders against the SHIPPED stylesheet — nothing
//    recompiles Tailwind for it. Without a safelist the available vocabulary is
//    only what this repo happens to use today, so the agent's own layout glue
//    fails silently: `grid-cols-3` works, `grid-cols-7` does nothing;
//    `text-2xl` works, `text-7xl` does nothing. The patterns below emit the
//    full standard scales for the utilities an agent actually reaches for when
//    composing a screen, so its output is predictable rather than a lottery.
import type { Config } from 'tailwindcss';
import base from '../tailwind.config';

// Semantic colour families from the app's theme. Enumerated (rather than a
// broad pattern) so the safelist carries the DS's own vocabulary and not all of
// Tailwind's default palette.
const COLORS = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
  'muted', 'muted-foreground', 'accent', 'accent-foreground',
  'destructive', 'destructive-foreground', 'border', 'input', 'ring',
].join('|');

const SPACE = '0|0\\.5|1|1\\.5|2|2\\.5|3|3\\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|40|48|56|64';
const RESPONSIVE = ['sm', 'md', 'lg', 'xl'];

const config: Config = {
  ...base,
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './.design-sync/previews/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Spacing — padding, margin, gap.
    { pattern: new RegExp(`^(p|px|py|pt|pr|pb|pl)-(${SPACE})$`), variants: RESPONSIVE },
    { pattern: new RegExp(`^(m|mx|my|mt|mr|mb|ml)-(${SPACE})$`), variants: RESPONSIVE },
    { pattern: new RegExp(`^(gap|gap-x|gap-y)-(${SPACE})$`), variants: RESPONSIVE },
    { pattern: new RegExp(`^space-(x|y)-(${SPACE})$`) },

    // Layout.
    { pattern: /^grid-cols-(1|2|3|4|5|6|7|8|9|10|11|12)$/, variants: RESPONSIVE },
    { pattern: /^col-span-(1|2|3|4|5|6|7|8|9|10|11|12|full)$/, variants: RESPONSIVE },
    { pattern: /^grid-rows-(1|2|3|4|5|6)$/ },
    { pattern: /^(flex|inline-flex|grid|inline-grid|block|inline-block|hidden|contents)$/, variants: RESPONSIVE },
    { pattern: /^flex-(row|row-reverse|col|col-reverse|wrap|nowrap|1|auto|initial|none)$/, variants: RESPONSIVE },
    { pattern: /^(items|justify|content|self|place-items|place-content)-(start|end|center|between|around|evenly|stretch|baseline)$/, variants: RESPONSIVE },
    { pattern: /^(relative|absolute|fixed|sticky|static)$/ },
    { pattern: /^(inset|top|right|bottom|left)-(0|1|2|3|4|6|8|auto|full)$/ },
    { pattern: /^z-(0|10|20|30|40|50)$/ },
    { pattern: /^(overflow|overflow-x|overflow-y)-(auto|hidden|clip|visible|scroll)$/ },

    // Sizing.
    { pattern: new RegExp(`^(w|h|min-w|min-h|max-w|max-h)-(${SPACE}|auto|full|screen|min|max|fit|px)$`), variants: RESPONSIVE },
    { pattern: /^max-w-(xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|prose|none)$/, variants: RESPONSIVE },
    { pattern: new RegExp(`^size-(${SPACE}|full|px)$`) },
    { pattern: /^aspect-(auto|square|video)$/ },

    // Typography.
    { pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/, variants: RESPONSIVE },
    { pattern: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/ },
    { pattern: /^(leading|tracking)-(none|tight|snug|normal|relaxed|loose|wide|wider|widest|tighter)$/ },
    { pattern: /^text-(left|center|right|justify)$/, variants: RESPONSIVE },
    { pattern: /^(truncate|text-balance|text-pretty|whitespace-nowrap|break-words|uppercase|lowercase|capitalize|italic|underline|line-through|tabular-nums)$/ },
    { pattern: /^line-clamp-(1|2|3|4|5|6|none)$/ },

    // Colour — the DS's own semantic families only.
    { pattern: new RegExp(`^(bg|text|border|ring|fill|stroke|from|to|via)-(${COLORS})$`), variants: ['hover', 'focus', 'active', 'disabled'] },

    // Borders, radius, shadow, opacity.
    { pattern: /^rounded(-(none|sm|md|lg|xl|2xl|3xl|full))?$/ },
    { pattern: /^rounded-(t|r|b|l|tl|tr|br|bl)(-(none|sm|md|lg|xl|2xl|3xl|full))?$/ },
    { pattern: /^border(-(0|2|4|8))?$/ },
    { pattern: /^border-(t|r|b|l)(-(0|2|4|8))?$/ },
    { pattern: /^shadow(-(sm|md|lg|xl|2xl|inner|none))?$/ },
    { pattern: /^opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100)$/ },

    // Interaction affordances an agent commonly needs.
    { pattern: /^cursor-(pointer|default|not-allowed|wait)$/ },
    { pattern: /^(transition|transition-all|transition-colors|transition-opacity|transition-transform)$/ },
    { pattern: /^duration-(75|100|150|200|300|500|700|1000)$/ },
  ],
};

export default config;
