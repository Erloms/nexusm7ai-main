import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Save, Settings } from 'lucide-react';

const AlipayConfig = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState({
    appId: '',
    appKey: '',
    publicKey: '',
    returnUrl: 'https://nexus.m7ai.top/payment-success', // Updated
    notifyUrl: 'https://nexus.m7ai.top/api/alipay/notify', // Updated
    encryptionAlgo: 'RSA2',
    environment: 'prod',
    logEnabled: true
  });

  const handleSave = () => {
    // 保存支付宝配置到localStorage
    localStorage.setItem('nexusAi_alipay_config', JSON.stringify(config));
    
    toast({
      title: "配置保存成功",
      description: "支付宝配置已保存",
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Settings className="mr-3 h-6 w-6 text-nexus-cyan" />
        <h2 className="text-2xl font-bold text-gradient">支付宝配置</h2>
      </div>
      
      <div className="bg-gradient-to-br from-nexus-dark/80 to-nexus-purple/30 backdrop-blur-sm rounded-xl border border-nexus-blue/20 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="appId" className="text-white">应用ID (APPID)</Label>
              <Input
                id="appId"
                value={config.appId}
                onChange={(e) => handleInputChange('appId', e.target.value)}
                placeholder="支付宝开放平台应用ID"
                className="bg-nexus-dark/50 border-nexus-blue/30 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="returnUrl" className="text-white">同步返回地址</Label>
              <Input
                id="returnUrl"
                value={config.returnUrl}
                onChange={(e) => handleInputChange('returnUrl', e.target.value)}
                placeholder="https://your-domain.com/success"
                className="bg-nexus-dark/50 border-nexus-blue/30 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="notifyUrl" className="text-white">异步通知地址</Label>
              <Input
                id="notifyUrl"
                value={config.notifyUrl}
                onChange={(e) => handleInputChange('notifyUrl', e.target.value)}
                placeholder="https://your-server.com/notify"
                className="bg-nexus-dark/50 border-nexus-blue/30 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="encryptionAlgo" className="text-white">签名方式</Label>
              <Select value={config.encryptionAlgo} onValueChange={(value) => handleInputChange('encryptionAlgo', value)}>
                <SelectTrigger className="bg-nexus-dark/50 border-nexus-blue/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-nexus-dark border-nexus-blue/30">
                  <SelectItem value="RSA2" className="text-white hover:bg-nexus-blue/20">RSA2</SelectItem>
                  <SelectItem value="RSA" className="text-white hover:bg-nexus-blue/20">RSA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="environment" className="text-white">环境</Label>
              <Select value={config.environment} onValueChange={(value) => handleInputChange('environment', value)}>
                <SelectTrigger className="bg-nexus-dark/50 border-nexus-blue/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-nexus-dark border-nexus-blue/30">
                  <SelectItem value="prod" className="text-white hover:bg-nexus-blue/20">生产环境</SelectItem>
                  <SelectItem value="sandbox" className="text-white hover:bg-nexus-blue/20">沙箱环境</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="appKey" className="text-white">应用私钥</Label>
              <Textarea
                id="appKey"
                value={config.appKey}
                onChange={(e) => handleInputChange('appKey', e.target.value)}
                placeholder="MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC..."
                className="bg-nexus-dark/50 border-nexus-blue/30 text-white min-h-[120px]"
              />
            </div>
            
            <div>
              <Label htmlFor="publicKey" className="text-white">支付宝公钥</Label>
              <Textarea
                id="publicKey"
                value={config.publicKey}
                onChange={(e) => handleInputChange('publicKey', e.target.value)}
                placeholder="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
                className="bg-nexus-dark/50 border-nexus-blue/30 text-white min-h-[120px]"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <Button onClick={handleSave} className="bg-nexus-blue hover:bg-nexus-blue/80 text-white">
            <Save className="h-4 w-4 mr-2" />
            保存配置
          </Button>
        </div>
        
        <div className="mt-6 p-4 bg-nexus-dark/30 rounded-lg border border-nexus-blue/20">
          <h3 className="text-lg font-bold text-nexus-cyan mb-2">配置说明</h3>
          <p className="text-white/80 text-sm mb-2">
            请先在支付宝开放平台创建应用并获取相关密钥信息。详细配置步骤请参考：
          </p>
          <a 
            href="https://opendocs.alipay.com/open/0go80l" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-nexus-cyan hover:text-nexus-blue underline text-sm"
          >
            支付宝开放平台 MCP 服务文档
          </a>
        </div>
      </div>
    </div>
  );
};

export default AlipayConfig;