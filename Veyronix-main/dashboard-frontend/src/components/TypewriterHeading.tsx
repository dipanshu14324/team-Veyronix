import React from 'react';

interface TypewriterHeadingProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div';
  className?: string;
  speed?: number;
  delay?: number;
  glow?: boolean;
  glowColor?: 'cyan' | 'purple' | 'amber' | 'white';
  showCursor?: boolean;
  badge?: string;
  subtext?: string;
  badgeColor?: 'cyan' | 'purple' | 'emerald';
}

export const TypewriterHeading: React.FC<TypewriterHeadingProps> = ({
  text,
  as: Component = 'h2',
  className = '',
  glow = true,
  glowColor = 'cyan',
  badge,
  subtext,
  badgeColor = 'cyan',
}) => {
  // Glow class selector
  const getGlowClass = () => {
    if (!glow) return '';
    switch (glowColor) {
      case 'purple':
        return 'text-purple-200 drop-shadow-[0_0_12px_rgba(168,85,247,0.35)]';
      case 'amber':
        return 'text-amber-200 drop-shadow-[0_0_12px_rgba(245,158,11,0.45)]';
      case 'white':
        return 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]';
      case 'cyan':
      default:
        return 'text-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]';
    }
  };

  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'purple':
        return 'border border-purple-500/50 bg-purple-500/10 text-purple-300';
      case 'emerald':
        return 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-300';
      case 'cyan':
      default:
        return 'border border-cyan-500/50 bg-cyan-500/10 text-cyan-300';
    }
  };

  return (
    <div className="flex flex-col">
      {badge && (
        <div className="mb-1.5 self-start">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-mono font-semibold tracking-wider uppercase ${getBadgeStyle()}`}
          >
            {badge}
          </span>
        </div>
      )}

      <Component
        className={`font-heading font-bold tracking-tight flex items-center flex-wrap ${getGlowClass()} ${className}`}
      >
        <span>{text}</span>
      </Component>

      {subtext && (
        <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed font-sans-clean">
          {subtext}
        </p>
      )}
    </div>
  );
};

