import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useToast } from "@/components/ui/use-toast"; // Import useToast

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast(); // Initialize useToast
  
  const [identifier, setIdentifier] = useState(''); // Changed from 'email' to 'identifier'
  const [password, setPassword] = useState('');
  
  // Load saved identifier from localStorage on component mount
  useEffect(() => {
    const savedIdentifier = localStorage.getItem('lastLoginIdentifier');
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(identifier, password); // Use 'identifier' for login
    if (result.success) {
      toast({
        title: "登录成功",
        description: result.message || "您已成功登录！",
        variant: "default",
      });
      localStorage.setItem('lastLoginIdentifier', identifier); // Save identifier on successful login
      navigate('/');
    } else {
      toast({
        title: "登录失败",
        description: result.message || "请检查您的账号和密码。",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-nexus-dark flex flex-col">
      <Navigation />
      
      <div className="flex-grow flex items-center justify-center px-4 py-32">
        <div className="w-full max-w-md">
          <div className="card-glowing p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gradient">登录 Nexus AI</h1>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-white mb-2">
                  账号
                </label>
                <Input
                  id="identifier"
                  type="text" // Changed type to text to allow username
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="bg-nexus-dark/50 border-nexus-blue/30 text-white placeholder-white/50 focus:border-nexus-blue"
                  placeholder="请输入您的用户名或注册邮箱" // Updated placeholder
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  支持用户名或邮箱登录
                </p>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  密码
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-nexus-dark/50 border-nexus-blue/30 text-white placeholder-white/50 focus:border-nexus-blue"
                  placeholder="输入密码"
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-nexus-blue hover:bg-nexus-blue/80 text-white py-6"
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </Button>
              
              <div className="text-center text-white/70 pt-2">
                没有账号？{' '}
                <Link to="/register" className="text-nexus-cyan hover:underline">
                  注册
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;