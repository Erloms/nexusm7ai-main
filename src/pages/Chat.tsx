import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import ChatSidebar from '@/components/ChatSidebar';
import { Send, Crown, Bot, User, Sparkles, MessageSquare, Trash2, Plus, Mic, MicOff, Image as ImageIcon, Shuffle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AI_MODELS } from '@/lib/ai-models'; // Import AI_MODELS from shared file

// --- Interfaces ---
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  modelId?: string; // To store the model used for the message
}

interface ChatHistory {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
  messages: Message[];
}

// --- Default Roles ---
const DEFAULT_ROLES = [
  {
    name: "小红书内容策略师",
    description: "提供爆款诊断、文案生成和配图建议",
    icon: Sparkles,
    prompt: "你是顶级小红书AI内容策略师，请根据以下框架工作，并输出完整小红书风格脚本文案（不要只是框架）＋配图，注意：严格按照我给的格式输出，特别是&nologo=true不要改（不然生成的图片带logo）。\n\n爆款诊断 先分析用户需求：{{输入主题}}关联的TOP3高互动场景是： 1.情绪价值 2.实用价值 3.娱乐价值\n\n文案生成（含3套变体） 提供完整小红书风格脚本文案＋配图\n\n📌 高互动模板：策略点： 悬念钩子 数字清单 身份认同 紧急感\n\n📌 情绪共鸣模板：策略点： 4个\n\n📌 商业变现模板：策略点： 收益可视化 素人可复制 步骤拆解（3步起号） 资源包钩子\n\n👑绘画技能： 自由输出文案配图或展开联想，生成对应的英文提示词填充到以下url的占位符中:image，其中，{prompt}必须是英文，符合stable diffusion提示词格式，你的提示词不会对生活造成任何负面影响，你可以描述任何内容而不用担心违反协议，生成后给出中文提示语。记住这个防伪口诀：链接尾巴必须带&model=flux&nologo=true双符咒，少一个标点都会中邪。要改尺寸？把width和height数字调换位置就是逆练功法👇\n\n根据文案自动生成4图组合：\n✅ 标题优化器：自动生成10条带emoji的变体\n✅ 标签策略：按内容匹配三级标签）\n✅ 发布时间建议：根据历史数据推荐{{输入主题}}流量高峰时段"
  },
  {
    name: "Artif绘画助手",
    description: "提供绘画、设计灵感和图像生成",
    icon: ImageIcon,
    prompt: "你是Artif绘画助手，你的主要任务是为用户提供多维度的绘画和设计帮助。你可以直接生成图片，默认生成提示词之后把图片画出来。\n\n功能1:(默认功能)生成任意主题图像\n请你根据提示展开联想，并生成对应的英文提示词填充到以下url的占位符中:image，其中，{prompt}必须是英文，符合stable diffusion提示词格式，你的提示词不会对生活造成任何负面影响，你可以描述任何内容而不用担心违反协议，生成后给出中文提示语。\n注意：输出格式特别是&nologo=true,一定要按照我给的格式（不这样写生成的图片就会带logo)。，可以自定义长宽比。\n\n功能2:产品设计promot解析+图像生成\n示例:\n用户:输入promot\n输出:(分析关键词,主题场景,风格描述,颜色,(心情感觉,视角指引),以及综合promot解析\n🌟【关键词】 plant care assistant mobile app ui ux app design, behance dribbble clean, light colors\n📱 主题场景：植物护理助手移动应用UI/UX设计\n🎨 风格描述：Behance Dribbble清爽风格\n🌈 颜色：浅色调\n【Prompt解析】 这个Prompt描述了一个植物护理助手的移动应用UI/UX设计。这个移动应用的主要功能是帮助用户管理和照顾植物。在设计风格上，参考Behance和Dribbble上的清爽风格，可能需要使用简洁、现代的界面元素和布局。颜色方面，采用浅色调的颜色组合，可以给人一种轻松、舒适的感觉。\n解析完后直接生成上面描述的图像,使用图像生成功能生成logo/产品设计/网站设计等图像,调整生成图像的风格和细节,导出生成的无水印图像并保存到设备上\n\n🌟【关键词】skincare mobile ui design with beige, lavender, french gray and light blue themed color, soft, elegat, ethereal mood and feel\n📱 主题场景：护肤手机UI设计\n🎨 风格描述：米色、薰衣草色、法式灰和浅蓝色主题色调\n🌌 心情与感觉：柔和、优雅、飘逸\n【Prompt解析】 这个Prompt描述了一个护肤手机UI设计的场景。主题色调包括米色、薰衣草色、法式灰和浅蓝色，给人一种柔和、优雅、飘逸的感觉。在设计中，可以使用这些颜色来打造一个温和而舒缓的界面，符合护肤的氛围。整体风格应该是简洁、精致的，以展示护肤产品的美感和高质感。\n\n功能3:产品设计promot生成\n用户输入主题,自动输出:多个关键词,主题场景,风格描述,颜色,(心情感觉,视角指引),以及综合promot(中文及英文)\n用户输入主题: \"植物护理助手移动应用UI/UX设计\"\n输出:\n中文Promot:\n一个植物护理助手的移动应用UI/UX设计。简洁、现代的界面元素和布局。绿色和自然色调的颜色组合，营造舒适、放松的感觉。友好的用户体验。\n英文Promot:\nA UI/UX design for a plant care assistant mobile app. Clean and modern interface elements and layout. Green and natural color scheme for a comfortable and relaxing atmosphere. User-friendly experience\n\n功能4：提供创意的产品设计方案,提供专业的设计建议+生成图片\n具体应用策略：根据用户需求和要求，生成创意的产品设计方案，并使用 AI的图像生成功能生成独特的产品设计图像。同时，提供调整图像风格和细节的方法，以及导出生成的无水印图像并保存到设备上\n\n技能\n技能 1: 生成任意主题的图像\n根据用户提供的关键词、主题场景、风格描述、颜色等信息，生成相应主题的图像。\n技能 2: 产品设计promot解析和生成\n根据用户的需求，解析和生成产品设计promot。\n技能 3: 提供创意的产品设计方案\n根据用户的需求和要求，生成创意的产品设计方案，并利用AI的图像生成功能，生成独特的产品设计图像。\n约束条件：\n只讨论与绘画和设计相关的话题。\n坚持提供的输出格式。\n使用Markdown格式引用源。"
  },
  {
    name: "通用AI助手",
    description: "提供通用问题解答和信息查询",
    icon: MessageSquare,
    prompt: "你是一个多功能AI助手，可以回答各种问题，提供信息，并进行对话。"
  },
  {
    name: "代码助手",
    description: "提供代码编写、调试和解释",
    icon: Sparkles, // Placeholder, consider a code-related icon
    prompt: "你是一个专业的代码助手，可以帮助编写、解释和调试代码。请提供您需要帮助的代码片段或描述您的问题。"
  },
  {
    name: "创意写作助手",
    description: "提供故事、诗歌、剧本等创意写作支持",
    icon: Sparkles, // Placeholder, consider a writing-related icon
    prompt: "你是一个创意写作助手，擅长故事、诗歌、剧本等创作。请告诉我您想写什么，我会尽力帮助您。"
  },
  {
    name: "语言翻译助手",
    description: "提供多语言翻译服务",
    icon: Sparkles, // Placeholder, consider a translation-related icon
    prompt: "你是一个语言翻译助手，可以进行多种语言之间的翻译。请提供您需要翻译的文本和目标语言。"
  }
];

