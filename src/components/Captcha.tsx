import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface CaptchaProps {
  onCaptchaChange: (captchaText: string) => void;
}

const Captcha: React.FC<CaptchaProps> = ({ onCaptchaChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaText, setCaptchaText] = useState('');

  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < 5; i++) { // 5 characters for captcha
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);
    onCaptchaChange(text); // Notify parent of new captcha text
  }, [onCaptchaChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#1a2740'; // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw random lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(30, 174, 219, ${Math.random() * 0.5 + 0.2})`; // Blueish lines
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Draw text
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#05D8E8'; // Cyan text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(captchaText, canvas.width / 2, canvas.height / 2);

    // Draw random dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2})`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [captchaText]);

  useEffect(() => {
    generateCaptcha(); // Generate captcha on initial mount
  }, [generateCaptcha]);

  return (
    <div className="flex items-center gap-3">
      <canvas
        ref={canvasRef}
        width="120"
        height="40"
        className="rounded-md border border-nexus-blue/30"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={generateCaptcha}
        className="border-nexus-blue/30 text-nexus-cyan hover:bg-nexus-blue/20"
        title="刷新验证码"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Captcha;