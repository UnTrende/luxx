import React from 'react';

const LoadingSpinner: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-midnight flex items-center justify-center z-50">
            <div className="text-center">
                {/* Animated scissors logo */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 animate-spin-slow">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            className="w-full h-full text-gold drop-shadow-glow"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M6 6l6 6m0 0l6-6m-6 6V3m0 18v-6m0 0l-6 6m6-6l6 6"
                            />
                        </svg>
                    </div>
                </div>

                {/* Loading text */}
                <h2 className="text-xl font-serif text-gold mb-2 animate-pulse">
                    Loading...
                </h2>
                <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-gold-gradient w-1/3 animate-loading-bar"></div>
                </div>
            </div>

            <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default LoadingSpinner;
