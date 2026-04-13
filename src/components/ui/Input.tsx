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
            <div className={`w-full ${className}`}>
                {label && (
                    <label className={`block text-[11px] font-black mb-2 uppercase tracking-[0.2em] transition-colors ${error ? 'text-accent-danger' : 'text-ui-text-muted'}`}>
                        {label} {props.required && '*'}
                    </label>
                )}
                <div className="relative group">
                    {leftIcon && (
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-ui-text-muted/60 group-focus-within:text-ui-text transition-colors duration-200 z-10">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
                            flex h-14 w-full rounded-2xl border border-ui-border bg-white/40 dark:bg-white/5 text-[15px] font-bold text-ui-text
                            transition-all duration-300 outline-none
                            placeholder:text-ui-text-muted/30 placeholder:font-bold placeholder:uppercase placeholder:text-[11px] placeholder:tracking-widest
                            focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-accent-primary/5 focus:border-ui-text
                            disabled:cursor-not-allowed disabled:opacity-40
                            ${leftIcon ? 'pl-12' : 'px-5'}
                            ${rightIcon ? 'pr-12' : 'px-5'}
                            ${error ? 'border-accent-danger ring-4 ring-accent-danger/10' : ''}
                        `}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-ui-text-muted/60 group-focus-within:text-ui-text transition-colors duration-200 z-10">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-2 text-[10px] text-accent-danger font-black uppercase tracking-widest px-1">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';
