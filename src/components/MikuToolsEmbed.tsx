import React, { useState, useEffect } from 'react';

const MikuToolsEmbed: React.FC = () => {
  const [iframeHeight, setIframeHeight] = useState('600px'); // Default height, will adjust dynamically
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Adjust iframe height based on window size for better responsiveness
    const handleResize = () => {
      setIframeHeight(`${window.innerHeight - 200}px`); // Adjust as needed
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial height

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg" style={{ height: iframeHeight }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-600">加载中...</p>
        </div>
      )}
      <iframe
        src="https://tools.miku.ac/anime_tts/"
        title="MikuTools Anime TTS"
        width="100%"
        height="100%"
        frameBorder="0"
        onLoad={() => setIsLoading(false)}
        // Apply transform to visually crop and scale the content
        // This requires careful adjustment based on the target page's layout
        // The values below are estimates and might need fine-tuning
        style={{
          transform: 'scale(0.8)', // Scale down the content
          transformOrigin: 'top left', // Scale from top-left corner
          width: '125%', // Compensate for scaling to fill width
          height: '125%', // Compensate for scaling to fill height
          // Adjust position to crop header/footer. These values are highly dependent on the target page.
          // You might need to inspect the target page to get precise offsets.
          // For example, if the header is 80px tall and footer is 100px tall, and content is centered.
          // This is a visual trick, not actual DOM manipulation.
          position: 'absolute',
          top: '-10%', // Move up to hide top part (e.g., header)
          left: '-10%', // Move left to hide left sidebar if any
          // Further adjustments might be needed for specific content areas
          // For example, if the main content starts at 200px from top and is 800px wide:
          // top: '-200px', width: '800px', left: 'auto', right: 'auto'
          // This is a complex task without direct control over the embedded page.
          // For now, a general scale and slight offset to hide common headers/footers.
        }}
      ></iframe>
    </div>
  );
};

export default MikuToolsEmbed;