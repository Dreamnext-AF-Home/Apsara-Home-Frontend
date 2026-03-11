/** Named color palette with their hex values */
const COLOR_PALETTE: { name: string; hex: string; r: number; g: number; b: number }[] = [
  // Whites & Grays
  { name: 'White',       hex: '#ffffff', r: 255, g: 255, b: 255 },
  { name: 'Off White',   hex: '#f5f5f5', r: 245, g: 245, b: 245 },
  { name: 'Light Gray',  hex: '#d1d5db', r: 209, g: 213, b: 219 },
  { name: 'Gray',        hex: '#94a3b8', r: 148, g: 163, b: 184 },
  { name: 'Silver',      hex: '#c0c0c0', r: 192, g: 192, b: 192 },
  { name: 'Dark Gray',   hex: '#6b7280', r: 107, g: 114, b: 128 },
  { name: 'Charcoal',    hex: '#374151', r: 55,  g: 65,  b: 81  },
  { name: 'Black',       hex: '#000000', r: 0,   g: 0,   b: 0   },
  // Browns & Beiges (common for furniture)
  { name: 'Beige',       hex: '#f5f0e8', r: 245, g: 240, b: 232 },
  { name: 'Cream',       hex: '#fffdd0', r: 255, g: 253, b: 208 },
  { name: 'Ivory',       hex: '#fffff0', r: 255, g: 255, b: 240 },
  { name: 'Tan',         hex: '#d2b48c', r: 210, g: 180, b: 140 },
  { name: 'Sand',        hex: '#c2b280', r: 194, g: 178, b: 128 },
  { name: 'Khaki',       hex: '#c3b091', r: 195, g: 176, b: 145 },
  { name: 'Light Brown', hex: '#c68642', r: 198, g: 134, b: 66  },
  { name: 'Brown',       hex: '#8b4513', r: 139, g: 69,  b: 19  },
  { name: 'Dark Brown',  hex: '#5c3317', r: 92,  g: 51,  b: 23  },
  { name: 'Walnut',      hex: '#773f1a', r: 119, g: 63,  b: 26  },
  { name: 'Mahogany',    hex: '#c04000', r: 192, g: 64,  b: 0   },
  { name: 'Oak',         hex: '#d4a96a', r: 212, g: 169, b: 106 },
  { name: 'Teak',        hex: '#b5651d', r: 181, g: 101, b: 29  },
  // Reds
  { name: 'Light Red',   hex: '#ff6b6b', r: 255, g: 107, b: 107 },
  { name: 'Red',         hex: '#ef4444', r: 239, g: 68,  b: 68  },
  { name: 'Dark Red',    hex: '#991b1b', r: 153, g: 27,  b: 27  },
  { name: 'Crimson',     hex: '#dc143c', r: 220, g: 20,  b: 60  },
  { name: 'Maroon',      hex: '#800000', r: 128, g: 0,   b: 0   },
  { name: 'Coral',       hex: '#ff7f7f', r: 255, g: 127, b: 127 },
  { name: 'Salmon',      hex: '#fa8072', r: 250, g: 128, b: 114 },
  { name: 'Rose',        hex: '#ff007f', r: 255, g: 0,   b: 127 },
  // Oranges
  { name: 'Peach',       hex: '#ffcba4', r: 255, g: 203, b: 164 },
  { name: 'Orange',      hex: '#f97316', r: 249, g: 115, b: 22  },
  { name: 'Dark Orange', hex: '#ea580c', r: 234, g: 88,  b: 12  },
  { name: 'Burnt Orange',hex: '#cc5500', r: 204, g: 85,  b: 0   },
  { name: 'Amber',       hex: '#f59e0b', r: 245, g: 158, b: 11  },
  // Yellows
  { name: 'Light Yellow',hex: '#fef9c3', r: 254, g: 249, b: 195 },
  { name: 'Yellow',      hex: '#eab308', r: 234, g: 179, b: 8   },
  { name: 'Gold',        hex: '#ffd700', r: 255, g: 215, b: 0   },
  { name: 'Mustard',     hex: '#e3a008', r: 227, g: 160, b: 8   },
  // Greens
  { name: 'Mint',        hex: '#98ff98', r: 152, g: 255, b: 152 },
  { name: 'Light Green', hex: '#86efac', r: 134, g: 239, b: 172 },
  { name: 'Green',       hex: '#22c55e', r: 34,  g: 197, b: 94  },
  { name: 'Dark Green',  hex: '#15803d', r: 21,  g: 128, b: 61  },
  { name: 'Olive',       hex: '#808000', r: 128, g: 128, b: 0   },
  { name: 'Forest Green',hex: '#228b22', r: 34,  g: 139, b: 34  },
  { name: 'Sage',        hex: '#87ae73', r: 135, g: 174, b: 115 },
  { name: 'Teal',        hex: '#14b8a6', r: 20,  g: 184, b: 166 },
  { name: 'Emerald',     hex: '#10b981', r: 16,  g: 185, b: 129 },
  // Blues
  { name: 'Light Blue',  hex: '#93c5fd', r: 147, g: 197, b: 253 },
  { name: 'Sky Blue',    hex: '#38bdf8', r: 56,  g: 189, b: 248 },
  { name: 'Blue',        hex: '#3b82f6', r: 59,  g: 130, b: 246 },
  { name: 'Royal Blue',  hex: '#4169e1', r: 65,  g: 105, b: 225 },
  { name: 'Dark Blue',   hex: '#1d4ed8', r: 29,  g: 78,  b: 216 },
  { name: 'Navy',        hex: '#1e3a5f', r: 30,  g: 58,  b: 95  },
  { name: 'Midnight Blue',hex:'#191970', r: 25,  g: 25,  b: 112 },
  { name: 'Cerulean',    hex: '#2a52be', r: 42,  g: 82,  b: 190 },
  { name: 'Denim',       hex: '#1560bd', r: 21,  g: 96,  b: 189 },
  // Purples / Pinks
  { name: 'Lavender',    hex: '#e6d9f7', r: 230, g: 217, b: 247 },
  { name: 'Light Purple',hex: '#c084fc', r: 192, g: 132, b: 252 },
  { name: 'Purple',      hex: '#a855f7', r: 168, g: 85,  b: 247 },
  { name: 'Dark Purple', hex: '#7e22ce', r: 126, g: 34,  b: 206 },
  { name: 'Violet',      hex: '#8b00ff', r: 139, g: 0,   b: 255 },
  { name: 'Indigo',      hex: '#6366f1', r: 99,  g: 102, b: 241 },
  { name: 'Pink',        hex: '#ec4899', r: 236, g: 72,  b: 153 },
  { name: 'Light Pink',  hex: '#fbcfe8', r: 251, g: 207, b: 232 },
  { name: 'Hot Pink',    hex: '#ff69b4', r: 255, g: 105, b: 180 },
  { name: 'Magenta',     hex: '#ff00ff', r: 255, g: 0,   b: 255 },
  // Fabric / material colors
  { name: 'Linen',       hex: '#faf0e6', r: 250, g: 240, b: 230 },
  { name: 'Smoke',       hex: '#708090', r: 112, g: 128, b: 144 },
  { name: 'Espresso',    hex: '#3c2005', r: 60,  g: 32,  b: 5   },
  { name: 'Caramel',     hex: '#c68642', r: 198, g: 134, b: 66  },
  { name: 'Mocha',       hex: '#967259', r: 150, g: 114, b: 89  },
]

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6 && clean.length !== 3) return null
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

/** Returns true if the string looks like a CSS hex color */
export function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
}

/**
 * Converts a hex color to the nearest human-readable color name.
 * Falls back to the original value if it's not a hex.
 */
export function hexToColorName(hex: string): string {
  if (!isHexColor(hex)) return hex
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  let closest = COLOR_PALETTE[0]
  let minDist = Infinity

  for (const color of COLOR_PALETTE) {
    const dist =
      (rgb.r - color.r) ** 2 +
      (rgb.g - color.g) ** 2 +
      (rgb.b - color.b) ** 2
    if (dist < minDist) {
      minDist = dist
      closest = color
    }
  }

  return closest.name
}

/**
 * Returns a display-friendly color label.
 * If the stored name looks like a hex, converts it to a color name.
 * Otherwise returns the stored name as-is.
 */
export function displayColorName(name: string, hex?: string): string {
  if (!name) return ''
  if (isHexColor(name)) return hexToColorName(name)
  return name
}
