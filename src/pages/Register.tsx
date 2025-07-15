import React, { useState, useCallback, useEffect } from 'react'; // Import useEffect
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useToast } from "@/components/ui/use-toast";
import Captcha from '@/components/Captcha'; // Import Captcha component
import { supabase } from '@/integrations/supabase/client'; // Import supabase client

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [captchaInput, setCaptchaInput] = useState(''); // User's captcha input
  const [generatedCaptcha, setGeneratedCaptcha] = useState(''); // Generated captcha text

  // Load saved email from localStorage on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('lastRegisterEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Wrap handleCaptchaChange in useCallback to prevent unnecessary re-renders of Captcha
  const handleCaptchaChange = useCallback((text: string) => {
    setGeneratedCaptcha(text);
  }, []); // Empty dependency array means this function is created only once
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setPasswordError('两次输入的密码不匹配');
      toast({
        title: "注册失败",
        description: "两次输入的密码不匹配。",
        variant: "destructive",
      });
      return;
    }
    
    if (captchaInput.toLowerCase() !== generatedCaptcha.toLowerCase()) {
      toast({
        title: "注册失败",
        description: "验证码不正确。",
        variant: "destructive",
      });
      // Optionally, you might want to refresh the captcha here
      return;
    }

    setPasswordError('');
    
    const result = await register(email, password);
    console.log("Register result:", result);
    if (result.success) {
      toast({
        title: "注册成功",
        description: "您的账号已成功创建！", // Generic success message
        variant: "default",
      });
      localStorage.setItem('lastRegisterEmail', email);

      // After successful registration, check if user is immediately authenticated
      // This relies on Supabase's email confirmation setting.
      // If email confirmation is OFF, user should be authenticated immediately.
      // If ON, user will not be authenticated immediately and needs to verify.
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) { // If a session exists, user is logged in
        navigate('/dashboard');
      } else { // No session, user needs to log in (or verify email if confirmation is on)
        navigate('/login');
      }
    } else {
      toast({
        title: "注册失败",
        description: result.message || "发生未知错误，请重试。",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-nexus-dark flex flex-col">
      <Navigation />
      
      <div className="flex-grow flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="card-glowing p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gradient">注册 Nexus AI</h1>
            
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  邮箱
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-nexus-dark/50 border-nexus-blue/30 text-white placeholder-white/50 focus:border-nexus-blue"
                  placeholder="请输入您的邮箱"
                  required
                />
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
                  placeholder="设置密码（至少6位）"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                  确认密码
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-nexus-dark/50 border-nexus-blue/30 text-white placeholder-white/50 focus:border-nexus-blue"
                  placeholder="再次输入密码"
                  required
                />
                {passwordError && (
                  <p className="mt-2 text-red-500 text-sm">{passwordError}</p>
                )}
              </div>

              <div>
                <label htmlFor="captchaInput" className="block text-sm font-medium text-white mb-2">
                  验证码
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    id="captchaInput"
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    className="flex-1 bg-nexus-dark/50 border-nexus-blue/30 text-white placeholder-white/50 focus:border-nexus-blue"
                    placeholder="请输入验证码"
                    required
                    maxLength={5}
                  />
                  <Captcha onCaptchaChange={handleCaptchaChange} />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-nexus-blue hover:bg-nexus-blue/80 text-white py-6"
                disabled={loading}
              >
                {loading ? '注册中...' : '注册'}
              </Button>
              
              <div className="text-center text-white/70">
                已有账号？{' '}
                <Link to="/login" className="text-nexus-cyan hover:underline">
                  登录
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

export default Register;