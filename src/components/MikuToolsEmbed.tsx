import React, { useState, useEffect } from 'react';

const MikuToolsEmbed: React.FC = () => {
  // 设置一个固定的容器高度，以便更好地控制嵌入内容的可见区域
  // 这个值可能需要根据实际预览效果进一步微调
  const containerHeight = '600px'; // 调整高度以裁剪底部说明

  const [isLoading, setIsLoading] = useState(true);

  // 如果高度是固定的，则不需要窗口大小监听器
  // useEffect(() => {
  //   const handleResize = () => {
  //     // setIframeHeight(`${window.innerHeight * 0.6}px`); 
  //   };
  //   window.addEventListener('resize', handleResize);
  //   handleResize(); 
  //   return () => window.removeEventListener('resize', handleResize);
  // }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg" style={{ height: containerHeight }}>
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
          // 缩放内容以适应更多，并补偿iframe大小
          transform: 'scale(0.75)', 
          transformOrigin: '0 0', // 从左上角开始缩放
          width: '133.33%', // 100 / 0.75
          height: '133.33%', // 100 / 0.75
          // 调整位置以裁剪头部/底部，并使所需内容可见
          position: 'absolute',
          top: '-100px', // 向上移动，隐藏顶部标题
          left: '-20px', // 向左移动，隐藏左侧边缘
        }}
      ></iframe>
    </div>
  );
};

export default MikuToolsEmbed;