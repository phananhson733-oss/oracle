(function() {
  'use strict';

  const CONFIG = {
    fonts: [
      {
        family: 'Readex Pro',
        urls: [
          'https://fonts.gstatic.com/s/readexpro/v14/ijwXsSlRRtMfK7uR6yVZVX5eD9g.woff2',
          'https://fonts.gstatic.com/s/readexpro/v14/ijwXsSlRRtMfK7uR6yVZVX5eD9g.woff',
        ],
        weights: [300, 400, 500, 600],
      },
      {
        family: 'Cormorant Garamond',
        urls: [
          'https://fonts.gstatic.com/s/cormorantgaramond/v22/co3YmX5slCNuHLi8bWQdNOo8PM.woff2',
          'https://fonts.gstatic.com/s/cormorantgaramond/v22/co3YmX5slCNuHLi8bWQdNOo8PM.woff',
        ],
        weights: [400, 500, 600],
      },
    ],
    timeout: 3000,
    fallbackFont: 'system-ui, -apple-system, sans-serif',
  };

  const FontLoader = {
    state: new Map(),

    loadFont(font) {
      const { family, urls, weights } = font;
      const fontState = this.state.get(family) || { loaded: false, loading: false };

      if (fontState.loading || fontState.loaded) {
        return Promise.resolve();
      }

      this.state.set(family, { loaded: false, loading: true });
      document.body.classList.add('loading-fonts');

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn(`Font ${family} loading timeout`);
          this.state.set(family, { loaded: false, loading: false });
          document.body.classList.remove('loading-fonts');
          reject(new Error(`Font ${family} loading timeout`));
        }, CONFIG.timeout);

        let loadedCount = 0;
        const requiredCount = weights.length;

        weights.forEach((weight) => {
          const fontFace = new FontFace(
            `${family} ${weight}`,
            `url(${urls[0]}) format('woff2'), url(${urls[1]}) format('woff')`
          );

          fontFace.load()
            .then(() => {
              loadedCount++;
              if (loadedCount === requiredCount) {
                clearTimeout(timeout);
                this.state.set(family, { loaded: true, loading: false });
                document.body.classList.remove('loading-fonts');
                document.body.classList.add('fonts-loaded');
                resolve();
              }
            })
            .catch((error) => {
              console.error(`Font ${family} ${weight} loading failed:`, error);
              loadedCount++;
              if (loadedCount === requiredCount) {
                clearTimeout(timeout);
                this.state.set(family, { loaded: false, loading: false });
                document.body.classList.remove('loading-fonts');
                reject(error);
              }
            });
        });
      });
    },

    async loadAll() {
      try {
        await Promise.all(CONFIG.fonts.map((font) => this.loadFont(font)));
        console.log('All fonts loaded successfully');
        this.trackPerformance();
      } catch (error) {
        console.error('Font loading failed:', error);
        document.body.classList.remove('loading-fonts');
      }
    },

    trackPerformance() {
      if (window.performance && window.performance.getEntriesByType) {
        const fontEntries = window.performance.getEntriesByType('resource')
          .filter((entry) => entry.name.includes('.woff'));

        if (fontEntries.length > 0) {
          const totalLoadTime = fontEntries.reduce((sum, entry) => sum + entry.duration, 0);
          const avgLoadTime = totalLoadTime / fontEntries.length;

          if (window.gtag) {
            window.gtag('event', 'font_load_complete', {
              event_category: 'performance',
              event_label: 'all_fonts',
              value: Math.round(totalLoadTime),
              custom_map: {
                font_count: fontEntries.length,
                avg_load_time: Math.round(avgLoadTime),
              },
            });
          }
        }
      }
    },

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.loadAll());
      } else {
        this.loadAll();
      }
    },
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      document.body.classList.add('fonts-loaded');
      document.body.classList.remove('loading-fonts');
    }).catch(() => {
      FontLoader.init();
    });
  } else {
    FontLoader.init();
  }
})();