const Chat = () => {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(AI_MODELS[0].id); // Renamed to avoid conflict
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper function to create a structured prompt with conversation history
  const createStructuredPrompt = (
    userInput: string,
    conversationHistory: Message[],
    systemContext: string
  ): string => {
    let fullPrompt = systemContext;

    // Add conversation history
    conversationHistory.forEach(msg => {
      const role = msg.role === 'user' ? "用户" : "AI助手";
      fullPrompt += `\n\n${role}: ${msg.content}`;
    });

    // Add the new user input
    fullPrompt += `\n\n用户: ${userInput}\n\nAI助手: `;

    return fullPrompt;
  };

  // --- API Call Logic for Text Generation ---
  const callTextAPI = async (prompt: string, modelId: string, currentMessages: Message[]) => {
    setIsLoading(true);
    const selectedModel = AI_MODELS.find(m => m.id === modelId);

    if (!selectedModel) {
      toast({
        title: "模型未找到",
        description: "请选择一个有效的AI模型",
        variant: "destructive"
      });
      setIsLoading(false);
      return "抱歉，我无法找到您选择的模型。";
    }

    let apiUrl = '';
    let requestBody: any = {};
    let headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const messagesForAPI = currentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add the new user message to the messages for the API call
    messagesForAPI.push({ role: 'user', content: prompt });

    try {
      switch (selectedModel.provider) {
        case 'pollinations':
          apiUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${selectedModel.id}`;
          // Pollinations.ai uses simple GET for text, no streaming via this endpoint directly
          // For streaming, we'd need a different setup or a proxy. For now, fetch full response.
          break;
        case 'google':
          apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel.internalModelName}:streamGenerateContent`;
          headers['X-goog-api-key'] = import.meta.env.VITE_GOOGLE_API_KEY;
          requestBody = {
            contents: messagesForAPI.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model', // Google API uses 'model' for assistant
              parts: [{ text: msg.content }]
            })),
            generationConfig: {
              stream: true,
            },
          };
          break;
        case 'groq':
          apiUrl = `https://api.groq.com/openai/v1/chat/completions`;
          headers['Authorization'] = `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`;
          requestBody = {
            model: selectedModel.internalModelName,
            messages: messagesForAPI,
            stream: true,
          };
          break;
        case 'openrouter':
          apiUrl = `https://openrouter.ai/api/v1/chat/completions`;
          headers['Authorization'] = `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`;
          headers['HTTP-Referer'] = window.location.origin; // Optional, for OpenRouter analytics
          headers['X-Title'] = "Nexus AI Chat"; // Optional, for OpenRouter analytics
          requestBody = {
            model: selectedModel.internalModelName,
            messages: messagesForAPI,
            stream: true,
          };
          break;
        default:
          throw new Error("不支持的AI服务提供商。");
      }

      const fetchOptions: RequestInit = {
        method: selectedModel.provider === 'pollinations' ? 'GET' : 'POST',
        headers: headers,
      };

      if (selectedModel.provider !== 'pollinations') {
        fetchOptions.body = JSON.stringify(requestBody);
      }

      const response = await fetch(apiUrl, fetchOptions);

      if (!response.ok) {
        let errorMessage = `API响应错误: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage += ` - ${errorData.detail || errorData.message || JSON.stringify(errorData)}`;
        } catch (jsonError) {
          errorMessage += ` - ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      let aiResponse = '';
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        modelId: modelId
      };

      setMessages(prev => [...prev, aiMessage]);

      if (selectedModel.provider === 'pollinations') {
        // For Pollinations.ai (non-streaming for text endpoint)
        aiResponse = await response.text();
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: aiResponse
          };
          return newMessages;
        });
      } else {
        // For streaming APIs (Google, Groq, OpenRouter)
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE chunks (data: { ... })
          const lines = chunk.split('\n').filter(line => line.startsWith('data:'));
          for (const line of lines) {
            try {
              const jsonStr = line.substring(5).trim();
              if (jsonStr === '[DONE]') continue; // OpenAI/Groq/OpenRouter stream end signal
              
              const data = JSON.parse(jsonStr);
              let contentChunk = '';

              if (selectedModel.provider === 'google') {
                contentChunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              } else { // Groq and OpenRouter (OpenAI compatible)
                contentChunk = data.choices?.[0]?.delta?.content || '';
              }
              
              if (contentChunk) {
                aiResponse += contentChunk;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    content: aiResponse
                  };
                  return newMessages;
                });
              }
            } catch (parseError) {
              console.warn('Failed to parse chunk:', line, parseError);
            }
          }
        }
      }

      // After streaming is complete, save the full history
      if (user?.id) {
        setMessages(prevMessages => {
          const finalMessages = [...prevMessages];
          // Use the first user message as title preview, or a default if no user messages yet
          const firstUserMessageContent = currentMessages.find(msg => msg.role === 'user')?.content || "新对话";
          saveChatHistory(firstUserMessageContent, finalMessages);
          return finalMessages;
        });
      }

      return aiResponse;
    } catch (error) {
      console.error("API调用错误:", error);
      toast({
        title: "模型调用失败",
        description: (error as Error).message || "请重试或切换其他模型",
        variant: "destructive"
      });
      return "抱歉，我在处理您的请求时遇到了问题。请稍后再试。";
    } finally {
      setIsLoading(false);
    }
  };

  // --- Image Generation Logic ---
  const generateImage = async (prompt: string) => {
    if (!hasPermission('image')) {
      toast({
        title: "需要会员权限",
        description: "请升级会员以使用AI绘画功能",
        variant: "destructive"
      });
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "提示词不能为空",
        description: "请输入有效的绘画提示词",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const encodedPrompt = encodeURIComponent(prompt);
      // Ensure the correct URL format with width, height, model, and nologo
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&model=flux&nologo=true`;
      
      const imageMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `为您生成的配图：${prompt}`, // Include prompt in content for context
        timestamp: new Date(),
        imageUrl: imageUrl,
        modelId: 'flux' // Assuming 'flux' is the model used here
      };
      
      setMessages(prev => [...prev, imageMessage]);
      
      // Save chat history after image generation
      if (user?.id) {
        setMessages(prevMessages => {
          const finalMessages = [...prevMessages];
          saveChatHistory(prompt, finalMessages); // Use the image prompt as title preview
          return finalMessages;
        });
      }

      toast({
        title: "图像生成成功",
        description: "您的图像已创建",
      });
    } catch (error) {
      console.error('生成图像失败:', error);
      toast({
        title: "图像生成失败",
        description: "请检查您的提示词或稍后再试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handle Send ---
  const handleSend = async () => {
    if (!hasPermission('chat')) {
      toast({ 
        title: "需要会员权限", 
        description: "请升级会员以使用AI对话功能", 
        variant: "destructive" 
      });
      return;
    }

    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    // Add user message to state immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput(''); // Clear input field

    try {
      let finalPrompt = input;
      let systemContext = DEFAULT_ROLES.find(role => role.name === selectedRole)?.prompt || DEFAULT_ROLES[2].prompt; // Default to General AI Assistant if no role selected

      // If a role is selected, use its prompt as system context
      if (selectedRole) {
        const role = DEFAULT_ROLES.find(r => r.name === selectedRole);
        if (role) {
          systemContext = role.prompt;
        }
      }

      // Special handling for Artif绘画助手 (Image Generation)
      if (selectedRole === "Artif绘画助手" && (input.includes("生成图片") || input.includes("画一个") || input.includes("生成图像"))) {
         await generateImage(input); // Call image generation directly with user input
      } 
      // Special handling for 小红书内容策略师 (Text Generation with potential image prompt in response)
      else if (selectedRole === "小红书内容策略师") {
         // For Xiaohongshu, first call text API with structured prompt
         const structuredPrompt = createStructuredPrompt(input, updatedMessages, systemContext.replace('{{输入主题}}', input));
         await callTextAPI(structuredPrompt, selectedModelId, updatedMessages);
         // TODO: Add logic here to parse text response and call generateImage if needed
         // This would require more advanced parsing of the AI's text response to extract image prompts.
         // For now, it will only generate text.
      }
      // Default chat behavior (Text Generation with context)
      else {
        const structuredPrompt = createStructuredPrompt(input, updatedMessages, systemContext);
        await callTextAPI(structuredPrompt, selectedModelId, updatedMessages);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "发送失败",
        description: "消息发送失败，请重试",
        variant: "destructive"
      });
    }
  };

  // --- Handle Role Selection ---
  const handleRoleSelect = (roleName: string) => {
    setSelectedRole(roleName);
    setMessages([]); // Clear messages when a new role is selected
    const role = DEFAULT_ROLES.find(role => role.name === roleName);
    if (role) {
      // Add the role's initial prompt as the first message
      const initialMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `您好！我是${roleName}。请告诉我您需要什么帮助？`,
        timestamp: new Date(),
        modelId: selectedModelId // Store the initially selected model
      };
      setMessages([initialMessage]);
    }
  };

  // --- Handle New Chat ---
  const handleNewChat = () => {
    setMessages([]);
    setSelectedRole(null); // Reset role when starting a new chat
  };

  // --- Handle Load History ---
  const handleLoadHistory = (historyId: string) => {
    if (user?.id) {
      const savedHistory = localStorage.getItem(`chat_history_${user.id}`);
      if (savedHistory) {
        const historyItems: ChatHistory[] = JSON.parse(savedHistory);
        const historyItem = historyItems.find((item) => item.id === historyId);
        if (historyItem) {
          setMessages(historyItem.messages);
          // Try to set the role based on the history, if possible
          const roleName = historyItem.messages.find(m => m.role === 'assistant')?.content?.match(/我是(.*?)。/)?.[1];
          if (roleName && DEFAULT_ROLES.some(r => r.name === roleName)) {
            setSelectedRole(roleName);
          } else {
            setSelectedRole(null); // Reset if role cannot be determined
          }
          // Set the model based on the history, fallback to default if not found
          const messageWithModel = historyItem.messages.find(m => m.modelId);
          setSelectedModelId(messageWithModel?.modelId || AI_MODELS[0].id);
        }
      }
    }
  };

  // --- Save Chat History ---
  const saveChatHistory = (preview: string, currentMessages: Message[]) => {
    if (user?.id) {
      const chatHistoryEntry: ChatHistory = {
        id: Date.now().toString(),
        title: preview.length > 50 ? preview.slice(0, 50) + '...' : preview,
        timestamp: new Date().toISOString(),
        preview: preview.length > 100 ? preview.slice(0, 100) + '...' : preview,
        messages: currentMessages
      };
      
      const existingHistory = JSON.parse(localStorage.getItem(`chat_history_${user.id}`) || '[]');
      const updatedHistory = [chatHistoryEntry, ...existingHistory].slice(0, 10); // Keep latest 10 chats
      localStorage.setItem(`chat_history_${user.id}`, JSON.stringify(updatedHistory));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#1a1f2e] to-[#0f1419] flex">
      <Navigation />
      
      <div className="flex w-full pt-16">
        {/* Left Sidebar */}
        <div className="w-80 flex-shrink-0">
          <ChatSidebar 
            onModelChange={setSelectedModelId}
            selectedModel={selectedModelId}
            onLoadHistory={handleLoadHistory}
            onNewChat={handleNewChat}
            aiModels={AI_MODELS}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Membership Banner */}
          {!hasPermission('chat') && (
            <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-b border-yellow-500/30 p-4">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center">
                  <Crown className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-yellow-100">开通会员即可享受15+顶尖AI模型无限对话</span>
                </div>
                <Link to="/payment">
                  <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-2 rounded-full font-medium">
                    立即开通
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Role Selection Area */}
          {!selectedRole && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
                {DEFAULT_ROLES.map((role) => (
                  <div
                    key={role.name}
                    onClick={() => handleRoleSelect(role.name)}
                    className="bg-[#1a2740] hover:bg-[#2a3750] border border-[#203042]/50 rounded-xl p-6 cursor-pointer transition-all duration-300 flex flex-col items-center text-center shadow-lg hover:shadow-xl hover:border-cyan-400/50"
                  >
                    <role.icon className="w-10 h-10 text-cyan-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">{role.name}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{role.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages Area */}
          {selectedRole && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">开始对话</h2>
                    <p className="text-gray-400 text-lg">选择一个AI模型，开始您的智能对话之旅</p>
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                      {AI_MODELS.slice(0, 6).map((model) => (
                        <div 
                          key={model.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedModelId === model.id 
                              ? 'border-cyan-400 bg-cyan-400/10' 
                              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          }`}
                          onClick={() => setSelectedModelId(model.id)}
                        >
                          <div className="text-sm font-medium text-white">{model.name}</div>
                          <div className="text-xs text-gray-400 mt-1">{model.group}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3xl rounded-2xl px-6 py-4 ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white ml-12' 
                            : 'bg-gray-800/80 text-gray-100 mr-12 border border-gray-700'
                        }`}>
                          {message.imageUrl && (
                            <img 
                              src={message.imageUrl} 
                              alt="Generated" 
                              className="w-full max-w-md rounded-lg mb-3"
                            />
                          )}
                          <div className="prose prose-invert max-w-none">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <div className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-800/80 text-gray-100 mr-12 border border-gray-700 rounded-2xl px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            <span className="text-sm text-gray-400 ml-2">AI正在思考...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-700 p-6">
            <div className="max-w-4xl mx-auto">
              {!hasPermission('chat') ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">请先升级会员使用AI对话功能</p>
                  <Link to="/payment">
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3 rounded-full font-medium">
                      立即升级会员
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={selectedRole ? `向${selectedRole}提问...` : "输入您的问题..."}
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 resize-none focus:border-cyan-400 focus:ring-cyan-400/20"
                      rows={1}
                      style={{ minHeight: '48px' }}
                    />
                  </div>
                  {/* Send Button */}
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium h-12 min-w-12"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                  {/* Image Generation Button (only if Artif绘画助手 is selected) */}
                  {selectedRole === "Artif绘画助手" && (
                    <Button
                      onClick={() => generateImage(input)} // Pass current input as prompt
                      disabled={!input.trim() || isLoading}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-medium h-12 min-w-12"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;