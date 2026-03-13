import React from 'react';

export function Card({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`ios-glass rounded-ios-lg overflow-hidden transition-all border border-white/20 dark:border-white/10 shadow-lg ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={`px-5 py-4 flex items-center justify-between border-b border-ios-separator/10 ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={`text-[17px] font-semibold text-foreground tracking-tight ${className}`} {...props}>{children}</h3>;
}

export function CardContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={`px-5 py-5 ${className}`} {...props}>{children}</div>;
}
