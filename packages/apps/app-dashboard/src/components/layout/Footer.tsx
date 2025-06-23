export default function Footer() {
  return (
    <footer className="absolute bottom-5 left-1/2 transform -translate-x-1/2 text-gray-400 text-xs">
      <a
        target="_blank"
        href="https://www.litprotocol.com/legal/terms-of-service"
        className="text-gray-400 no-underline mx-1 hover:text-gray-600 transition-colors"
        rel="noopener noreferrer"
        style={{ color: '#999', textDecoration: 'none' }}
      >
        Terms
      </a>
      <span className="mx-1">/</span>
      <a
        target="_blank"
        href="https://www.litprotocol.com/legal/privacy-policy"
        className="text-gray-400 no-underline mx-1 hover:text-gray-600 transition-colors"
        rel="noopener noreferrer"
        style={{ color: '#999', textDecoration: 'none' }}
      >
        Privacy
      </a>
    </footer>
  );
}
