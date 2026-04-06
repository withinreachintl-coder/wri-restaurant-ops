# Design & Code Standards for Daily Ops Checklist

## Text Color Rules (Critical!)

### The Master Rule
**Light backgrounds = Dark text. Dark backgrounds = Light text.**

### Cream Background (#FAFAF9) - Use Dark Text

All text on cream backgrounds must be:
- ✅ **#1C1917** (dark brown) - primary text, headings, labels
- ✅ **Darker** - anything darker than #1C1917 is acceptable

**Forbidden colors on cream (#FAFAF9):**
- ❌ #F5F0E8 (cream/white - invisible)
- ❌ #A89880 (light taupe - barely visible)
- ❌ #78716C (muted gray)
- ❌ #6B5B4E (medium taupe)
- ❌ rgba(255,255,255,x) - any light/white with opacity

**Applies to:**
- Section labels ("Progress", "Stats", "History")
- Section headings (h2, h3 elements)
- Descriptive and helper text
- Subtext and captions
- All dashboard interior page text

### Dark Background (#1C1917, #141210) - Use Light Text

All text on dark backgrounds must be:
- ✅ **#F5F0E8** (cream/white) - primary text, headings
- ✅ **#A89880** (light taupe) - secondary/muted text
- ✅ **Lighter** - anything lighter than #1C1917

**Applies to:**
- Navigation headers and labels
- Nav/header elements
- Any text inside dark-background containers

### Why This Matters

- Cream (#FAFAF9) is nearly white — light colors vanish on it
- Dark (#1C1917) is nearly black — dark colors vanish on it
- Good contrast = readable. Poor contrast = invisible

## Color Palette

**Text Colors:**
- On cream (#FAFAF9): #1C1917 (dark brown)
- On dark (#1C1917): #F5F0E8 (cream/white)
- Secondary on dark: #A89880 (light taupe)

**Background Colors:**
- Interior/dashboard: #FAFAF9 (cream)
- Navigation/headers: #1C1917 (dark)
- Landing sections: #1C1917, #141210 (dark)

## Implementation Checklist

Before pushing any changes:
1. ✅ Verify all text on cream backgrounds is #1C1917 or darker
2. ✅ Verify all text on dark backgrounds is light
3. ✅ Run `npm run build` locally
4. ✅ Visually verify contrast in browser
