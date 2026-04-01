import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, leftIcon, rightIcon, ...props }, ref) => {
        return (
            <div className="w-full mb-5">
                {label && (
                    <label className={`block text-[13px] font-bold mb-2 tracking-wide transition-colors ${error ? 'text-[#FF3B30]' : 'text-neo-text-muted'}`}>
                        {label} {props.required && '*'}
                    </label>
                )}
                <div className="relative group">
                    {leftIcon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neo-text-muted/60 group-focus-within:text-accent-cyan transition-colors duration-200 z-10">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
                            flex h-12 w-full rounded-(--btn-radius) border-0 bg-transparent text-[15px] font-medium text-neo-text
                            transition-all duration-200 neo-pressed
                            file:border-0 file:bg-transparent file:text-sm file:font-bold
                            placeholder:text-neo-text-muted/40
                            focus:outline-none focus:ring-1 focus:ring-accent-cyan/50
                            disabled:cursor-not-allowed disabled:opacity-40
                            ${leftIcon ? 'pl-12' : 'px-5'}
                            ${rightIcon ? 'pr-12' : 'px-5'}
                            ${error ? 'ring-1 ring-[#FF3B30]/50' : ''}
                            ${className}
                        `}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neo-text-muted/60 group-focus-within:text-accent-cyan transition-colors duration-200 z-10">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-2 text-[12px] text-[#FF3B30] font-bold px-1">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';
