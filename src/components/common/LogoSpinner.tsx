"use client";

import Image from 'next/image';

interface LogoSpinnerProps {
    size?: number;
    className?: string;
}

const FRAMES = [
    { src: '/Iconos/1.svg', w: 96,  h: 101 },
    { src: '/Iconos/2.svg', w: 99,  h: 103 },
    { src: '/Iconos/3.svg', w: 104, h: 111 },
    { src: '/Iconos/4.svg', w: 92,  h: 109 },
    { src: '/Iconos/5.svg', w: 101, h: 107 },
];

export function LogoSpinner({ size = 48, className = '' }: LogoSpinnerProps) {
    return (
        <div
            className={`relative flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
            aria-label="Cargando"
            role="status"
        >
            {FRAMES.map((frame, i) => (
                <Image
                    key={frame.src}
                    src={frame.src}
                    alt=""
                    width={frame.w}
                    height={frame.h}
                    className="absolute inset-0 m-auto dark:[filter:brightness(0)_invert(1)] [filter:brightness(0)]"
                    style={{
                        width: size * 0.7,
                        height: 'auto',
                        animation: `logo-frame-fade 1.5s ease-in-out infinite`,
                        animationDelay: `${i * 0.3}s`,
                        opacity: 0,
                    }}
                />
            ))}
            <style>{`
                @keyframes logo-frame-fade {
                    0%   { opacity: 0;   transform: scale(0.85); }
                    20%  { opacity: 1;   transform: scale(1);    }
                    80%  { opacity: 1;   transform: scale(1);    }
                    100% { opacity: 0;   transform: scale(0.85); }
                }
            `}</style>
        </div>
    );
}

// Full-page loading screen
export function PageLoader({ label = 'Cargando...' }: { label?: string }) {
    return (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-ui-bg gap-6">
            <LogoSpinner size={72} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ui-text-muted animate-pulse">
                {label}
            </p>
        </div>
    );
}
