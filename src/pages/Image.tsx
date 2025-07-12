import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Send, Image as ImageIcon, Sparkles, Camera, RotateCcw, Download, Video, ChevronDown, Shuffle } from 'lucide-react'; // Added Shuffle here
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Assuming Popover component exists

// --- Interfaces ---
interface GeneratedImage {
  id: string;
  prompt: string;
  negativePrompt?: string;
  imageUrl: string;
  timestamp: Date;
  model?: string;
  aspectRatio?: string;
  seed?: number;
}

interface GeneratedVideo {
  id: string;
  prompt?: string;
  imageUrl?: string;
  videoUrl?: string;
  coverImageUrl?: string;
  timestamp: Date;
  model?: string;
  status: 'PROCESSING' | 'SUCCESS' | 'FAIL';
  taskId?: string; // For polling CogVideoX
}

interface AIModel {
  id: string;
  name: string;
  group?: string;
}

// --- AI Models ---
const IMAGE_MODELS: AIModel[] = [
  { id: "flux", name: "通用创意 - Flux" },
  { id: "flux-pro", name: "专业版 - Flux-Pro" },
  { id: "flux-realism", name: "超真实效果 - Flux-Realism" },
  { id: "flux-anime", name: "动漫风格 - Flux-Anime" },
  { id: "flux-3d", name: "三维效果 - Flux-3D" },
  { id: "flux-cablyai", name: "创意艺术 - Flux-Cablyai" },
  { id: "turbo", name: "极速生成 - Turbo" }
];

const VIDEO_EFFECTS = [
  { id: "sketch-to-color", name: "素描变彩色" },
  // Add more video effects if CogVideoX supports them via specific prompts or parameters
];

// --- CogVideoX API Configuration ---
const COGVIDEOX_API_KEY = "924d10ce4718479a9a089ffdc62aafff.d69Or12B5PEdYUco"; // WARNING: Hardcoded API Key is insecure for production
const COGVIDEOX_GENERATE_URL = "https://open.bigmodel.cn/api/paas/v4/videos/generations";
const COGVIDEOX_QUERY_URL = "https://open.bigmodel.cn/api/paas/v4/async-result";

// --- Prompt Library (Translated/Adapted from user examples) ---
const PROMPT_LIBRARY: string[] = [
  "Lone astronaut Alex, walking on Mars, red desert landscape, determined expression, wide shot, photorealistic",
  "Leonardo da Vinci style portrait, female, bust, landscape background, chiaroscuro, fine brushstrokes, soft colors",
  "Van Gogh style still life, sunflowers, dominant yellow color, rough brushstrokes, strong colors, full of life",
  "Monet style landscape, seaside, sunrise, light and shadow effects, impressionistic brushstrokes, fresh and bright",
  "Yosemite National Park, California, USA, 4k digital photo, sunrise over mountains, serene nature, towering redwood trees, waterfall, mirror-like lake, granite cliffs, misty valley, breathtaking view, golden hour lighting, vibrant autumn colors, iconic landmarks, tranquil wilderness",
  "Highly detailed ancient Chinese man, long black hair, Hanfu, looking at viewer, ink wash painting style, beautiful cold eyes",
  "Jiangnan ancient town by a river, starry dark night sky, sparkling lights on ground and hanging lanterns on stone bridge, lights reflecting in the river like a galaxy",
  "Game character, male, black and green style, knight, fluid brushstrokes, Zen inspired, detailed clothing, katana and kimono",
  "Detailed portrait of a woman, soft lighting, studio background, elegant pose, high resolution",
  "Cyberpunk city street at night, neon lights, rain, reflections, futuristic vehicles, cinematic view",
  "Fantasy forest, glowing mushrooms, ancient trees, mystical creatures, volumetric lighting, digital art",
  "Underwater scene, coral reef, colorful fish, sunlight rays, clear water, macro photography"
];

