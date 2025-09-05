export function initZendesk() {
  if (document.getElementById('ze-snippet')) return;

  // Configure widget settings before loading
  (window as any).zESettings = {
    webWidget: {
      color: { theme: '#ff4205' },
      launcher: {
        mobile: {
          labelVisible: false,
        },
      },
    },
  };

  // Add custom CSS before widget loads
  const style = document.createElement('style');
  style.textContent = `
    #launcher {
      transform: scale(0.85) !important;
      transform-origin: bottom right !important;
    }
    iframe#launcher {
      transform: scale(0.85) !important;
      transform-origin: bottom right !important;
    }
  `;
  document.head.appendChild(style);

  const script = document.createElement('script');
  script.id = 'ze-snippet';
  script.src = `https://static.zdassets.com/ekr/snippet.js?key=0f0d79fc-9fa4-4a27-846d-389524cad855`;
  script.async = true;
  document.head.appendChild(script);
}
