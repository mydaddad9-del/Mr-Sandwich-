import React from 'react';

/**
 * Baba Roti Café Official Vector Icon Emblem
 * Features:
 * - Royal deep sapphire & indigo backdrop with golden caramel rim
 * - Signature warm golden Roti coffee bun with caramel drizzle swirl
 * - Steaming espresso cup with artisan aroma waves
 * - Micro sparkle accent
 */
export const BabaRotiIcon = ({ size = 36, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-label="Baba Roti Café Emblem"
  >
    <defs>
      {/* Background Gradient */}
      <linearGradient id="brBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="45%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>

      {/* Luxury Gold & Caramel Gradient */}
      <linearGradient id="brGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="30%" stopColor="#f59e0b" />
        <stop offset="70%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>

      {/* Bun Crust Gradient */}
      <linearGradient id="brBunGrad" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="35%" stopColor="#f59e0b" />
        <stop offset="80%" stopColor="#b45309" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>

      {/* Steam Accent Gradient */}
      <linearGradient id="brSteamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#fde68a" stopOpacity="0.1" />
      </linearGradient>

      {/* Drop Shadow Filter */}
      <filter id="brGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#f59e0b" floodOpacity="0.35" />
      </filter>
    </defs>

    {/* Rounded Squircle Container */}
    <rect width="64" height="64" rx="16" fill="url(#brBgGrad)" />
    
    {/* Inner Subtle Border with Gold Highlight */}
    <rect
      x="1.5"
      y="1.5"
      width="61"
      height="61"
      rx="14.5"
      fill="none"
      stroke="url(#brGoldGrad)"
      strokeWidth="1.5"
      strokeOpacity="0.75"
    />

    {/* Aroma Steam Wisps */}
    <path
      d="M26 18 Q23 13 27 9"
      stroke="url(#brSteamGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M32 17 Q36 12 33 7"
      stroke="url(#brSteamGrad)"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M38 18 Q42 14 39 9"
      stroke="url(#brSteamGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />

    {/* Signature Roti Coffee Bun Dome */}
    <path
      d="M17 38 C17 25 23 19 32 19 C41 19 47 25 47 38 Z"
      fill="url(#brBunGrad)"
      filter="url(#brGlow)"
    />

    {/* Bun Caramel Coffee Swirl Piping */}
    <path
      d="M23 37 Q25 24 32 23 Q39 24 41 37"
      fill="none"
      stroke="#78350f"
      strokeWidth="1.4"
      strokeLinecap="round"
      opacity="0.65"
    />
    <path
      d="M27 36 Q29 27 32 26 Q35 27 37 36"
      fill="none"
      stroke="#fde68a"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.8"
    />

    {/* Artisan Espresso Cup Body */}
    <path
      d="M21 39 L24 49 C24.5 52.5 28 54 32 54 C36 54 39.5 52.5 40 49 L43 39 Z"
      fill="#ffffff"
    />

    {/* Cup Handle */}
    <path
      d="M42 41 C46 41 47 43 47 46 C47 48.5 45.5 50 41 50"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Coffee Cup Gold Band */}
    <path
      d="M22.5 43.5 L41.5 43.5"
      stroke="url(#brGoldGrad)"
      strokeWidth="1.6"
      strokeLinecap="round"
    />

    {/* Saucer */}
    <path
      d="M18 55 C22 58 42 58 46 55"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M23 57 C27 59 37 59 41 57"
      fill="none"
      stroke="url(#brGoldGrad)"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.9"
    />
  </svg>
);

/**
 * Full Baba Roti Café Brand Component
 */
export default function BabaRotiLogo({
  collapsed = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  showSubtitle = true,
  subtitle = 'Café & Bakery',
  className = '',
  isLight = false,
  textColor = '',
}) {
  const iconSizes = {
    sm: 30,
    md: 38,
    lg: 48,
  };

  const iconPx = typeof size === 'number' ? size : iconSizes[size] || 38;

  if (collapsed) {
    return (
      <div className={`flex items-center justify-center ${className}`} title="Baba Roti Café">
        <BabaRotiIcon size={iconPx} />
      </div>
    );
  }

  const brandTextColor = textColor || (isLight ? 'text-slate-900' : 'text-white');
  const subTextColor = isLight ? 'text-slate-500' : 'text-blue-200/70';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Emblem */}
      <div className="relative group transition-transform duration-200 hover:scale-105">
        <BabaRotiIcon size={iconPx} />
      </div>

      {/* Brand Typography */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold tracking-tight leading-none text-[15px] transition-colors ${brandTextColor}`}>
            Baba Roti
          </span>
          <span className="rounded-md bg-gradient-to-r from-amber-400 to-amber-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950 shadow-sm">
            Café
          </span>
        </div>

        {showSubtitle && (
          <p className={`mt-1 flex items-center gap-1.5 text-[10px] font-medium tracking-wide leading-none transition-colors ${subTextColor}`}>
            <span className="h-1 w-1 rounded-full bg-amber-400 opacity-80" />
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
