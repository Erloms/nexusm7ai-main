import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Send, Image as ImageIcon, Sparkles, Camera, RotateCcw, Download, Video, ChevronDown, Shuffle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

// New: Prompt Presets by Style
const PROMPT_PRESETS_BY_STYLE: { [key: string]: string[] } = {
  "写实人像": [
    "超写实肖像，一位年轻女性，柔和的自然光，背景虚化，电影感，8K，高细节，逼真皮肤纹理",
    "一位老年男性的特写肖像，饱经风霜的脸，深邃的眼神，黑白摄影，高对比度，电影胶片颗粒感",
    "时尚杂志封面，一位自信的模特，都市背景，动态姿势，专业打光，高分辨率，时尚摄影",
    "一位沉思的艺术家，在工作室中，窗边光线，细节丰富的画笔和画布，温暖的色调，油画质感"
  ],
  "动漫风格": [
    "日系动漫少女，大眼睛，粉色头发，穿着校服，樱花背景，柔和色彩，手绘感，高分辨率",
    "赛博朋克动漫城市夜景，未来战士，霓虹灯，雨中倒影，动态构图，高细节，动画电影截图",
    "Q版卡通动物，一只可爱的小狐狸，森林中玩耍，大头小身，明亮色彩，儿童插画风格",
    "奇幻动漫世界，一位魔法师，漂浮在空中，周围环绕着魔法符文，史诗感，高饱和度，数字绘画"
  ],
  "奇幻艺术": [
    "史诗级奇幻城堡，坐落在云端，巨龙盘旋，魔法光芒，广阔视角，数字绘画，高细节，电影概念艺术",
    "神秘的精灵森林，发光的植物，隐藏的瀑布，迷雾缭绕，柔和的氛围光，油画风格，高细节",
    "一位女巫在月光下施法，古老的符文，漂浮的药水，黑暗奇幻，哥特式风格，高细节，数字艺术",
    "独角兽在彩虹桥上奔跑，背景是星光璀璨的宇宙，梦幻色彩，儿童插画风格，高细节"
  ],
  "科幻风格": [
    "未来都市夜景，飞行汽车，高耸的摩天大楼，霓虹灯招牌，赛博朋克，电影级画面，高细节",
    "宇宙飞船探索未知星系，行星环绕，星云背景，史诗感，数字绘画，高分辨率，科幻概念艺术",
    "机械义肢的女性，在废土世界中，破败的城市遗迹，末日氛围，高细节，写实风格，电影截图",
    "外星生物在异星地貌上，奇特的植物，双月当空，超现实主义，高细节，数字艺术"
  ],
  "油画风格": [
    "梵高风格的星空，旋转的星系，柏树，厚涂笔触，鲜艳色彩，印象派，高细节",
    "伦勃朗风格的肖像，一位老人，深色背景，强烈的光影对比，古典油画，高细节，博物馆品质",
    "莫奈风格的睡莲池，柔和的光线，水面反射，印象派笔触，宁静氛围，高细节",
    "古典静物画，水果和花瓶，桌面构图，柔和的自然光，细节丰富，文艺复兴风格"
  ],
  "水彩画": [
    "城市街景的水彩画，雨后湿润的街道，行人撑伞，柔和的色彩晕染，透明感，手绘感",
    "山水风景水彩画，远山近水，云雾缭绕，淡雅色彩，写意风格，高细节",
    "动物水彩插画，一只可爱的猫头鹰，大眼睛，羽毛细节，明亮色彩，儿童插画风格",
    "花卉水彩画，一束玫瑰花，柔和的粉色和绿色，自然光，高细节，艺术插画"
  ],
  "素描风格": [
    "铅笔素描肖像，一位年轻女性，侧脸，光影分明，线条细腻，高细节，艺术学院风格",
    "炭笔风景素描，古老的树林，远处的山脉，粗犷的笔触，黑白灰层次丰富，高细节",
    "速写人物，咖啡馆里的人们，动态姿势，简洁线条，捕捉瞬间，高细节",
    "建筑素描，一座哥特式教堂，细节丰富的雕塑，透视准确，高细节，艺术作品"
  ],
  "卡通风格": [
    "迪士尼风格的公主，大眼睛，闪亮的长发，森林背景，明亮色彩，可爱，高细节",
    "皮克斯风格的机器人，友好的表情，金属质感，未来城市背景，高细节，3D渲染",
    "卡通动物角色，一只调皮的猴子，香蕉树上，夸张表情，鲜艳色彩，儿童动画风格",
    "超级英雄卡通形象，肌肉发达，飞行姿态，城市背景，动态构图，高细节，美式漫画风格"
  ]
};

