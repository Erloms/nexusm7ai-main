import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Video, Trash2, Clock } from 'lucide-react';

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: Date;
  model?: string;
}

interface GeneratedVideo {
  id: string;
  prompt?: string;
  imageUrl?: string; // Source image for video
  videoUrl?: string;
  coverImageUrl?: string;
  timestamp: Date;
  model?: string;
  status: 'PROCESSING' | 'SUCCESS' | 'FAIL';
  taskId?: string;
}

interface ImageVideoHistoryProps {
  imageHistory: GeneratedImage[];
  videoHistory: GeneratedVideo[];
  onLoadItem: (type: 'image' | 'video', id: string) => void;
  onDeleteItem: (type: 'image' | 'video', id: string) => void;
  onClearHistory: (type: 'image' | 'video') => void;
}

const ImageVideoHistory: React.FC<ImageVideoHistoryProps> = ({
  imageHistory,
  videoHistory,
  onLoadItem,
  onDeleteItem,
  onClearHistory,
}) => {
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
    <div className="space-y-6">
      {/* Image History */}
      <div className="bg-[#1a2740] border border-[#203042]/50 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <ImageIcon className="w-5 h-5 text-cyan-400 mr-2" /> 图像历史
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClearHistory('image')}
            className="text-red-400 hover:bg-red-400/20"
            disabled={imageHistory.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-1" /> 清空
          </Button>
        </div>
        <ScrollArea className="h-[300px] pr-2">
          {imageHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>暂无图像生成历史</p>
            </div>
          ) : (
            <div className="space-y-3">
              {imageHistory.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 transition-colors"
                  onClick={() => onLoadItem('image', item.id)}
                >
                  <img src={item.imageUrl} alt="Generated" className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.prompt}</p>
                    <p className="text-gray-400 text-xs flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" /> {formatTime(item.timestamp)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onDeleteItem('image', item.id); }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-400/20 p-1 h-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Video History */}
      <div className="bg-[#1a2740] border border-[#203042]/50 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Video className="w-5 h-5 text-purple-400 mr-2" /> 视频历史
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClearHistory('video')}
            className="text-red-400 hover:bg-red-400/20"
            disabled={videoHistory.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-1" /> 清空
          </Button>
        </div>
        <ScrollArea className="h-[300px] pr-2">
          {videoHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <Video className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>暂无视频生成历史</p>
            </div>
          ) : (
            <div className="space-y-3">
              {videoHistory.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 transition-colors"
                  onClick={() => onLoadItem('video', item.id)}
                >
                  {item.coverImageUrl ? (
                    <img src={item.coverImageUrl} alt="Video Cover" className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.prompt || '无提示词'}</p>
                    <p className="text-gray-400 text-xs flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" /> {formatTime(item.timestamp)}
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        item.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                        item.status === 'PROCESSING' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {item.status === 'SUCCESS' ? '成功' :
                         item.status === 'PROCESSING' ? '处理中' : '失败'}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onDeleteItem('video', item.id); }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-400/20 p-1 h-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default ImageVideoHistory;