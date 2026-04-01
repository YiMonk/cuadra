import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {

        const baseStyles = "relative inline-flex items-center justify-center font-bold transition-all duration-[250ms] focus:outline-none disabled:opacity-40 disabled:pointer-events-none overflow-hidden select-none tracking-wide m-[var(--btn-margin)] rounded-[var(--btn-radius)]";

        const variants = {
            primary: "neo-accent-bg text-white hover:brightness-110 active:scale-[0.98] focus:ring-2 focus:ring-accent-blue/30 focus:ring-offset-2 focus:ring-offset-neo-bg",
            secondary: "neo-raised text-neo-text hover:text-accent-blue active:neo-pressed active:scale-[0.98]",
            outline: "neo-convex text-neo-text-muted hover:text-neo-text active:neo-pressed active:scale-[0.98]",
            ghost: "text-neo-text-muted hover:bg-white/5 hover:text-neo-text active:bg-white/10",
            danger: "bg-[linear-gradient(135deg,#FF3B30,#C10015)] shadow-[0_4px_14px_rgba(255,59,48,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] text-white hover:brightness-110 active:scale-[0.98]",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-[13px]",
            md: "px-[var(--btn-padding-x)] py-[var(--btn-padding-y)] text-[15px]",
            lg: "px-8 py-4 text-[17px]",
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                <span className="truncate">{children}</span>
            </button>
        );
    }
);

Button.displayName = 'Button';