const ImagePage = () => {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth(); // Assuming user is available for history
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('pixelated, poor lighting, overexposed, underexposed, chinese text, asian text, chinese characters, cropped, duplicated, ugly, extra fingers, bad hands, missing fingers, mutated hands'); // Default negative prompt
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].id);
  const [selectedVideoEffect, setSelectedVideoEffect] = useState(VIDEO_EFFECTS[0].id);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [seed, setSeed] = useState<number | undefined>(884929); // Default seed from screenshot
  const [activeTab, setActiveTab] = useState('result'); // 'result' or 'history'

  const imageDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the generated image/video when it appears
    if ((generatedImage || generatedVideo) && imageDisplayRef.current) {
      imageDisplayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedImage, generatedVideo]);

  // --- Helper to calculate dimensions based on aspect ratio ---
  const calculateDimensions = (ratio: string, baseSize = 1024) => {
    const [widthStr, heightStr] = ratio.split(':');
    const ratioWidth = parseInt(widthStr, 10);
    const ratioHeight = parseInt(heightStr, 10);

    if (isNaN(ratioWidth) || isNaN(ratioHeight) || ratioHeight === 0) {
      console.warn('Invalid aspect ratio provided, falling back to 1:1');
      return { width: 1024, height: 1024 }; // Fallback to 1:1
    }

    let width = baseSize;
    let height = baseSize;

    if (ratioWidth > ratioHeight) {
      width = baseSize;
      height = Math.round((baseSize / ratioWidth) * ratioHeight);
    } else if (ratioHeight > ratioWidth) {
      height = baseSize;
      width = Math.round((baseSize / ratioHeight) * ratioWidth);
    } else {
      width = height = baseSize; // 1:1
    }

    // Ensure dimensions are multiples of 64 (common requirement for models)
    width = Math.round(width / 64) * 64;
    height = Math.round(height / 64) * 64;

    // Cap max dimensions if needed (Pollinations.ai might have limits)
    width = Math.min(width, 2048);
    height = Math.min(height, 2048);

    console.log(`Calculated dimensions for ratio ${ratio}: ${width}x${height}`);
    return { width, height };
  };

  // --- Prompt Optimization Logic (Heuristic based on persona) ---
  const optimizePrompt = (inputPrompt: string): string => {
    if (!inputPrompt.trim()) {
      return getRandomPrompt(); // If empty, just give a random one
    }

    let optimized = inputPrompt.trim();

    // Simple heuristic: add quality enhancers if not already present
    const qualityEnhancers = ['highly detailed', 'masterpiece', 'best quality', 'ultra realistic', '8k', '4k', 'HD'];
    const styleEnhancers = ['cinematic lighting', 'volumetric lighting', 'dynamic pose', 'expressive eyes', 'intricate background'];

    let needsQuality = true;
    for (const enhancer of qualityEnhancers) {
      if (optimized.toLowerCase().includes(enhancer)) {
        needsQuality = false;
        break;
      }
    }
    if (needsQuality) {
      optimized += ", masterpiece, best quality, highly detailed";
    }

    // Add some random style enhancers
    if (Math.random() > 0.5) { // Add style enhancers randomly
        const randomStyleEnhancer = styleEnhancers[Math.floor(Math.random() * styleEnhancers.length)];
         if (!optimized.toLowerCase().includes(randomStyleEnhancer)) {
             optimized += `, ${randomStyleEnhancer}`;
         }
    }


    // Add artist reference sometimes (as per persona)
    const artists = ['Greg Rutkowski', 'Artgerm', 'Alphonse Mucha', 'Moebius'];
    if (Math.random() > 0.7) { // 30% chance to add an artist
        const randomArtist = artists[Math.floor(Math.random() * artists.length)];
         if (!optimized.toLowerCase().includes(randomArtist.toLowerCase())) {
             optimized += `, by ${randomArtist}`;
         }
    }

    // Ensure it ends without a period (as per persona example)
    if (optimized.endsWith('.')) {
        optimized = optimized.slice(0, -1);
    }

    // Keep it within a reasonable length, though Pollinations.ai is generous
    // Let's aim for under 300 characters for a good balance
    if (optimized.length > 300) {
        optimized = optimized.substring(0, 300).trim();
        // Ensure it doesn't end mid-word or mid-phrase
        const lastComma = optimized.lastIndexOf(',');
        if (lastComma > optimized.length - 20) { // If comma is near the end
             optimized = optimized.substring(0, lastComma);
        } else { // Otherwise, find the last space
             const lastSpace = optimized.lastIndexOf(' ');
             if (lastSpace !== -1) {
                 optimized = optimized.substring(0, lastSpace);
             }
        }
         optimized = optimized.trim();
    }

    console.log('Optimized Prompt:', optimized);
    return optimized;
  };

  // --- Get Random Prompt ---
  const getRandomPrompt = (): string => {
    const randomIndex = Math.floor(Math.random() * PROMPT_LIBRARY.length);
    console.log('Selected Random Prompt:', PROMPT_LIBRARY[randomIndex]);
    return PROMPT_LIBRARY[randomIndex];
  };

  // --- Handle Prompt Preset Buttons ---
  const handlePromptPreset = (preset: string) => {
    // Append preset to current prompt, add comma if prompt is not empty
    setPrompt(prev => prev.trim() ? `${prev.trim()}, ${preset}` : preset);
    console.log('Prompt preset added:', preset);
  };

  // --- Handle Smart Optimize ---
  const handleSmartOptimize = () => {
    const optimized = optimizePrompt(prompt);
    setPrompt(optimized);
    toast({
      title: "提示词已优化",
      description: "已根据您的输入生成更详细的提示词",
    });
  };

  // --- Handle Insert Random Prompt ---
  const handleInsertRandomPrompt = () => {
    const randomPrompt = getRandomPrompt();
    setPrompt(randomPrompt);
    toast({
      title: "已插入随机提示词",
      description: "您可以基于此进行修改",
    });
  };


  // --- Image Generation Logic (Pollinations.ai) ---
  const generateImage = async () => {
    console.log('Attempting to generate image...');
    if (!hasPermission('image')) {
      toast({
        title: "需要会员权限",
        description: "请升级会员以使用AI绘画功能",
        variant: "destructive"
      });
      console.warn('Image generation blocked: No permission.');
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "提示词不能为空",
        description: "请输入有效的绘画提示词",
        variant: "destructive"
      });
      console.warn('Image generation blocked: Prompt is empty.');
      return;
    }

    setIsLoadingImage(true);
    setGeneratedImage(null); // Clear previous image while loading
    setGeneratedVideo(null); // Clear previous video

    try {
      const finalPrompt = prompt.trim();
      console.log('Final Prompt for image generation:', finalPrompt);

      const encodedPrompt = encodeURIComponent(finalPrompt);
      const encodedNegativePrompt = negativePrompt.trim() ? `&negative_prompt=${encodeURIComponent(negativePrompt)}` : '';
      const seedParam = seed !== undefined ? `&seed=${seed}` : '';
      const { width, height } = calculateDimensions(aspectRatio);

      // Construct the API URL with all parameters
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${selectedModel}&nologo=true&width=${width}&height=${height}${encodedNegativePrompt}${seedParam}`;
      console.log('Pollinations.ai Image URL:', imageUrl);

      // Pollinations.ai directly returns the image, no need for fetch here, just set the URL
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        prompt: finalPrompt,
        negativePrompt: negativePrompt,
        imageUrl: imageUrl,
        timestamp: new Date(),
        model: selectedModel,
        aspectRatio: aspectRatio,
        seed: seed
      };

      setGeneratedImage(newImage);
      setActiveTab('result'); // Switch to result tab
      console.log('Image generation successful, image URL set.');

      toast({
        title: "图像生成成功",
        description: "您的图像已创建",
      });
    } catch (error) {
      console.error('图像生成失败:', error);
      toast({
        title: "图像生成失败",
        description: "请检查您的提示词或稍后再试",
        variant: "destructive"
      });
    } finally {
      setIsLoadingImage(false);
      console.log('Image generation process finished.');
    }
  };

  // --- Video Generation Logic (CogVideoX) ---
  const generateVideo = async () => {
     console.log('Attempting to generate video...');
     if (!hasPermission('video')) { // Assuming a 'video' permission exists
      toast({
        title: "需要会员权限",
        description: "请升级会员以使用AI视频功能",
        variant: "destructive"
      });
      console.warn('Video generation blocked: No permission.');
      return;
    }

    // Determine if text-to-video or image-to-video
    const isImageToVideo = generatedImage !== null;
    const videoPrompt = prompt.trim();

    if (!isImageToVideo && !videoPrompt) {
       toast({
        title: "提示词或图像不能为空",
        description: "请输入视频提示词或先生成图像",
        variant: "destructive"
      });
      console.warn('Video generation blocked: Prompt and no image.');
      return;
    }

    setIsLoadingVideo(true);
    setGeneratedVideo(null); // Clear previous video
    // setGeneratedImage(null); // Keep image if doing image-to-video

    try {
      const requestBody: any = {
        model: "cogvideox-flash", // As specified in API docs
        quality: "speed", // Default to speed as quality/size/fps not supported by flash
        with_audio: false, // Default to false
        request_id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique request ID
        user_id: user?.id || 'anonymous', // Use user ID if available
      };

      if (isImageToVideo && generatedImage?.imageUrl) {
        requestBody.image_url = generatedImage.imageUrl;
        requestBody.prompt = videoPrompt || "让画面动起来"; // Optional prompt for image-to-video
        console.log('Video generation: Image-to-video mode. Source image URL:', generatedImage.imageUrl);
      } else {
        requestBody.prompt = videoPrompt;
        console.log('Video generation: Text-to-video mode. Prompt:', videoPrompt);
      }

      console.log('CogVideoX Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(COGVIDEOX_GENERATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${COGVIDEOX_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('CogVideoX 生成请求失败:', response.status, errorData);
        throw new Error(`CogVideoX API Error: ${response.status} - ${errorData.msg || response.statusText}`);
      }

      const responseData = await response.json();
      const taskId = responseData.id;
      console.log('CogVideoX Task Submitted. Task ID:', taskId, 'Response:', responseData);

      const newVideo: GeneratedVideo = {
        id: Date.now().toString(),
        prompt: videoPrompt,
        imageUrl: generatedImage?.imageUrl, // Store source image if any
        timestamp: new Date(),
        model: "cogvideox-flash",
        status: 'PROCESSING',
        taskId: taskId,
      };
      setGeneratedVideo(newVideo);
      setActiveTab('result'); // Switch to result tab

      toast({
        title: "视频生成任务已提交",
        description: "正在生成视频，请稍候...",
      });

      // Start polling for results
      pollVideoResult(taskId);

    } catch (error: any) {
      console.error('视频生成失败:', error);
      setGeneratedVideo(prev => prev ? {...prev, status: 'FAIL'} : null);
      toast({
        title: "视频生成失败",
        description: error.message || "请检查您的提示词或稍后再试",
        variant: "destructive"
      });
      setIsLoadingVideo(false);
    }
  };

  // --- Poll CogVideoX Result ---
  const pollVideoResult = async (taskId: string) => {
    console.log('Starting to poll for video result. Task ID:', taskId);
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${COGVIDEOX_QUERY_URL}/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${COGVIDEOX_API_KEY}`,
          },
        });

        if (!response.ok) {
           const errorData = await response.json();
           console.error('CogVideoX 查询请求失败:', response.status, errorData);
           clearInterval(interval);
           setGeneratedVideo(prev => prev ? {...prev, status: 'FAIL'} : null);
           setIsLoadingVideo(false);
           toast({
              title: "视频查询失败",
              description: errorData.msg || "无法获取视频生成结果",
              variant: "destructive"
           });
           return;
        }

        const resultData = await response.json();
        console.log('Polling result for Task ID:', taskId, 'Status:', resultData.task_status, 'Data:', resultData);

        if (resultData.task_status === 'SUCCESS') {
          clearInterval(interval);
          setGeneratedVideo(prev => prev ? {
            ...prev,
            status: 'SUCCESS',
            videoUrl: resultData.video_result?.[0]?.url,
            coverImageUrl: resultData.video_result?.[0]?.cover_image_url,
          } : null);
          setIsLoadingVideo(false);
          toast({
            title: "视频生成成功",
            description: "您的视频已创建",
          });
          console.log('Video generation SUCCESS. Video URL:', resultData.video_result?.[0]?.url);
        } else if (resultData.task_status === 'FAIL') {
          clearInterval(interval);
          setGeneratedVideo(prev => prev ? {...prev, status: 'FAIL'} : null);
          setIsLoadingVideo(false);
          toast({
            title: "视频生成失败",
            description: "视频生成任务失败",
            variant: "destructive"
          });
          console.error('Video generation FAILED for Task ID:', taskId);
        }
        // If status is PROCESSING, continue polling
      } catch (error) {
        console.error('视频查询错误:', error);
        clearInterval(interval);
        setGeneratedVideo(prev => prev ? {...prev, status: 'FAIL'} : null);
        setIsLoadingVideo(false);
        toast({
          title: "视频查询错误",
          description: "获取视频结果时发生错误",
          variant: "destructive"
        });
      }
    }, 5000); // Poll every 5 seconds
  };

  // --- Handle Aspect Ratio Change ---
  const handleAspectRatioChange = (ratio: string) => {
    setAspectRatio(ratio);
    console.log('Aspect ratio changed to:', ratio);
  };

  // --- Handle Seed Shuffle ---
  const shuffleSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000); // Generate a new random seed
    setSeed(newSeed);
    console.log('Seed shuffled to:', newSeed);
  };

  // --- Handle Download Image ---
  const downloadImage = (url: string, filename: string) => {
    console.log('Attempting to download image:', url);
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "下载成功", description: `${filename}.png 已保存` });
        console.log('Image downloaded successfully.');
      })
      .catch(error => {
        console.error("下载失败:", error);
        toast({ title: "下载失败", description: "无法下载图像", variant: "destructive" });
      });
  };

   // --- Handle Download Video ---
   const downloadVideo = (url: string, filename: string) => {
     console.log('Attempting to download video:', url);
     const link = document.createElement('a');
     link.href = url;
     link.download = `${filename}.mp4`; // Assuming mp4 format
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     toast({ title: "下载成功", description: `${filename}.mp4 已保存` });
     console.log('Video downloaded successfully.');
   };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Decide whether to generate image or video based on context?
      // For now, Enter triggers image generation as it's the primary input.
      generateImage();
    }
  };

  const { width: currentWidth, height: currentHeight } = calculateDimensions(aspectRatio);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#1a1f2e] to-[#0f1419] flex">
      <Navigation />

      <div className="flex w-full pt-16">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Membership Banner */}
          {!hasPermission('image') && !hasPermission('video') && ( // Check both permissions
            <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-b border-yellow-500/30 p-4">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center">
                  <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-yellow-100">开通会员即可享受AI绘画和视频功能</span>
                </div>
                <Link to="/payment">
                  <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-2 rounded-full font-medium">
                    立即开通
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Page Title */}
          <div className="w-full text-center py-8">
             <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-lg tracking-tight">
                AI绘画生成器
              </h1>
              <p className="text-center text-gray-400 mt-2 text-lg">智能AI驱动的视觉增强创作平台</p>
          </div>


          {/* Image/Video Generation Area */}
          <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 max-w-7xl mx-auto w-full">
            {/* Left Side - Inputs */}
            <div className="lg:w-1/3 w-full flex flex-col space-y-6 bg-[#1a2740] border border-[#203042]/50 rounded-xl p-6 shadow-lg">
              {/* Prompt */}
              <div>
                <label htmlFor="prompt" className="text-gray-400 text-sm font-medium mb-2 flex items-center">
                  提示词 (Prompt) <Sparkles className="w-4 h-4 text-cyan-400 ml-1" />
                </label>
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">大师提示词</span>
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleInsertRandomPrompt}
                        className="text-gray-400 hover:text-cyan-400 hover:bg-transparent p-0 h-auto"
                      >
                        随机一个 <Shuffle className="w-3 h-3 ml-1" />
                      </Button>
                 </div>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="描述您想要生成的图像..."
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 resize-none focus:border-cyan-400 focus:ring-cyan-400/20 min-h-[100px]"
                  rows={4}
                  maxLength={2000}
                />
                 <div className="text-right text-xs text-gray-500 mt-1">{prompt.length}/2000 字符</div>
                <div className="mt-3 flex flex-wrap gap-2">
                   <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSmartOptimize}
                      className="border-gray-600 text-gray-300 hover:bg-cyan-400/20 hover:border-cyan-400 flex items-center"
                    >
                      <Sparkles className="w-4 h-4 mr-1" /> 智能优化
                    </Button>
                  {['写实人像', '动漫风格', '奇幻艺术', '科幻风格', '油画风格', '水彩画', '素描风格', '卡通风格'].map(preset => (
                    <Button
                      key={preset}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePromptPreset(preset)}
                      className="border-gray-600 text-gray-300 hover:bg-cyan-400/20 hover:border-cyan-400"
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Negative Prompt */}
              <div>
                <label htmlFor="negativePrompt" className="text-gray-400 text-sm font-medium mb-2 block">
                  负面提示词 (Negative Prompt)
                </label>
                <Textarea
                  id="negativePrompt"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="输入您不希望出现在图像中的元素..."
                  className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 resize-none focus:border-cyan-400 focus:ring-cyan-400/20 min-h-[80px]"
                  rows={3}
                  maxLength={1000}
                />
                 <div className="text-right text-xs text-gray-500 mt-1">{negativePrompt.length}/1000 字符</div>
              </div>

              {/* Model Selection */}
              <div>
                <label htmlFor="model" className="text-gray-400 text-sm font-medium mb-2 block">
                  模型选择
                </label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full bg-[#151b2a] border border-[#23304d] text-gray-200 shadow focus:ring-cyan-400/20">
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151b2a] border border-[#23304d] text-gray-200">
                    {IMAGE_MODELS.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Video Magic Effect */}
              <div>
                <label htmlFor="videoEffect" className="text-gray-400 text-sm font-medium mb-2 flex items-center">
                  <Video className="w-4 h-4 mr-1 text-purple-400" /> 视频魔法效果
                </label>
                 <div className="flex gap-2">
                    <Select value={selectedVideoEffect} onValueChange={setSelectedVideoEffect}>
                      <SelectTrigger className="flex-1 bg-[#151b2a] border border-[#23304d] text-gray-200 shadow focus:ring-purple-400/20">
                        <SelectValue placeholder="选择效果" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#151b2a] border border-[#23304d] text-gray-200">
                        {VIDEO_EFFECTS.map(effect => (
                          <SelectItem key={effect.id} value={effect.id}>
                            {effect.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                     <Button
                        onClick={generateVideo}
                        disabled={isLoadingVideo || (!prompt.trim() && !generatedImage)}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg px-4 py-2 font-medium shadow-lg"
                      >
                        {isLoadingVideo ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                      </Button>
                 </div>
                 <div className="text-xs text-gray-500 mt-1">素描稿用刷子刷过变成彩色画</div> {/* Example description */}
              </div>


              {/* Aspect Ratio Selection */}
              <div>
                <label htmlFor="aspectRatio" className="text-gray-400 text-sm font-medium mb-2 block">
                  长宽比设置
                </label>
                <div className="flex flex-wrap gap-2">
                  {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                    <Button
                      key={ratio}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAspectRatioChange(ratio)}
                      className={`border-gray-600 text-gray-300 hover:bg-cyan-400/20 hover:border-cyan-400 ${
                        aspectRatio === ratio ? 'bg-cyan-400/20 border-cyan-400' : ''
                      }`}
                    >
                      {ratio}
                    </Button>
                  ))}
                </div>
                 <div className="text-xs text-gray-500 mt-2">当前尺寸: {currentWidth} × {currentHeight}</div>
              </div>

              {/* Seed Input */}
              <div>
                <label htmlFor="seed" className="text-gray-400 text-sm font-medium mb-2 block">
                  种子值 (Seed)
                </label>
                <div className="flex gap-2">
                  <Input
                    id="seed"
                    type="number"
                    value={seed === undefined ? '' : seed}
                    onChange={(e) => setSeed(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    placeholder="可选，留空随机"
                    className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                  />
                   <Button
                      onClick={shuffleSeed}
                      variant="outline"
                      size="icon"
                      className="border-gray-600 text-gray-400 hover:bg-cyan-400/20 hover:border-cyan-400"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
                 <div className="text-xs text-gray-500 mt-1">相同提示词和种子值会生成相似图像</div>
              </div>

              {/* Generate Image Button */}
              <div className="flex justify-center mt-auto pt-4"> {/* Use mt-auto to push to bottom */}
                <Button
                  onClick={generateImage}
                  disabled={!prompt.trim() || isLoadingImage}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-12 py-3 rounded-xl font-medium text-lg shadow-lg w-full"
                >
                  {isLoadingImage ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ImageIcon className="mr-2 w-5 h-5" />
                  )}
                  生成图像
                </Button>
              </div>
            </div>

            {/* Right Side - Result Display */}
            <div className="lg:w-2/3 w-full flex flex-col bg-[#1a2740] border border-[#203042]/50 rounded-xl p-6 shadow-lg min-h-[400px]">

               <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-[#2a3750]">
                     <TabsTrigger value="result" className="data-[state=active]:bg-cyan-600/30 data-[state=active]:text-cyan-200">生成结果</TabsTrigger>
                     <TabsTrigger value="history" className="data-[state=active]:bg-cyan-600/30 data-[state=active]:text-cyan-200">历史记录</TabsTrigger>
                  </TabsList>
                  <TabsContent value="result" className="mt-6">
                     <div ref={imageDisplayRef} className="w-full h-full flex items-center justify-center min-h-[300px]">
                        {isLoadingImage || isLoadingVideo ? (
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-gray-400">{isLoadingImage ? '正在生成图像...' : '正在生成视频...'}</p>
                             {isLoadingVideo && generatedVideo?.taskId && (
                                <p className="text-gray-500 text-sm mt-2">任务ID: {generatedVideo.taskId}</p>
                             )}
                          </div>
                        ) : generatedVideo ? (
                           <div className="flex flex-col items-center w-full h-full">
                              {generatedVideo.status === 'SUCCESS' && generatedVideo.videoUrl ? (
                                 <>
                                    <video controls src={generatedVideo.videoUrl!} className="max-w-full max-h-[600px] object-contain rounded-lg shadow-xl mb-4"></video>
                                     <p className="text-gray-300 text-sm mb-4 text-center line-clamp-3">{generatedVideo.prompt || '生成的视频'}</p>
                                     <div className="flex gap-4">
                                        <Button
                                             variant="outline"
                                             onClick={() => downloadVideo(generatedVideo.videoUrl!, `ai_video_${generatedVideo.id}`)}
                                             className="border-gray-600 text-gray-400 hover:bg-purple-400/20 hover:border-purple-400"
                                           >
                                             <Download className="w-4 h-4 mr-1" /> 下载视频
                                           </Button>
                                     </div>
                                 </>
                              ) : generatedVideo.status === 'FAIL' ? (
                                 <div className="text-center text-red-500">
                                    <Video className="w-16 h-16 mx-auto mb-4" />
                                    <p>视频生成失败</p>
                                     {generatedVideo.taskId && <p className="text-sm text-gray-500">任务ID: {generatedVideo.taskId}</p>}
                                 </div>
                              ) : ( // PROCESSING state handled by isLoadingVideo
                                 <div className="text-center text-gray-500">
                                    <Video className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                    <p>视频生成任务已提交，等待结果...</p>
                                     {generatedVideo?.taskId && <p className="text-sm text-gray-500">任务ID: {generatedVideo.taskId}</p>}
                                 </div>
                              )}
                           </div>
                        ) : generatedImage ? (
                          <div className="flex flex-col items-center w-full h-full">
                            <img
                              src={generatedImage.imageUrl}
                              alt="Generated image"
                              className="max-w-full max-h-[600px] object-contain rounded-lg shadow-xl mb-4"
                            />
                            <p className="text-gray-300 text-sm mb-4 text-center line-clamp-3">{generatedImage.prompt}</p>
                             {generatedImage.negativePrompt && (
                                 <p className="text-gray-500 text-xs mb-4 text-center line-clamp-2">负面提示词: {generatedImage.negativePrompt}</p>
                             )}
                            <div className="flex gap-4">
                               <Button
                                    variant="outline"
                                    onClick={() => downloadImage(generatedImage.imageUrl, `ai_image_${generatedImage.id}`)}
                                    className="border-gray-600 text-gray-400 hover:bg-cyan-400/20 hover:border-cyan-400"
                                  >
                                    <Download className="w-4 h-4 mr-1" /> 下载图像
                                  </Button>
                                   {/* Optional: Regenerate button */}
                                   <Button
                                    variant="outline"
                                    onClick={generateImage} // Regenerate with current settings
                                    className="border-gray-600 text-gray-400 hover:bg-cyan-400/20 hover:border-cyan-400"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-1" /> 重新生成
                                  </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500">
                            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                            <p>生成的图像或视频将在这里显示</p>
                          </div>
                        )}
                      </div>
                  </TabsContent>
                  <TabsContent value="history" className="mt-6">
                     {/* History content goes here */}
                     <div className="text-center text-gray-500 py-10">
                        <p>历史记录功能待开发...</p>
                     </div>
                  </TabsContent>
               </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePage;
