# Design & Code Standards for Daily Ops Checklist

## Text Color Rules

### Cream Background (#FAFAF9) - Critical Rule

**Never use light gray or muted text colors on the cream (#FAFAF9) background.**

All text on cream backgrounds must be:
- ✅ **#1C1917** (dark brown) - primary text, headings, labels
- ✅ **Darker** - anything darker than #1C1917 is acceptable

**Forbidden colors on cream backgrounds:**
- ❌ #A89880 (light taupe)
- ❌ #78716C (muted gray)
- ❌ #6B5B4E (medium taupe)
- ❌ rgba(255,255,255,x) - any light/white with opacity

### Why This Matters

The cream background (#FAFAF9) is nearly white. Light gray text on it has poor contrast and is hard to read. This rule applies to:
- Section labels ("Progress", "Stats", "History")
- Descriptive text
- Helper text
- Subtext and captions
- Status text

### Exception: Dark Backgrounds

On dark backgrounds (#1C1917, #141210), light text is always acceptable:
- #F5F0E8 (cream text on dark)
- #A89880 (light taupe on dark)
- Any lighter color works on dark

## Color Palette

**Text Colors:**
- Primary/Headings on cream: #1C1917
- Secondary on cream: #1C1917 (same)
- Primary on dark: #F5F0E8
- Secondary on dark: #A89880

**Background Colors:**
- Interior/dashboard: #FAFAF9 (cream)
- Landing/dark: #1C1917, #141210

## Implementation Checklist

Before pushing any changes:
1. ✅ Verify all text on cream backgrounds is #1C1917 or darker
2. ✅ Verify all text on dark backgrounds is light
3. ✅ Run `npm run build` locally
4. ✅ Visually verify contrast in browser