// New: Prompt Enhancers for Smart Optimize
const PROMPT_ENHANCERS: { [key: string]: string[] } = {
  "lighting": [
    "cinematic lighting", "volumetric lighting", "golden hour lighting", "soft studio lighting", "dramatic chiaroscuro", "neon glow", "backlight", "rim light"
  ],
  "composition": [
    "wide shot", "close-up", "full body shot", "dynamic pose", "rule of thirds", "leading lines", "symmetrical composition", "asymmetrical balance"
  ],
  "texture": [
    "intricate details", "realistic textures", "smooth surfaces", "rough surfaces", "glossy finish", "matte finish", "delicate details"
  ],
  "mood": [
    "serene atmosphere", "mystical ambiance", "vibrant and energetic", "calm and peaceful", "dark and moody", "joyful and playful", "ethereal mood"
  ],
  "style_modifiers": [
    "masterpiece", "best quality", "ultra realistic", "8k", "4k", "HD", "photorealistic", "digital painting", "concept art", "illustration", "anime style", "oil painting", "watercolor", "sketch", "cartoon"
  ]
};

// Helper function to check if prompt contains keywords from a category
const containsKeywords = (prompt: string, keywords: string[]): boolean => {
  const lowerPrompt = prompt.toLowerCase();
  return keywords.some(keyword => lowerPrompt.includes(keyword.toLowerCase()));
};

const ImagePage = () => {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
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
    let optimized = inputPrompt.trim();

    // Ensure basic quality enhancers are present if not already
    const basicQuality = ["masterpiece", "best quality", "ultra realistic", "8k", "4k", "HD"];
    if (!containsKeywords(optimized, basicQuality)) {
      optimized += ", masterpiece, best quality, ultra realistic, 8k";
    }

    // Add details from different categories if not already present
    for (const category in PROMPT_ENHANCERS) {
      const enhancers = PROMPT_ENHANCERS[category];
      if (!containsKeywords(optimized, enhancers)) {
        const randomEnhancer = enhancers[Math.floor(Math.random() * enhancers.length)];
        optimized += `, ${randomEnhancer}`;
      }
    }

    // Add artist reference sometimes
    const artists = ['by Greg Rutkowski', 'by Artgerm', 'by Alphonse Mucha', 'by Moebius', 'by Zdzisław Beksiński', 'by Studio Ghibli'];
    if (Math.random() > 0.6) { // 40% chance to add an artist
      const randomArtist = artists[Math.floor(Math.random() * artists.length)];
      if (!optimized.toLowerCase().includes(randomArtist.toLowerCase())) {
        optimized += `, ${randomArtist}`;
      }
    }

    // Ensure it ends without a period
    if (optimized.endsWith('.')) {
      optimized = optimized.slice(0, -1);
    }

    // Trim and limit length
    optimized = optimized.trim();
    if (optimized.length > 500) { // A more generous limit for detailed prompts
      optimized = optimized.substring(0, 500).trim();
      const lastComma = optimized.lastIndexOf(',');
      if (lastComma > optimized.length - 50) { // If comma is near the end, cut there
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
  const handlePromptPreset = (presetStyle: string) => {
    const promptsForStyle = PROMPT_PRESETS_BY_STYLE[presetStyle];
    if (promptsForStyle && promptsForStyle.length > 0) {
      const randomIndex = Math.floor(Math.random() * promptsForStyle.length);
      setPrompt(promptsForStyle[randomIndex]);
      toast({
        title: "提示词已更新",
        description: `已为您加载一个随机的"${presetStyle}"风格提示词`,
      });
    } else {
      toast({
        title: "无可用提示词",
        description: `"${presetStyle}"风格暂无预设提示词`,
        variant: "destructive"
      });
    }
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
      setIsLoadingVideo(false);
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