import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {

        const baseStyles = "relative inline-flex items-center justify-center font-semibold rounded-ios transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97] overflow-hidden select-none";

        const variants = {
            primary: "bg-ios-blue text-white hover:opacity-90 active:opacity-80 focus:ring-2 focus:ring-ios-blue/30 focus:ring-offset-2 dark:focus:ring-offset-black",
            secondary: "bg-ios-gray/15 text-ios-blue dark:text-ios-blue hover:bg-ios-gray/25 active:bg-ios-gray/30",
            outline: "border border-ios-separator text-ios-blue hover:bg-ios-gray/5 active:bg-ios-gray/10 focus:ring-2 focus:ring-ios-blue/30",
            ghost: "text-ios-blue hover:bg-ios-blue/10 active:bg-ios-blue/15",
            danger: "bg-ios-red text-white hover:opacity-90 active:opacity-80 focus:ring-2 focus:ring-ios-red/30",
        };

        const sizes = {
            sm: "h-8 px-3 text-[13px]",
            md: "h-11 px-6 text-[15px]",
            lg: "h-14 px-8 text-[17px]",
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
