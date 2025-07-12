import React, { useState, useRef, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Volume2, 
  Download, 
  CheckCircle2,
  ArrowLeft,
  Lightbulb, // For intelligent interpretation
  MessageSquare // For text generation
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link } from 'react-router-dom';
import { Switch } from "@/components/ui/switch"; // Import Switch component

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  color: string;
  provider: 'pollinations' | 'mmp'; // Add provider type
  mmpModelId?: number; // Optional model ID for mmp.cc
}

interface HistoryItem {
  id: number;
  timestamp: Date;
  voice: string;
  text: string;
  audioUrl?: string;
  isInterpretation?: boolean; // New field for history
}

const Voice = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, checkPaymentStatus } = useAuth();
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isInterpretationMode, setIsInterpretationMode] = useState(false); // New state for interpretation mode
  const audioRef = useRef<HTMLAudioElement>(null);

  // Voice options - updated to 19 options with English names
  const voiceOptions: VoiceOption[] = [
    // Pollinations.ai voices
    { id: 'alloy', name: 'Alloy', description: 'Balanced', color: '#8B5CF6', provider: 'pollinations' },
    { id: 'echo', name: 'Echo', description: 'Deep', color: '#6366F1', provider: 'pollinations' },
    { id: 'fable', name: 'Fable', description: 'Warm', color: '#8B5CF6', provider: 'pollinations' },
    { id: 'onyx', name: 'Onyx', description: 'Authoritative', color: '#333333', provider: 'pollinations' },
    { id: 'nova', name: 'Nova', description: 'Friendly', color: '#10B981', provider: 'pollinations' },
    { id: 'shimmer', name: 'Shimmer', description: 'Bright', color: '#60A5FA', provider: 'pollinations' },
    { id: 'coral', name: 'Coral', description: 'Gentle', color: '#F87171', provider: 'pollinations' },
    { id: 'verse', name: 'Verse', description: 'Poetic', color: '#FBBF24', provider: 'pollinations' },
    { id: 'ballad', name: 'Ballad', description: 'Lyrical', color: '#A78BFA', provider: 'pollinations' },
    { id: 'ash', name: 'Ash', description: 'Thoughtful', color: '#4B5563', provider: 'pollinations' },
    { id: 'sage', name: 'Sage', description: 'Wise', color: '#059669', provider: 'pollinations' },
    { id: 'brook', name: 'Brook', description: 'Smooth', color: '#3B82F6', provider: 'pollinations' },
    { id: 'clover', name: 'Clover', description: 'Lively', color: '#EC4899', provider: 'pollinations' },
    { id: 'dan', name: 'Dan', description: 'Steady Male', color: '#1F2937', provider: 'pollinations' },
    { id: 'elan', name: 'Elan', description: 'Elegant', color: '#7C3AED', provider: 'pollinations' },
    { id: 'amuch', name: 'Amuch', description: 'Unique Tone', color: '#FF5733', provider: 'pollinations' },
    { id: 'aster', name: 'Aster', description: 'Fresh & Natural', color: '#33FF57', provider: 'pollinations' },
    { id: 'marilyn', name: 'Marilyn', description: 'Classic Female', color: '#FF33A1', provider: 'pollinations' },
    { id: 'meadow', name: 'Meadow', description: 'Calm & Soft', color: '#33A1FF', provider: 'pollinations' },
    // New mmp.cc voices (translated/transliterated names)
    { id: 'guodegang', name: 'Guo Degang', description: 'Comedian', color: '#FFD700', provider: 'mmp', mmpModelId: 10 },
    { id: 'furina', name: 'Furina', description: 'Anime Character', color: '#8A2BE2', provider: 'mmp', mmpModelId: 9 },
    { id: 'cctv_announcer', name: 'CCTV Announcer', description: 'Formal', color: '#008080', provider: 'mmp', mmpModelId: 8 },
    { id: 'gem', name: 'G.E.M.', description: 'Pop Singer', color: '#FF69B4', provider: 'mmp', mmpModelId: 7 },
    { id: 'black_hand', name: 'Black Hand', description: 'Mysterious', color: '#4B0082', provider: 'mmp', mmpModelId: 6 },
    { id: 'caixukun', name: 'Cai Xukun', description: 'Pop Idol', color: '#FF1493', provider: 'mmp', mmpModelId: 5 },
    { id: 'ad_senior_sister', name: 'AD Senior Sister', description: 'Youthful', color: '#00BFFF', provider: 'mmp', mmpModelId: 4 },
    { id: 'leijun', name: 'Lei Jun', description: 'Entrepreneur', color: '#FF4500', provider: 'mmp', mmpModelId: 3 },
    { id: 'uma_musume', name: 'Uma Musume', description: 'Anime Horse Girl', color: '#DA70D6', provider: 'mmp', mmpModelId: 2 },
    { id: 'unknown_model', name: 'Unknown Model', description: 'Generic', color: '#A9A9A9', provider: 'mmp', mmpModelId: 1 },
    { id: 'monkey', name: 'Monkey', description: 'Playful', color: '#B8860B', provider: 'mmp', mmpModelId: 11 },
    { id: 'squeaky_voice', name: 'Squeaky Voice', description: 'High-pitched', color: '#FFC0CB', provider: 'mmp', mmpModelId: 12 },
    { id: 'lazy_goat', name: 'Lazy Goat', description: 'Cartoon Character', color: '#9ACD32', provider: 'mmp', mmpModelId: 13 },
    { id: 'grey_wolf', name: 'Grey Wolf', description: 'Cartoon Villain', color: '#696969', provider: 'mmp', mmpModelId: 14 },
    { id: 'bear_two', name: 'Bear Two', description: 'Cartoon Character', color: '#8B4513', provider: 'mmp', mmpModelId: 15 },
    { id: 'eikyuu_taffy', name: 'Eikyuu Taffy', description: 'Virtual Idol', color: '#FF6347', provider: 'mmp', mmpModelId: 16 },
  ];

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('nexusAiVoiceHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        console.error('Failed to parse voice history', e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nexusAiVoiceHistory', JSON.stringify(history));
  }, [history]);

  // Effect to play audio when audioUrl changes
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.load(); // Ensure the new source is loaded
      audioRef.current.play().catch(e => console.error("Audio play failed:", e)); // Attempt to play, catch potential errors
    }
  }, [audioUrl]);

  const handleGenerateVoice = async () => {
    if (!isAuthenticated) {
      toast({
        title: "需要登录",
        description: "请先登录后再使用语音合成功能",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!checkPaymentStatus()) {
      toast({
        title: "会员功能",
        description: "语音合成是会员专享功能，请先升级为会员",
        variant: "destructive",
      });
      navigate('/payment');
      return;
    }

    if (!text.trim()) {
      toast({
        title: "内容为空",
        description: "请输入需要转换为语音的文本",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setAudioUrl(null); // Clear previous audio

    try {
      let finalTextToSpeak = text.trim();
      let isInterpretation = false;

      if (isInterpretationMode) {
        isInterpretation = true;
        // 1. Call text generation AI for interpretation
        const interpretationPrompt = `请根据以下主题进行非对话式的阐述和讨论，内容要丰富且有深度，不要以对话形式开始或结束，直接给出内容：${text}`;
        const encodedInterpretationPrompt = encodeURIComponent(interpretationPrompt);
        const textGenApiUrl = `https://text.pollinations.ai/${encodedInterpretationPrompt}?model=openai-large`; // Using openai-large for interpretation

        toast({
          title: "智能演绎中",
          description: "AI正在思考并生成内容...",
          duration: 2000
        });

        const textResponse = await fetch(textGenApiUrl);
        if (!textResponse.ok) {
          throw new Error(`文本生成API响应错误: ${textResponse.status}`);
        }
        finalTextToSpeak = await textResponse.text(); // Assuming it returns plain text
        
        if (!finalTextToSpeak.trim()) {
            throw new Error("AI未能生成有效内容，请尝试其他主题。");
        }
      }

      const selectedVoiceOption = voiceOptions.find(voice => voice.id === selectedVoice);
      if (!selectedVoiceOption) {
        throw new Error("未找到选定的语音模型。");
      }

      let audioApiUrl = '';

      if (selectedVoiceOption.provider === 'pollinations') {
        audioApiUrl = `https://text.pollinations.ai/${encodeURIComponent(finalTextToSpeak)}?model=openai-audio&voice=${selectedVoiceOption.id}&nologo=true`;
      } else if (selectedVoiceOption.provider === 'mmp') {
        if (selectedVoiceOption.mmpModelId === undefined) {
          throw new Error("MMP模型ID未定义。");
        }
        const mmpResponse = await fetch(`https://api.mmp.cc/api/speech?modelid=${selectedVoiceOption.mmpModelId}&text=${encodeURIComponent(finalTextToSpeak)}`);
        if (!mmpResponse.ok) {
          throw new Error(`MMP API响应错误: ${mmpResponse.status}`);
        }
        const mmpData = await mmpResponse.json();
        if (mmpData.status === 'success' && mmpData.url) {
          audioApiUrl = mmpData.url;
        } else {
          throw new Error(`MMP API返回失败状态或无URL: ${mmpData.status}`);
        }
      } else {
        throw new Error("不支持的语音提供商。");
      }
      
      // Simulate network delay for better UX if API is too fast
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAudioUrl(audioApiUrl);
      
      const newHistoryItem: HistoryItem = {
        id: Date.now(),
        timestamp: new Date(),
        voice: selectedVoice,
        text: finalTextToSpeak, // Save the actual text spoken
        audioUrl: audioApiUrl,
        isInterpretation: isInterpretation
      };
      
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]); // Keep latest 10
      
      toast({
        title: "语音生成成功",
        description: "您的文本已成功转换为语音",
        variant: "default",
      });
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: "生成失败",
        description: (error as Error).message || "语音生成过程中发生错误，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearHistory = () => {
    if (window.confirm("确定要清空所有语音历史记录吗？此操作不可撤销。")) {
      setHistory([]);
      localStorage.removeItem('nexusAiVoiceHistory');
      toast({
        title: "历史记录已清空",
        description: "所有语音生成历史记录已删除",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* 标题区域 - 更宽敞 */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI 文本转音频
            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              输入文字，选择语音风格，一键转换为自然流畅的语音。<br />
              支持多种音色音调，帮您创建专业水准的音频内容。
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* 左侧控制面板 */}
            <div className="space-y-8">
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-8 text-gray-800">语音生成</h3>
                  
                  <div className="mb-8">
                    <h4 className="text-cyan-600 font-medium mb-6 text-lg">选择语音风格</h4>
                    <p className="text-gray-500 text-sm mb-6">
                      每种风格都有其独特的音色和表现力，选择最适合您内容的声音
                    </p>
                    
                    <RadioGroup 
                      value={selectedVoice} 
                      onValueChange={setSelectedVoice}
                      className="grid grid-cols-4 gap-4" // Adjusted grid for 19 items
                    >
                      {voiceOptions.map((voice) => (
                        <div
                          key={voice.id}
                          className={`relative cursor-pointer p-4 rounded-lg border transition-all ${
                            selectedVoice === voice.id
                              ? 'border-cyan-400 bg-cyan-50'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <RadioGroupItem
                            value={voice.id}
                            id={`voice-${voice.id}`}
                            className="absolute opacity-0"
                          />
                          <label
                            htmlFor={`voice-${voice.id}`}
                            className="flex flex-col items-center cursor-pointer"
                          >
                            {selectedVoice === voice.id && (
                              <div className="absolute -top-2 -right-2 bg-cyan-400 rounded-full">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <div className="text-gray-800 font-medium text-sm">{voice.name}</div>
                            <div className="text-gray-500 text-xs">{voice.description}</div>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="mb-8">
                    <Label htmlFor="text-input" className="text-cyan-600 font-medium mb-4 block text-lg">
                      {isInterpretationMode ? "输入主题" : "输入文本"}
                    </Label>
                    <Textarea
                      id="text-input"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={isInterpretationMode ? "输入您想让AI讨论的主题..." : "请输入需要转换为语音的文本..."}
                      className="min-h-[180px] bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-cyan-400 text-base"
                    />
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-gray-500 text-sm">字符数: {text.length}</p>
                      <p className="text-gray-500 text-sm">色彩节律: 不调整</p>
                    </div>
                  </div>

                  {/* Intelligent Interpretation Switch */}
                  <div className="flex items-center justify-between mb-8 p-4 bg-gray-100 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <Lightbulb className="h-5 w-5 text-purple-600 mr-3" />
                      <div>
                        <Label htmlFor="interpretation-mode" className="text-gray-800 font-medium">智能演绎模式</Label>
                        <p className="text-gray-500 text-sm">AI根据主题生成内容并朗读 (非对话)</p>
                      </div>
                    </div>
                    <Switch
                      id="interpretation-mode"
                      checked={isInterpretationMode}
                      onCheckedChange={setIsInterpretationMode}
                    />
                  </div>

                  <div className="flex justify-between mb-8">
                    <Button
                      onClick={handleGenerateVoice}
                      disabled={loading || !text.trim()}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-10 py-3 text-base"
                    >
                      {loading ? "生成中..." : "生成语音"}
                    </Button>
                    <Button variant="ghost" className="text-gray-500 hover:text-gray-700">
                      按住对话 (Ctrl + ↵ Enter)
                    </Button>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-6">
                    <h4 className="text-gray-800 font-medium mb-3 text-base">使用小技巧</h4>
                    <ul className="text-gray-600 text-sm space-y-2 list-disc pl-5">
                      <li>输入适当的可明确描述的音频的简话和语调变化</li>
                      <li>不同音频风格适合不同场景，可以尝试多种风格找到最适合的</li>
                      <li>大段文本可以分为多个短段，生成后合并，效果更佳</li>
                      <li>特殊专业术语可能需要注音或微调以获得更准确的发音</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧音频预览和历史区域 */}
            <div className="space-y-8">
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-gray-800">音频预览</h3>
                  
                  {audioUrl ? (
                    <div className="space-y-6">
                      <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center mb-4">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center mr-4"
                            style={{ 
                              backgroundColor: voiceOptions.find(v => v.id === selectedVoice)?.color || '#8B5CF6' 
                            }}
                          >
                            <Volume2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-gray-800 font-medium text-base">
                              {voiceOptions.find(v => v.id === selectedVoice)?.name || 'Voice'}
                            </div>
                            <div className="text-gray-500 text-sm">
                              {voiceOptions.find(v => v.id === selectedVoice)?.description}
                            </div>
                          </div>
                        </div>
                        
                        <audio ref={audioRef} controls className="w-full mb-6" src={audioUrl}></audio>
                        
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => {
                              // This is a placeholder for actual download logic
                              // In a real app, you'd fetch the audio blob and create a download link
                              window.open(audioUrl, '_blank'); // Simple open in new tab for direct URL
                              toast({
                                title: "下载开始",
                                description: "语音文件下载已开始",
                              });
                            }} 
                            className="bg-cyan-500 hover:bg-cyan-600"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            下载
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                      <p className="text-gray-500 text-base">
                        {loading ? '正在生成语音，请稍等...' : '尚未生成语音'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">历史记录</h3>
                    <Button 
                      variant="ghost" 
                      onClick={clearHistory}
                      className="text-red-500 hover:text-red-600 text-sm bg-red-50 hover:bg-red-100"
                    >
                      清空记录
                    </Button>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-yellow-600 text-sm">
                      生成记录提醒：后台正在处理，请等待下载。
                    </p>
                  </div>

                  {history.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {history.map((item) => (
                        <div 
                          key={item.id}
                          className="bg-white rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3"></div>
                              <span className="text-cyan-600 font-medium text-sm">
                                {voiceOptions.find(v => v.id === item.voice)?.name || item.voice}
                              </span>
                              {item.isInterpretation && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 flex items-center">
                                  <Lightbulb className="h-3 w-3 mr-1" />演绎
                                </span>
                              )}
                            </div>
                            <span className="text-gray-500 text-xs">{formatTime(item.timestamp)}</span>
                          </div>
                          
                          <p className="text-gray-800 text-sm mb-3 line-clamp-2">{item.text}</p>
                          
                          <div className="flex justify-end">
                            <Button 
                              size="sm"
                              className="bg-cyan-500 hover:bg-cyan-600 text-xs"
                              onClick={() => {
                                if (item.audioUrl) {
                                  window.open(item.audioUrl, '_blank'); // Simple open in new tab for direct URL
                                  toast({ title: "下载开始", description: "语音文件下载已开始" });
                                } else {
                                  toast({ title: "无音频", description: "此历史记录没有可下载的音频", variant: "destructive" });
                                }
                              }}
                            >
                              下载
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">暂无历史记录</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Voice;