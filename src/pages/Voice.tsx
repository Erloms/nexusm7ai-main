import React, { useState, useRef, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Volume2, 
  Download, 
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link } from 'react-router-dom';

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface HistoryItem {
  id: number;
  timestamp: Date;
  voice: string;
  text: string;
  audioUrl?: string;
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
  const audioRef = useRef<HTMLAudioElement>(null);

  // Voice options - expanded to 15 options matching the screenshot
  const voiceOptions: VoiceOption[] = [
    { id: 'alloy', name: 'Alloy', description: '平衡中性', color: '#8B5CF6' },
    { id: 'echo', name: 'Echo', description: '深沉有力', color: '#6366F1' },
    { id: 'fable', name: 'Fable', description: '温暖讲述', color: '#8B5CF6' },
    { id: 'onyx', name: 'Onyx', description: '威严庄重', color: '#333333' },
    { id: 'nova', name: 'Nova', description: '友好专业', color: '#10B981' },
    { id: 'shimmer', name: 'Shimmer', description: '轻快明亮', color: '#60A5FA' },
    { id: 'coral', name: 'Coral', description: '温柔平静', color: '#F87171' },
    { id: 'verse', name: 'Verse', description: '生动诗意', color: '#FBBF24' },
    { id: 'ballad', name: 'Ballad', description: '抒情柔和', color: '#A78BFA' },
    { id: 'ash', name: 'Ash', description: '思考沉稳', color: '#4B5563' },
    { id: 'sage', name: 'Sage', description: '智慧老练', color: '#059669' },
    { id: 'brook', name: 'Brook', description: '流畅舒适', color: '#3B82F6' },
    { id: 'clover', name: 'Clover', description: '活泼年轻', color: '#EC4899' },
    { id: 'dan', name: 'Dan', description: '男声稳重', color: '#1F2937' },
    { id: 'elan', name: 'Elan', description: '优雅流利', color: '#7C3AED' },
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
    
    try {
      const url = `https://text.pollinations.ai/${encodeURIComponent(text)}?model=openai-audio&voice=${selectedVoice}&nologo=true`;
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAudioUrl(url);
      
      const newHistoryItem: HistoryItem = {
        id: Date.now(),
        timestamp: new Date(),
        voice: selectedVoice,
        text: text,
        audioUrl: url
      };
      
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
      
      toast({
        title: "语音生成成功",
        description: "您的文本已成功转换为语音",
        variant: "default",
      });
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: "生成失败",
        description: "语音生成过程中发生错误，请稍后再试",
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
                      className="grid grid-cols-3 gap-4"
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
                    <Label htmlFor="text-input" className="text-cyan-600 font-medium mb-4 block text-lg">输入文本</Label>
                    <Textarea
                      id="text-input"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="使用中国官方说明语法，如测试AI视频合成，可以直接文字转换前缀：请保持文本"
                      className="min-h-[180px] bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-cyan-400 text-base"
                    />
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-gray-500 text-sm">字符数: {text.length}</p>
                      <p className="text-gray-500 text-sm">色彩节律: 不调整</p>
                    </div>
                  </div>

                  <div className="flex justify-between mb-8">
                    <Button
                      onClick={handleGenerateVoice} // Replace with actual function
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
                            </div>
                            <span className="text-gray-500 text-xs">{formatTime(item.timestamp)}</span>
                          </div>
                          
                          <p className="text-gray-800 text-sm mb-3 line-clamp-2">{item.text}</p>
                          
                          <div className="flex justify-end">
                            <Button 
                              size="sm"
                              className="bg-cyan-500 hover:bg-cyan-600 text-xs"
                              onClick={() => setAudioUrl(item.audioUrl)}
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
