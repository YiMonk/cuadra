import React from 'react';

export function Card({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`neo-raised rounded-neo-lg overflow-hidden transition-all ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={`px-6 py-5 flex items-center justify-between border-b border-black/10 shadow-[inset_0_-1px_0_rgba(255,255,255,0.02)] ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={`text-[19px] font-black text-neo-text tracking-wide ${className}`} {...props}>{children}</h3>;
}

export function CardContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={`px-6 py-6 ${className}`} {...props}>{children}</div>;
}
