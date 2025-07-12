import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Check, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface PaymentRequest {
  id: string;
  contactInfo: string;
  orderNumber: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  userId?: string;
}

const PaymentRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // 从本地存储加载支付请求
  useEffect(() => {
    const storedRequests = JSON.parse(localStorage.getItem('paymentRequests') || '[]');
    setRequests(storedRequests);
    setLoading(false);
  }, []);

  // 处理请求的批准或拒绝
  const handleRequest = (id: string, approved: boolean) => {
    setRequests(prev => {
      const updated = prev.map(req => {
        if (req.id === id) {
          const newStatus = approved ? 'approved' as const : 'rejected' as const;
          
          // 如果批准，更新用户的会员状态
          if (approved && req.userId) {
            // 在实际应用中，这应该调用后端API来更新用户状态
            // 这里我们使用本地存储模拟
            const vipUsers = JSON.parse(localStorage.getItem('vipUsers') || '[]');
            if (!vipUsers.includes(req.userId)) {
              vipUsers.push(req.userId);
              localStorage.setItem('vipUsers', JSON.stringify(vipUsers));
            }
          }
          
          return { ...req, status: newStatus };
        }
        return req;
      });
      
      // 保存到本地存储
      localStorage.setItem('paymentRequests', JSON.stringify(updated));
      
      return updated;
    });

    // 显示操作成功通知
    toast({
      title: approved ? "已批准支付" : "已拒绝支付",
      description: `已${approved ? '批准' : '拒绝'}ID为 ${id} 的支付请求${approved ? '，用户已获得VIP权限' : ''}`,
    });
  };

  // 过滤掉已处理的请求
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

  if (loading) {
    return <div className="p-8 text-center text-white">正在加载支付请求...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4 text-white">待处理支付 ({pendingRequests.length})</h2>
        
        {pendingRequests.length > 0 ? (
          <div className="bg-nexus-dark/50 border border-nexus-blue/30 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">联系方式</TableHead>
                  <TableHead className="text-white">订单号</TableHead>
                  <TableHead className="text-white">提交时间</TableHead>
                  <TableHead className="text-white">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map(request => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium text-white">{request.contactInfo}</TableCell>
                    <TableCell className="text-white">{request.orderNumber}</TableCell>
                    <TableCell className="text-white">
                      {new Date(request.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleRequest(request.id, true)}
                        >
                          <Check className="w-4 h-4 mr-1" /> 批准
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleRequest(request.id, false)}
                        >
                          <X className="w-4 h-4 mr-1" /> 拒绝
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center text-white bg-nexus-dark/50 border border-nexus-blue/30 rounded-lg">
            没有待处理的支付请求
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 text-white">已处理支付 ({processedRequests.length})</h2>
        
        {processedRequests.length > 0 ? (
          <div className="bg-nexus-dark/50 border border-nexus-blue/30 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">联系方式</TableHead>
                  <TableHead className="text-white">订单号</TableHead>
                  <TableHead className="text-white">提交时间</TableHead>
                  <TableHead className="text-white">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedRequests.map(request => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium text-white">{request.contactInfo}</TableCell>
                    <TableCell className="text-white">{request.orderNumber}</TableCell>
                    <TableCell className="text-white">
                      {new Date(request.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        request.status === 'approved' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {request.status === 'approved' ? '已批准' : '已拒绝'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center text-white bg-nexus-dark/50 border border-nexus-blue/30 rounded-lg">
            没有已处理的支付请求
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentRequests;
