import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    icon?: React.ReactNode;
    className?: string;
}

export function Select({ options, value, onChange, icon, className = '' }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.value === value) || options[0];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-(--btn-radius) transition-all
                    ${isOpen ? 'neo-pressed ring-1 ring-accent-cyan/30' : 'neo-convex hover:neo-pressed'}
                `}
            >
                <div className="flex items-center gap-3 truncate">
                    {icon && <span className="text-neo-text-muted">{icon}</span>}
                    <span className="text-[14px] font-bold text-neo-text tracking-wide truncate">
                        {selectedOption?.label || 'Seleccionar...'}
                    </span>
                </div>
                <ChevronDown size={16} className={`text-neo-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent-cyan' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 neo-raised rounded-(--btn-radius) overflow-hidden border border-white/5 animate-in fade-in zoom-in-95 duration-200" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <ul className="py-1">
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <li key={option.value}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                                            ${isSelected ? 'bg-white/10 text-accent-cyan' : 'text-neo-text-muted hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <span className={`text-[13px] font-bold tracking-wide truncate ${isSelected ? 'text-accent-cyan' : ''}`}>
                                            {option.label}
                                        </span>
                                        {isSelected && <Check size={14} strokeWidth={3} className="text-accent-cyan shrink-0" />}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
