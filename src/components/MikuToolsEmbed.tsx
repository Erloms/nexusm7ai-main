import React, { useState, useEffect } from 'react';

const MikuToolsEmbed: React.FC = () => {
  const [iframeHeight, setIframeHeight] = useState('600px'); // Default height, will adjust dynamically
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Adjust iframe height based on window size for better responsiveness
    const handleResize = () => {
      // Set height to fill the available space in the card, minus some padding/margins
      // This value might need fine-tuning based on the parent container's actual height
      setIframeHeight(`${window.innerHeight * 0.6}px`); // Roughly 60% of viewport height
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
        style={{
          // Scale down the content to fit more, and compensate iframe size
          transform: 'scale(0.75)', 
          transformOrigin: '0 0', // Scale from top-left corner
          width: '133.33%', // 100 / 0.75
          height: '133.33%', // 100 / 0.75
          // Adjust position to crop header/footer and bring desired content into view
          position: 'absolute',
          top: '-150px', // Shift up to hide top part and reveal content below (input field)
          left: '-50px', // Shift left to hide left sidebar - Adjusted from -100px to -50px
        }}
      ></iframe>
    </div>
  );
};

export default MikuToolsEmbed;