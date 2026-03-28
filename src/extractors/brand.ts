import type { Page } from 'playwright';

export interface BrandAnalysis {
  colors: {
    primary: string[];
    background: string[];
    text: string[];
    accent: string[];
    allColors: ColorFrequency[];
  };
  fonts: {
    families: string[];
    headingFont: string;
    bodyFont: string;
    weights: string[];
  };
  logos: LogoInfo[];
  favicon: string;
  brandName: string;
}

interface ColorFrequency {
  color: string;
  count: number;
  context: string;
}

interface LogoInfo {
  src: string;
  alt: string;
  width: number;
  height: number;
  location: string;
}

export async function extractBrand(page: Page): Promise<BrandAnalysis> {
  return await page.evaluate(() => {
    const cs = (el: Element) => getComputedStyle(el);

    // Colors
    const colorMap = new Map<string, { count: number; context: string }>();

    const addColor = (color: string, context: string) => {
      if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return;
      const existing = colorMap.get(color);
      if (existing) {
        existing.count++;
      } else {
        colorMap.set(color, { count: 1, context });
      }
    };

    const bgColors: string[] = [];
    const textColors: string[] = [];

    document.querySelectorAll('*').forEach((el) => {
      const style = cs(el);
      addColor(style.backgroundColor, 'background');
      addColor(style.color, 'text');
      addColor(style.borderColor, 'border');

      if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        bgColors.push(style.backgroundColor);
      }
      if (style.color) {
        textColors.push(style.color);
      }
    });

    // Button/link colors as accent
    const accentColors: string[] = [];
    document.querySelectorAll('a, button, [role="button"]').forEach((el) => {
      const style = cs(el);
      if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        accentColors.push(style.backgroundColor);
      }
      if (style.color) {
        accentColors.push(style.color);
      }
    });

    // Fonts
    const fontFamilies = new Set<string>();
    const fontWeights = new Set<string>();
    let headingFont = '';
    let bodyFont = '';

    document.querySelectorAll('*').forEach((el) => {
      const style = cs(el);
      const family = style.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
      if (family) fontFamilies.add(family);
      fontWeights.add(style.fontWeight);
    });

    const h1 = document.querySelector('h1');
    if (h1) headingFont = cs(h1).fontFamily.split(',')[0].trim().replace(/['"]/g, '');

    bodyFont = cs(document.body).fontFamily.split(',')[0].trim().replace(/['"]/g, '');

    // Logos
    const logos: LogoInfo[] = [];
    const logoSelectors = [
      'img[alt*="logo" i]',
      'img[class*="logo" i]',
      'img[id*="logo" i]',
      '.logo img',
      '#logo img',
      'header img:first-of-type',
      'a[class*="logo" i] img',
      'svg[class*="logo" i]',
    ];

    for (const selector of logoSelectors) {
      document.querySelectorAll(selector).forEach((el) => {
        const img = el as HTMLImageElement;
        const rect = el.getBoundingClientRect();
        logos.push({
          src: img.src || img.getAttribute('data-src') || '',
          alt: img.alt || '',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          location: selector,
        });
      });
    }

    // Dedupe logos by src
    const seenSrc = new Set<string>();
    const uniqueLogos = logos.filter((l) => {
      if (seenSrc.has(l.src)) return false;
      seenSrc.add(l.src);
      return true;
    });

    // Brand name from title or OG
    const ogSiteName =
      document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
    const brandName = ogSiteName || document.title.split(/[|\-–—]/)[0].trim();

    // Favicon
    const faviconEl = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    const favicon = faviconEl?.getAttribute('href') || '/favicon.ico';

    // Sort colors by frequency
    const allColors = [...colorMap.entries()]
      .map(([color, data]) => ({ color, count: data.count, context: data.context }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const unique = (arr: string[]) => [...new Set(arr)].slice(0, 10);

    return {
      colors: {
        primary: unique(accentColors).slice(0, 5),
        background: unique(bgColors).slice(0, 5),
        text: unique(textColors).slice(0, 5),
        accent: unique(accentColors).slice(0, 5),
        allColors,
      },
      fonts: {
        families: [...fontFamilies].slice(0, 10),
        headingFont: headingFont || bodyFont,
        bodyFont,
        weights: [...fontWeights].slice(0, 10),
      },
      logos: uniqueLogos.slice(0, 5),
      favicon,
      brandName,
    };
  });
}
