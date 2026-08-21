import React from 'react';
import { BrandConfig } from '../types/index.ts';
import { Palette } from 'lucide-react';

interface WfsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  brand?: BrandConfig;
  onClickCustomize?: () => void;
}

export const WfsLogo: React.FC<WfsLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  brand,
  onClickCustomize,
}) => {
  const companyName = brand?.companyName || 'WFS';
  const subtitle = brand?.companySubtitle || 'Gestão de SST & Contratos';
  const badgeText = brand?.badgeText || 'SST & Compliance';
  const primaryColor = brand?.primaryColor || '#1e293b';
  const accentColor = brand?.accentColor || '#f59e0b';
  const logoType = brand?.logoType || 'styled_wfs';
  const customLogoUrl = brand?.customLogoUrl;

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div
      onClick={onClickCustomize}
      className={`group flex items-center gap-3 select-none ${
        onClickCustomize ? 'cursor-pointer' : ''
      } ${className}`}
      title={onClickCustomize ? 'Clique para personalizar marca, logo e cores' : undefined}
    >
      {/* 1. Custom Image Logo */}
      {logoType === 'custom_image' && customLogoUrl ? (
        <div
          className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-white shadow-xs border border-slate-200 p-0.5`}
        >
          <img
            src={customLogoUrl}
            alt={companyName}
            className="w-full h-full object-contain"
          />
        </div>
      ) : logoType === 'initials_badge' ? (
        /* 2. Initials Monogram Badge */
        <div
          style={{ backgroundColor: primaryColor }}
          className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0 rounded-xl shadow-xs text-white font-black tracking-wider text-sm sm:text-base border border-black/10`}
        >
          <span style={{ color: accentColor }}>
            {companyName.slice(0, 3).toUpperCase()}
          </span>
        </div>
      ) : logoType === 'styled_wfs' ? (
        /* 3. Styled Modern Brand Geometric Emblem */
        <div
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 60%, ${accentColor} 100%)`,
          }}
          className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0 rounded-xl shadow-xs p-1.5 border border-white/10`}
        >
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Clean dynamic geometric shield & inspection wings */}
            <path
              d="M50 10L85 24V50C85 72 50 90 50 90C50 90 15 72 15 50V24L50 10Z"
              fill={primaryColor}
              stroke="white"
              strokeWidth="4"
              opacity="0.35"
            />
            <path
              d="M28 52L44 68L74 34"
              stroke={accentColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}

      {/* Typography & Subtitles */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            style={{ color: primaryColor }}
            className={`font-black tracking-tight ${titleSizes[size]} font-sans`}
          >
            {companyName}
          </span>

          <span
            style={{
              backgroundColor: `${accentColor}20`,
              color: primaryColor,
              borderColor: `${accentColor}40`,
            }}
            className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border"
          >
            {badgeText}
          </span>

          {onClickCustomize && (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-slate-700">
              <Palette className="w-3 h-3" />
            </span>
          )}
        </div>

        {showSubtitle && (
          <span className="text-[11px] font-medium text-slate-500 tracking-tight leading-tight mt-0.5 truncate max-w-[240px] sm:max-w-xs">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
