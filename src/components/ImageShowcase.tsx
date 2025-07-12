import React, { useState, useEffect } from 'react';
import { Palette, Download, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const ImageShowcase = () => {
  const { toast } = useToast();
  const [api1, setApi1] = useState<CarouselApi>();
  const [api2, setApi2] = useState<CarouselApi>();
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // 使用 public/lovable-uploads 路径下的图片，并根据截图更新内容
  const showcaseImages = [
    // 将支付码作为第一张图片
    {
      url: "/lovable-uploads/alipay-qr-dynamic.png",
      title: "扫码支付",
      description: "支付宝扫码支付，开通会员",
      prompt: "Alipay QR code for payment, membership activation"
    },
    {
      url: "/lovable-uploads/0bb49517-db51-4ccc-b82b-6ceecc80c8d8.jpeg",
      title: "温馨客厅",
      description: "舒适现代的客厅，阳光明媚",
      prompt: "Cozy modern living room, bright sunlight, comfortable furniture"
    },
    {
      url: "/lovable-uploads/1a903df0-2684-445c-970d-451f4dd16486.jpeg",
      title: "霓虹街景",
      description: "赛博朋克风格的城市街道，霓虹灯光",
      prompt: "Cyberpunk city street, neon lights, futuristic urban landscape"
    },
    {
      url: "/lovable-uploads/2cdac26-7fcb-4be4-80c6-0eb16fd748fb.jpeg",
      title: "橙子静物",
      description: "艺术风格的橙子静物画，鲜艳色彩",
      prompt: "Artistic still life with oranges, vibrant colors, modern painting style"
    },
    {
      url: "/lovable-uploads/3d4bec65-5070-4b7e-a7b8-3793c260ed13.png", // 修正为 .png
      title: "优雅蓝猫",
      description: "优雅室内场景中的蓝色猫咪",
      prompt: "A beautiful blue cat in an elegant interior setting, soft lighting, cozy atmosphere"
    },
    {
      url: "/lovable-uploads/5bdc6013-1fdb-4642-ba6c-3c60332ace8a.jpeg",
      title: "云中鲸鱼",
      description: "梦幻云朵中的巨鲸，金色光芒",
      prompt: "Majestic whale floating in dreamy clouds, golden hour lighting, fantasy atmosphere"
    },
    {
      url: "/lovable-uploads/36cc3148-af93-4f0e-8038-8540420e496b.png", // 修正为 .png
      title: "黄金图腾",
      description: "精美的黄金图腾艺术，复杂图案",
      prompt: "Exquisite golden totem art, intricate patterns, ornate metalwork, ancient symbols"
    },
    {
      url: "/lovable-uploads/49b1d8d8-c189-444b-b2cc-80c73d893b6a.png", // 修正为 .png
      title: "恐龙自拍",
      description: "博物馆中的创意恐龙自拍，趣味艺术",
      prompt: "Creative dinosaur selfie in museum, playful art concept, fun prehistoric scene"
    },
    {
      url: "/lovable-uploads/49ddf65d-4ef4-46a1-94b7-2936d866be27.jpeg",
      title: "霓虹莲花",
      description: "发光的霓虹莲花，神秘氛围",
      prompt: "Glowing neon lotus flower, mystical atmosphere, vibrant colors"
    },
    {
      url: "/lovable-uploads/53e4c463-7e0d-464c-b7a9-10ed60e3d4ed.jpeg",
      title: "慵懒猫咪",
      description: "沙发上慵懒的猫咪，温馨舒适",
      prompt: "Lazy cat lounging on a cozy sofa, warm and comfortable setting"
    },
    {
      url: "/lovable-uploads/67cf3145-f230-4c18-ae01-c7371c39ee85.jpeg",
      title: "神秘占卜",
      description: "星空下的神秘占卜场景，烛光",
      prompt: "Mystical divination scene under starry sky, magical circles, candlelight atmosphere"
    },
    {
      url: "/lovable-uploads/260b8ca9-3f0f-48eb-9be2-d7e4e40a38f7.jpeg",
      title: "月夜森林",
      description: "神秘月光下的魔法森林，幽静深邃",
      prompt: "Mystical forest under moonlight, magical atmosphere, ethereal glow, deep and serene"
    }
  ];

  // 第二行展示图片 - 扩展更多图片
  const showcaseImagesRow2 = [
    {
      url: "/lovable-uploads/422c49d8-b952-4d1b-a8a8-42a64c3fe9cf.png", // 之前已修正
      title: "赛博猫咪",
      description: "赛博朋克风格的猫咪肖像，霓虹光效",
      prompt: "Cyberpunk cat portrait, neon lights, futuristic animal character"
    },
    {
      url: "/lovable-uploads/759c068d-45f9-4e68-8503-839ad9c2186f.jpeg",
      title: "阳光庭院",
      description: "宁静的阳光庭院，野餐桌",
      prompt: "Peaceful sunny garden with picnic tables, warm natural lighting"
    },
    {
      url: "/lovable-uploads/06031b32-4a62-4ac5-8e20-c5c0b5e27e48.png", // 修正为 .png
      title: "霓虹牛头",
      description: "未来主义风格的机械牛头，霓虹灯",
      prompt: "Futuristic mechanical bull head, neon style, cyberpunk creature"
    },
    {
      url: "/lovable-uploads/ad6155cf-9c08-4c17-aa70-ef934a5e15.png", // 修正为 .png
      title: "绚烂花束",
      description: "色彩缤纷的艺术花卉创作，抽象背景",
      prompt: "Vibrant colorful flower bouquet, artistic style, beautiful floral arrangement, abstract background"
    },
    {
      url: "/lovable-uploads/b22c9e81-7fbd-453e-8010-385a7f2ba0ad.jpeg",
      title: "梦幻独角兽",
      description: "粉色独角兽与纸杯蛋糕，梦幻场景",
      prompt: "Dreamy pink unicorn with cupcakes, magical sparkles, pastel colors, cute fantasy scene"
    },
    {
      url: "/lovable-uploads/bad8f970-b81a-4221-a1af-59522bc1c739.jpeg",
      title: "数字莲花",
      description: "科技感十足的数字莲花，二进制图案",
      prompt: "Digital lotus flower with binary code patterns, glowing neon effects"
    },
    {
      url: "/lovable-uploads/c8663201-3d7a-4000-b62c-2fa92a4f4447.png", // 修正为 .png
      title: "象棋与海浪",
      description: "海洋背景下的艺术象棋，戏剧性天空",
      prompt: "Artistic chess set against ocean waves, dramatic sky, surreal composition"
    },
    {
      url: "/lovable-uploads/d728db1d-febd-46e1-975b-e5783c3eabc4.jpeg",
      title: "欧洲小镇",
      description: "温馨浪漫的雨夜欧洲小镇街景",
      prompt: "European town street at night, romantic rainy evening, warm street lights"
    },
    {
      url: "/lovable-uploads/db87a591-cc78-4494-a702-572ebce72f10.png", // 修正为 .png
      title: "静物茶具",
      description: "艺术风格的茶具静物画，月光背景",
      prompt: "Artistic still life with tea set, moonlight background, elegant composition"
    },
    {
      url: "/lovable-uploads/e3cd23d2-0a0e-458e-a5d5-ae60a4def4e5.jpeg",
      title: "茶艺对比",
      description: "茶杯的前后对比艺术，暖色背景",
      prompt: "Tea cup before and after comparison, artistic lighting, warm bokeh background"
    },
    {
      url: "/lovable-uploads/f0a497f8-ba29-43f4-adf0-7cbe79e589a7.jpeg",
      title: "赛博工作站",
      description: "未来科技感的办公环境，霓虹灯",
      prompt: "Cyberpunk futuristic workstation, neon lights, high-tech office environment"
    }
  ];

  // 自动轮播功能 - 两行不同方向轮播
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval1 = setInterval(() => {
      api1?.scrollNext();
    }, 3000);

    const interval2 = setInterval(() => {
      api2?.scrollPrev(); // 第二行向左轮播
    }, 3500); // 稍微不同的间隔，避免同步

    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
    };
  }, [api1, api2, isAutoPlaying]);

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: "提示词已复制",
      description: "已复制到剪贴板，可直接用于AI绘画",
    });
  };

  const downloadImage = (url: string, title: string) => {
    console.log(`尝试下载图片: ${url}`); // 添加日志
    // For local URLs, direct download should work without CORS issues.
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title}.jpeg`; // Assuming JPEG
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "下载成功", description: `${title}.jpeg 已保存` });
      })
      .catch(error => {
        console.error("下载失败:", error);
        toast({ title: "下载失败", description: "无法下载图像，请尝试在新标签页中打开并保存", variant: "destructive" });
        window.open(url, '_blank'); // Fallback to opening in new tab
      });
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-[length:30px_30px] opacity-5 z-0"></div>
      <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-nexus-purple/10 rounded-full blur-[60px] z-0"></div>
      <div className="absolute top-1/4 right-1/4 w-[200px] h-[200px] bg-nexus-blue/10 rounded-full blur-[40px] z-0"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Palette className="h-8 w-8 text-nexus-cyan mr-3" />
            <h2 className="text-3xl md:text-4xl font-bold text-gradient">AI绘画作品展示</h2>
          </div>
          <p className="text-white/70 text-lg mb-8">探索AI创作的无限可能</p>
          
          {/* 轮播控制 */}
          <div className="flex justify-center mb-8">
            <Button
              onClick={toggleAutoPlay}
              className="bg-nexus-cyan/20 border border-nexus-cyan/30 text-nexus-cyan hover:bg-nexus-cyan/30"
            >
              {isAutoPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isAutoPlaying ? '暂停轮播' : '开始轮播'}
            </Button>
          </div>
        </div>

        {/* 第一行轮播 - 向右 */}
        <div className="mb-12">
          <Carousel 
            className="w-full max-w-6xl mx-auto" 
            opts={{ align: "start", loop: true }}
            setApi={setApi1}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {showcaseImages.map((image, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="group relative bg-gradient-to-br from-nexus-dark/80 to-nexus-purple/30 p-4 rounded-xl border border-nexus-blue/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
                    <div className="relative overflow-hidden rounded-lg mb-4">
                      <img
                        src={image.url}
                        alt={image.title}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          console.error(`图片加载失败: ${image.url}`, e);
                          e.currentTarget.src = 'https://via.placeholder.com/1920x1080/0a0f1c/FFFFFF?text=Image+Load+Error'; // 错误时显示占位符
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-nexus-dark/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => downloadImage(image.url, image.title)}
                          className="bg-nexus-blue/80 text-white p-1 h-auto"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                      {/* 移除星星图标 */}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{image.title}</h3>
                    <p className="text-white/70 text-sm">{image.description}</p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 bg-nexus-dark/80 border-nexus-blue/30 text-white hover:bg-nexus-blue/80" />
            <CarouselNext className="right-4 bg-nexus-dark/80 border-nexus-blue/30 text-white hover:bg-nexus-blue/80" />
          </Carousel>
        </div>

        {/* 第二行轮播 - 向左 */}
        <Carousel 
          className="w-full max-w-6xl mx-auto" 
          opts={{ align: "start", loop: true }}
          setApi={setApi2}
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {showcaseImagesRow2.map((image, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="group relative bg-gradient-to-br from-nexus-dark/80 to-nexus-cyan/30 p-4 rounded-xl border border-nexus-cyan/20 backdrop-blur-md hover:scale-105 transition-all duration-300">
                  <div className="relative overflow-hidden rounded-lg mb-4">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        console.error(`图片加载失败: ${image.url}`, e);
                        e.currentTarget.src = 'https://via.placeholder.com/1920x1080/0a0f1c/FFFFFF?text=Image+Load+Error'; // 错误时显示占位符
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-nexus-dark/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => downloadImage(image.url, image.title)}
                        className="bg-nexus-blue/80 text-white p-1 h-auto"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                    {/* 移除星星图标 */}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{image.title}</h3>
                  <p className="text-white/70 text-sm">{image.description}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 bg-nexus-dark/80 border-nexus-cyan/30 text-white hover:bg-nexus-cyan/80" />
          <CarouselNext className="right-4 bg-nexus-dark/80 border-nexus-cyan/30 text-white hover:bg-nexus-cyan/80" />
        </Carousel>
      </div>
    </section>
  );
};

export default ImageShowcase;
