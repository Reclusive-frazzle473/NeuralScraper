import type { Page } from 'playwright';

export interface UIAnalysis {
  layout: {
    type: string;
    sections: SectionInfo[];
  };
  typography: {
    fontFamilies: string[];
    headingSizes: Record<string, string>;
    bodyFontSize: string;
    lineHeight: string;
  };
  spacing: {
    containerMaxWidth: string;
    commonPaddings: string[];
    commonMargins: string[];
    commonGaps: string[];
  };
  components: ComponentInfo[];
  navigation: NavigationInfo;
}

interface SectionInfo {
  tag: string;
  classes: string;
  role: string;
  display: string;
  width: string;
  height: string;
  childCount: number;
}

interface ComponentInfo {
  type: string;
  count: number;
  examples: string[];
}

interface NavigationInfo {
  hasHeader: boolean;
  hasFooter: boolean;
  hasNav: boolean;
  hasSidebar: boolean;
  navItems: number;
}

export async function analyzeUI(page: Page): Promise<UIAnalysis> {
  return await page.evaluate(() => {
    const cs = (el: Element) => getComputedStyle(el);

    // Layout sections
    const sectionTags = ['header', 'nav', 'main', 'section', 'aside', 'footer', 'article'];
    const sections: SectionInfo[] = [];
    for (const tag of sectionTags) {
      document.querySelectorAll(tag).forEach((el) => {
        const style = cs(el);
        sections.push({
          tag,
          classes: el.className.toString().slice(0, 100),
          role: el.getAttribute('role') || '',
          display: style.display,
          width: style.width,
          height: style.height,
          childCount: el.children.length,
        });
      });
    }

    // Also check divs with common layout roles
    document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"]').forEach((el) => {
      const style = cs(el);
      sections.push({
        tag: el.tagName.toLowerCase(),
        classes: el.className.toString().slice(0, 100),
        role: el.getAttribute('role') || '',
        display: style.display,
        width: style.width,
        height: style.height,
        childCount: el.children.length,
      });
    });

    // Typography
    const fontFamilies = new Set<string>();
    const headingSizes: Record<string, string> = {};
    for (const h of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      const el = document.querySelector(h);
      if (el) {
        const style = cs(el);
        headingSizes[h] = style.fontSize;
        fontFamilies.add(style.fontFamily.split(',')[0].trim().replace(/['"]/g, ''));
      }
    }

    const body = document.body;
    const bodyStyle = cs(body);
    fontFamilies.add(bodyStyle.fontFamily.split(',')[0].trim().replace(/['"]/g, ''));

    // Spacing
    const paddings = new Set<string>();
    const margins = new Set<string>();
    const gaps = new Set<string>();
    let containerMaxWidth = 'none';

    document.querySelectorAll('div, section, main, article').forEach((el) => {
      const style = cs(el);
      if (style.maxWidth !== 'none' && style.maxWidth !== '0px') {
        containerMaxWidth = style.maxWidth;
      }
      if (style.padding !== '0px') paddings.add(style.padding);
      if (style.margin !== '0px') margins.add(style.margin);
      if (style.gap && style.gap !== 'normal') gaps.add(style.gap);
    });

    // Components
    const componentMap: Record<string, number> = {};
    const componentExamples: Record<string, string[]> = {};

    const detect = (selector: string, name: string) => {
      const els = document.querySelectorAll(selector);
      if (els.length > 0) {
        componentMap[name] = els.length;
        componentExamples[name] = Array.from(els).slice(0, 3).map((el) =>
          el.outerHTML.slice(0, 150),
        );
      }
    };

    detect('button, [role="button"], input[type="submit"]', 'buttons');
    detect('input, textarea, select', 'form-inputs');
    detect('form', 'forms');
    detect('img', 'images');
    detect('video', 'videos');
    detect('a[href]', 'links');
    detect('ul, ol', 'lists');
    detect('table', 'tables');
    detect('[class*="card"], [class*="Card"]', 'cards');
    detect('[class*="modal"], [class*="Modal"], [class*="dialog"]', 'modals');
    detect('[class*="hero"], [class*="Hero"]', 'hero-sections');
    detect('[class*="slider"], [class*="carousel"], [class*="Carousel"]', 'carousels');

    const components: ComponentInfo[] = Object.entries(componentMap).map(([type, count]) => ({
      type,
      count,
      examples: componentExamples[type] || [],
    }));

    // Navigation
    const hasHeader = document.querySelector('header') !== null;
    const hasFooter = document.querySelector('footer') !== null;
    const hasNav = document.querySelector('nav') !== null;
    const hasSidebar = document.querySelector('aside, [class*="sidebar"], [class*="Sidebar"]') !== null;
    const navItems = document.querySelectorAll('nav a, nav button').length;

    // Detect layout type
    const mainDisplay = document.querySelector('main')
      ? cs(document.querySelector('main')!).display
      : bodyStyle.display;
    const layoutType = mainDisplay.includes('grid')
      ? 'grid'
      : mainDisplay.includes('flex')
        ? 'flexbox'
        : 'block';

    return {
      layout: {
        type: layoutType,
        sections: sections.slice(0, 30),
      },
      typography: {
        fontFamilies: [...fontFamilies].slice(0, 10),
        headingSizes,
        bodyFontSize: bodyStyle.fontSize,
        lineHeight: bodyStyle.lineHeight,
      },
      spacing: {
        containerMaxWidth,
        commonPaddings: [...paddings].slice(0, 10),
        commonMargins: [...margins].slice(0, 10),
        commonGaps: [...gaps].slice(0, 10),
      },
      components,
      navigation: { hasHeader, hasFooter, hasNav, hasSidebar, navItems },
    };
  });
}
