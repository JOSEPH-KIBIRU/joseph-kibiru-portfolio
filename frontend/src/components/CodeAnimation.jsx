import React, { useEffect, useRef } from 'react';
import './CodeAnimation.css';

const CodeAnimation = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationId;
    
    canvas.width = width;
    canvas.height = height;

    // High visibility code snippets
    const codeSnippets = [
      '⚡ const App = () => {', '✨ return <div>Hello</div>', '🚀 };',
      '💻 npm run dev', '🔥 git commit -m "feat"', '🐳 docker-compose up',
      '🎨 import React from "react"', '⚛️ useEffect(() => {', '💡 }, [])',
      '🌈 <motion.div />', '📦 export default App', '🔧 async function fetchData()',
      '📡 await axios.get("/api")', '🎯 try {', '🐛 } catch(error) {', '✅ console.log("Success")',
      '💎 Full Stack Dev', '🚀 React.js', '💜 Node.js', '📀 MongoDB',
      '🎨 TypeScript', '⚡ Next.js', '🐍 Python', '🔥 Firebase'
    ];

    // High visibility bright colors
    const colors = [
      '#ff6b6b', // Bright Red
      '#4ecdc4', // Turquoise
      '#45b7d1', // Sky Blue
      '#96ceb4', // Mint
      '#ffeaa7', // Light Yellow
      '#dfe6e9', // Light Gray
      '#ffb8b8', // Light Pink
      '#a8e6cf', // Seafoam
      '#ffd3b6', // Peach
      '#ffaaa5', // Coral
      '#ff8c94', // Salmon
      '#c7b9ff', // Lavender
    ];

    // Particles for floating code
    const particles = [];
    const particleCount = 60; // Increased for more visibility

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        text: codeSnippets[Math.floor(Math.random() * codeSnippets.length)],
        speed: 0.5 + Math.random() * 1.2, // Faster
        size: 18 + Math.random() * 20, // Larger text
        opacity: 0.7 + Math.random() * 0.3, // Higher opacity
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: (Math.random() - 0.5) * 0.15,
        velocityX: (Math.random() - 0.5) * 0.3, // Add horizontal movement
        velocityY: 0.5 + Math.random() * 1,
      });
    }

    // Brighter matrix rain effect
    const matrixColumns = Math.floor(width / 30);
    const matrixDrops = [];
    const matrixChars = '01💻⚡🔥✨🎨🚀💎⚛️📡🎯🐛✅💜📀';
    
    for (let i = 0; i < matrixColumns; i++) {
      matrixDrops[i] = Math.floor(Math.random() * -height);
    }

    // Bright stars
    const stars = [];
    const starCount = 150;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }

    const drawStars = () => {
      const time = Date.now() * 0.003;
      stars.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * twinkle})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
    };

    const drawMatrix = () => {
      for (let i = 0; i < matrixDrops.length; i++) {
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        const brightness = Math.random() * 0.8 + 0.5;
        ctx.fillStyle = `rgba(168, 85, 247, ${brightness * 0.8})`;
        ctx.font = 'bold 20px monospace';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#a855f7';
        ctx.fillText(char, i * 30, matrixDrops[i] * 20);
        
        if (matrixDrops[i] * 20 > height && Math.random() > 0.97) {
          matrixDrops[i] = 0;
        }
        matrixDrops[i]++;
      }
      ctx.shadowBlur = 0;
    };

    const drawParticles = () => {
      // Clear with very light trail for motion blur effect
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
      ctx.fillRect(0, 0, width, height);
      
      // Draw particles
      particles.forEach(p => {
        // Update position with both vertical and horizontal movement
        p.y += p.velocityY;
        p.x += p.velocityX;
        
        // Wrap around screen
        if (p.y > height) {
          p.y = -50;
          p.x = Math.random() * width;
          p.text = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
          p.color = colors[Math.floor(Math.random() * colors.length)];
        }
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;

        // Draw with glow effect
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        // Add shadow for glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        
        ctx.font = `bold ${p.size}px 'Fira Code', 'Courier New', monospace`;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillText(p.text, 0, 0);
        
        ctx.restore();
      });
      
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Draw floating bright numbers
      ctx.font = 'bold 16px monospace';
      for (let i = 0; i < 120; i++) {
        const x = (i * 40 + Date.now() * 0.05) % width;
        const y = (Date.now() * 0.04 * (i % 4) + i * 35) % height;
        const binary = Math.random() > 0.5 ? '1' : '0';
        const color = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillStyle = `${color}`;
        ctx.globalAlpha = 0.4 + Math.random() * 0.4;
        ctx.fillText(binary, x, y);
      }
      ctx.globalAlpha = 1;
    };

    // Draw bright glowing orbs
    const drawGlowingOrbs = () => {
      const time = Date.now() * 0.002;
      
      // Large pulsing orbs
      const orbPositions = [
        { x: width * 0.2, y: height * 0.3, radius: 200, color: '#a855f7' },
        { x: width * 0.8, y: height * 0.7, radius: 250, color: '#ec489a' },
        { x: width * 0.5, y: height * 0.5, radius: 180, color: '#06b6d4' },
        { x: width * 0.3, y: height * 0.8, radius: 150, color: '#10b981' },
        { x: width * 0.7, y: height * 0.2, radius: 170, color: '#f59e0b' },
      ];
      
      orbPositions.forEach((orb, index) => {
        const pulse = Math.sin(time * 1.5 + index) * 0.2 + 0.8;
        const gradient = ctx.createRadialGradient(
          orb.x + Math.sin(time + index) * 30,
          orb.y + Math.cos(time * 0.8 + index) * 30,
          0,
          orb.x,
          orb.y,
          orb.radius * pulse
        );
        gradient.addColorStop(0, `${orb.color}40`);
        gradient.addColorStop(0.5, `${orb.color}20`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      });
    };

    // Draw bright circuit lines
    const drawCircuitPattern = () => {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 2;
      
      for (let i = 0; i < 20; i++) {
        const offset = (Date.now() * 0.01 + i) % 100;
        
        // Animated horizontal lines
        ctx.beginPath();
        ctx.moveTo(-50 + offset * 10, height * (i / 20));
        ctx.lineTo(width + 50, height * (i / 20) + 50);
        ctx.stroke();
        
        // Animated vertical lines
        ctx.beginPath();
        ctx.moveTo(width * (i / 20), -50 + offset * 8);
        ctx.lineTo(width * (i / 20) + 80, height + 50);
        ctx.stroke();
      }
    };

    // Draw glowing particles that shoot upward
    const shooters = [];
    for (let i = 0; i < 30; i++) {
      shooters.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 1 + Math.random() * 2,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const drawShooters = () => {
      shooters.forEach(shooter => {
        shooter.y -= shooter.speed;
        if (shooter.y < 0) {
          shooter.y = height;
          shooter.x = Math.random() * width;
        }
        
        ctx.beginPath();
        ctx.arc(shooter.x, shooter.y, shooter.size, 0, Math.PI * 2);
        ctx.fillStyle = shooter.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = shooter.color;
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    };

    const animate = () => {
      drawParticles();
      drawMatrix();
      drawStars();
      drawGlowingOrbs();
      drawCircuitPattern();
      drawShooters();
      
      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="code-animation" />;
};

export default CodeAnimation;