import React, { useState } from 'react';

/**
 * Bloom Bar and Restaurant Official Brand Icon Emblem
 */
export const BloomAfricaIcon = ({ size = 38, className = '' }) => {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        className={`shrink-0 flex items-center justify-center rounded-xl bg-emerald-900 text-white font-bold border border-emerald-700/50 shadow-md ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(12, size * 0.38) }}
        title="Bloom Bar & Restaurant"
      >
        🍽️
      </div>
    );
  }

  return (
    <img
      src="/bloom-logo.png"
      alt="Bloom Bar & Restaurant"
      width={size}
      height={size}
      onError={() => setImgError(true)}
      className={`shrink-0 object-contain rounded-xl shadow-md border border-white/10 bg-[#153e2e] p-0.5 transition-transform duration-200 hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

/**
 * Full Bloom Bar and Restaurant Brand Component
 */
export default function BloomAfricaLogo({
  collapsed = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  showSubtitle = true,
  subtitle = 'Bar & Restaurant',
  className = '',
  isLight = false,
  textColor = '',
}) {
  const iconSizes = {
    sm: 30,
    md: 40,
    lg: 52,
  };

  const iconPx = typeof size === 'number' ? size : iconSizes[size] || 40;

  if (collapsed) {
    return (
      <div className={`flex items-center justify-center ${className}`} title="Bloom Bar & Restaurant">
        <BloomAfricaIcon size={iconPx} />
      </div>
    );
  }

  const brandTextColor = textColor || (isLight ? 'text-slate-900' : 'text-white');
  const subTextColor = isLight ? 'text-slate-500' : 'text-emerald-200/80';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Emblem */}
      <div className="relative group shrink-0">
        <BloomAfricaIcon size={iconPx} />
      </div>

      {/* Brand Typography */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight leading-none text-[15px] uppercase transition-colors ${brandTextColor}`}>
            Bloom
          </span>
          <span className="rounded-md bg-gradient-to-r from-red-600 to-rose-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
            Bar & Res
          </span>
        </div>

        {showSubtitle && (
          <p className={`mt-1 flex items-center gap-1.5 text-[10px] font-medium tracking-wide leading-none transition-colors ${subTextColor}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
