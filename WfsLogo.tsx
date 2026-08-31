import React from 'react';
import { BrandConfig } from '../types/index.ts';
import { Palette } from 'lucide-react';

interface WfsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
  const badgeText = brand?.badgeText || 'CADIM & CONFORMIDADE';
  const customLogoUrl = brand?.customLogoUrl;
  const logoType = brand?.logoType || 'styled_wfs';

  const dimensions = {
    sm: 'h-9 sm:h-10',
    md: 'h-11 sm:h-13',
    lg: 'h-14 sm:h-16',
    xl: 'h-18 sm:h-20',
  };

  return (
    <div
      onClick={onClickCustomize}
      className={`group flex items-center gap-3 select-none ${
        onClickCustomize ? 'cursor-pointer' : ''
      } ${className}`}
      title={onClickCustomize ? 'Clique para personalizar identidade, logotipo e paleta' : undefined}
    >
      {/* 1. Custom Image if user uploaded their own in Brand Settings */}
      {logoType === 'custom_image' && customLogoUrl ? (
        <div className={`relative ${dimensions[size]} flex items-center justify-center shrink-0`}>
          <img
            src={customLogoUrl}
            alt="Logo"
            className="h-full w-auto object-contain drop-shadow-2xs"
          />
        </div>
      ) : (
        /* 2. Official WFS Brand Logo (Static Image) */
        <div className={`relative ${dimensions[size]} flex items-center justify-center shrink-0`}>
          <img
            src="/wfs-logo.svg"
            alt="WFS - A SATS COMPANY"
            className="h-full w-auto object-contain drop-shadow-2xs"
          />
        </div>
      )}

      {/* Compliance / CADIM Badge Tag */}
      {badgeText && showSubtitle && (
        <div className="flex items-center gap-1.5 pl-1">
          <span className="hidden sm:inline-block h-6 w-px bg-slate-200" />
          <span className="text-[10px] sm:text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md bg-[#E21B23]/10 text-[#E21B23] border border-[#E21B23]/25 tracking-wider shadow-2xs">
            {badgeText}
          </span>
          {onClickCustomize && (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-slate-700">
              <Palette className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      )}
    </div>
  );
};
