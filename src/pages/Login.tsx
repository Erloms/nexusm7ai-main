import React, { useState } from 'react';
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
  
  const [email, setEmail] = useState(''); // Changed from 'account' to 'email'
  const [password, setPassword] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password); // Use 'email' for login
    if (result.success) {
      toast({
        title: "登录成功",
        description: result.message || "您已成功登录！",
        variant: "default",
      });
      navigate('/');
    } else {
      toast({
        title: "登录失败",
        description: result.message || "请检查您的邮箱和密码。",
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
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  邮箱
                </label>
                <Input
                  id="email"
                  type="email" // Changed type to email
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-nexus-dark/50 border-nexus-blue/30 text-white placeholder-white/50 focus:border-nexus-blue"
                  placeholder="请输入您的注册邮箱" // Updated placeholder
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  请使用您注册时使用的邮箱登录
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