import React from 'react';

interface GoldBookingButtonProps {
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
    fullWidth?: boolean;
}

const GoldBookingButton: React.FC<GoldBookingButtonProps> = ({
    onClick,
    children,
    className = '',
    disabled = false,
    fullWidth = false
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        relative overflow-hidden group
        bg-gold-foil
        text-dubai-black font-serif font-bold tracking-widest uppercase
        py-4 px-8 rounded-lg
        shadow-[0_4px_14px_0_rgba(212,175,55,0.39)]
        transition-all duration-300 ease-out
        hover:shadow-[0_6px_20px_rgba(212,175,55,0.23)]
        hover:-translate-y-1
        active:translate-y-0 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
        >
            {/* Shine Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />

            {/* Content */}
            <span className="relative z-20 flex items-center justify-center gap-2">
                {children}
            </span>
        </button>
    );
};

export default GoldBookingButton;
