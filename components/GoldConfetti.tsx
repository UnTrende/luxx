import React, { useEffect, useState } from 'react';

const GoldConfetti: React.FC = () => {
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; rotation: number; speed: number; color: string }>>([]);

    useEffect(() => {
        const colors = ['#D4AF37', '#F2D06B', '#AA8A28', '#FFFFFF'];
        const particleCount = 50;
        const newParticles = [];

        for (let i = 0; i < particleCount; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * 100, // %
                y: -10 - Math.random() * 20, // Start above screen
                size: 5 + Math.random() * 10,
                rotation: Math.random() * 360,
                speed: 2 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }

        setParticles(newParticles);

        const interval = setInterval(() => {
            setParticles(prev => prev.map(p => ({
                ...p,
                y: p.y + p.speed,
                rotation: p.rotation + 5,
            })).filter(p => p.y < 110)); // Remove if off screen
        }, 20);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size * 0.4}px`,
                        backgroundColor: p.color,
                        transform: `rotate(${p.rotation}deg)`,
                        opacity: 0.8,
                        boxShadow: '0 0 4px rgba(212, 175, 55, 0.5)'
                    }}
                />
            ))}
        </div>
    );
};

export default GoldConfetti;
