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
                    <label className={`block text-[13px] font-medium mb-1.5 transition-colors ${error ? 'text-ios-red' : 'text-foreground/60'}`}>
                        {label} {props.required && '*'}
                    </label>
                )}
                <div className="relative group">
                    {leftIcon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ios-gray/60 group-focus-within:text-ios-blue transition-colors duration-200">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
                            flex h-11 w-full rounded-ios border border-white/20 dark:border-white/10 ios-glass py-2 text-[16px] text-foreground
                            transition-all duration-200 
                            file:border-0 file:bg-transparent file:text-sm file:font-bold
                            placeholder:text-ios-gray/60
                            focus:outline-none focus:ring-2 focus:ring-ios-blue/20
                            disabled:cursor-not-allowed disabled:opacity-40
                            ${leftIcon ? 'pl-11' : 'px-4'}
                            ${rightIcon ? 'pr-11' : 'px-4'}
                            ${error ? 'bg-ios-red/5 ring-1 ring-ios-red/30' : ''}
                            ${className}
                        `}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ios-gray/60 group-focus-within:text-ios-blue transition-colors duration-200">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-1.5 text-[12px] text-ios-red font-medium px-1">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';
