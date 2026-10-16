import React from 'react';
import { EyewearItem } from '../types/eyewear';

interface Props {
  item: EyewearItem;
  className?: string;
}

export const EyewearBlueprintDiagram: React.FC<Props> = ({ item, className = '' }) => {
  const { lensWidth, bridgeWidth, templeLength, lensHeight, frameWidth, weight, specCode, frameShape } = item;

  // 取得框型 SVG 繪製特徵
  const isAviator = frameShape === 'aviator';
  const isCatEye = frameShape === 'cat_eye';
  const isRound = frameShape === 'round' || frameShape === 'boston';
  const isBrowline = frameShape === 'browline';
  const isRimless = frameShape === 'rimless';

  return (
    <div className={`bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-700/60 shadow-lg ${className}`}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded">
            OPTICAL BLUEPRINT
          </span>
          <span className="text-sm font-semibold tracking-wide text-slate-200">
            {item.sku} 工業規格工程圖解
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400">國際規格標準：</div>
          <span className="text-base font-mono font-bold text-sky-400 tracking-wider bg-sky-950/80 px-2.5 py-0.5 rounded border border-sky-800">
            {specCode || `${lensWidth || 0}□${bridgeWidth || 0}-${templeLength || 0}`}
          </span>
        </div>
      </div>

      {/* SVG Blueprint */}
      <div className="relative w-full overflow-hidden bg-slate-950/80 rounded-lg p-4 border border-slate-800/80">
        {/* Blueprint Grid pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #38bdf8 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        <svg viewBox="0 0 540 220" className="w-full h-auto max-h-56 select-none">
          <defs>
            {/* Blueprint glow filter */}
            <filter id="blue-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Arrow marker */}
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
            </marker>
            <marker id="arrow-emerald" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
            </marker>
          </defs>

          {/* Left Temple (鏡腿投影) */}
          <path
            d="M 55 90 C 40 85, 25 70, 20 50 C 18 45, 18 35, 22 25"
            fill="none"
            stroke="#64748b"
            strokeWidth="3"
            strokeDasharray="4 2"
          />
          {/* Right Temple (鏡腿投影) */}
          <path
            d="M 485 90 C 500 85, 515 70, 520 50 C 522 45, 522 35, 518 25"
            fill="none"
            stroke="#64748b"
            strokeWidth="3"
            strokeDasharray="4 2"
          />

          {/* Eyewear Frame Front */}
          {/* Bridge (中樑/鼻橋) */}
          <path
            d={isAviator ? "M 235 78 C 270 70, 270 70, 305 78 M 235 95 C 270 90, 270 90, 305 95" : "M 235 88 C 270 76, 270 76, 305 88"}
            fill="none"
            stroke={isRimless ? "#38bdf8" : "#94a3b8"}
            strokeWidth={isRimless ? "2.5" : "3.5"}
            strokeLinecap="round"
          />

          {/* Nose pads (鼻墊) */}
          <ellipse cx="242" cy="110" rx="3" ry="8" transform="rotate(-15 242 110)" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
          <ellipse cx="298" cy="110" rx="3" ry="8" transform="rotate(15 298 110)" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />

          {/* Left Lens Frame (左鏡圈) */}
          <g transform="translate(60, 50)">
            {isBrowline && (
              <path d="M 0 35 C 10 5, 140 0, 175 35 L 175 42 C 140 10, 10 15, 0 42 Z" fill="#475569" />
            )}
            <rect
              x="5"
              y="10"
              width="165"
              height="100"
              rx={isRound ? "50" : isCatEye ? "25" : isAviator ? "40" : "18"}
              ry={isRound ? "48" : isCatEye ? "38" : isAviator ? "45" : "18"}
              fill="rgba(56, 189, 248, 0.08)"
              stroke={isRimless ? "#38bdf8" : "#e2e8f0"}
              strokeWidth={isRimless ? "1.5" : "3.5"}
              strokeDasharray={isRimless ? "4 2" : "none"}
            />
            {/* Lens Reflection Line */}
            <path d="M 30 25 L 85 95" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeLinecap="round" />
            <path d="M 45 25 L 100 95" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Right Lens Frame (右鏡圈) */}
          <g transform="translate(315, 50)">
            {isBrowline && (
              <path d="M 0 35 C 35 0, 165 5, 175 35 L 175 42 C 165 15, 35 10, 0 42 Z" fill="#475569" />
            )}
            <rect
              x="5"
              y="10"
              width="165"
              height="100"
              rx={isRound ? "50" : isCatEye ? "25" : isAviator ? "40" : "18"}
              ry={isRound ? "48" : isCatEye ? "38" : isAviator ? "45" : "18"}
              fill="rgba(56, 189, 248, 0.08)"
              stroke={isRimless ? "#38bdf8" : "#e2e8f0"}
              strokeWidth={isRimless ? "1.5" : "3.5"}
              strokeDasharray={isRimless ? "4 2" : "none"}
            />
            {/* Lens Reflection Line */}
            <path d="M 30 25 L 85 95" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeLinecap="round" />
            <path d="M 45 25 L 100 95" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Hinge / Endpiece (莊頭加固) */}
          <rect x="52" y="85" width="13" height="8" rx="2" fill="#94a3b8" />
          <circle cx="58" cy="89" r="1.5" fill="#1e293b" />
          <rect x="475" y="85" width="13" height="8" rx="2" fill="#94a3b8" />
          <circle cx="482" cy="89" r="1.5" fill="#1e293b" />

          {/* ===== DIMENSION ANNOTATIONS (尺寸標註引線) ===== */}

          {/* 1. Lens Width A (鏡圈寬度) - Under Left Lens */}
          <g>
            <line x1="65" y1="170" x2="230" y2="170" stroke="#38bdf8" strokeWidth="1.5" markerStart="url(#arrow-blue)" markerEnd="url(#arrow-blue)" />
            <line x1="65" y1="160" x2="65" y2="178" stroke="#0284c7" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="230" y1="160" x2="230" y2="178" stroke="#0284c7" strokeWidth="1" strokeDasharray="2 2" />
            <rect x="110" y="180" width="75" height="22" rx="4" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
            <text x="147" y="195" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              A {lensWidth || '--'} mm
            </text>
          </g>

          {/* 2. Bridge Width DBL (鼻樑寬度) - Between Lenses */}
          <g>
            <line x1="232" y1="140" x2="318" y2="140" stroke="#f59e0b" strokeWidth="1.5" markerStart="url(#arrow-amber)" markerEnd="url(#arrow-amber)" />
            <line x1="232" y1="95" x2="232" y2="148" stroke="#b45309" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="318" y1="95" x2="318" y2="148" stroke="#b45309" strokeWidth="1" strokeDasharray="2 2" />
            <rect x="245" y="148" width="60" height="22" rx="4" fill="#0f172a" stroke="#b45309" strokeWidth="1" />
            <text x="275" y="163" fill="#f59e0b" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              DBL {bridgeWidth || '--'}
            </text>
          </g>

          {/* 3. Lens Height B (鏡圈高度) - Right Side of Right Lens */}
          <g>
            <line x1="495" y1="60" x2="495" y2="160" stroke="#10b981" strokeWidth="1.5" markerStart="url(#arrow-emerald)" markerEnd="url(#arrow-emerald)" />
            <line x1="480" y1="60" x2="505" y2="60" stroke="#059669" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="480" y1="160" x2="505" y2="160" stroke="#059669" strokeWidth="1" strokeDasharray="2 2" />
            <rect x="470" y="168" width="55" height="22" rx="4" fill="#0f172a" stroke="#059669" strokeWidth="1" />
            <text x="497" y="183" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              B {lensHeight || '--'}
            </text>
          </g>

          {/* 4. Total Frame Width (鏡框總面寬) - Top dimension line */}
          <g>
            <line x1="55" y1="20" x2="485" y2="20" stroke="#94a3b8" strokeWidth="1.5" markerStart="url(#arrow-blue)" markerEnd="url(#arrow-blue)" />
            <line x1="55" y1="15" x2="55" y2="85" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="485" y1="15" x2="485" y2="85" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
            <rect x="220" y="8" width="100" height="22" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <text x="270" y="23" fill="#e2e8f0" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              總寬 {frameWidth || (lensWidth * 2 + bridgeWidth + 8)} mm
            </text>
          </g>
        </svg>
      </div>

      {/* Engineering Specs Detail Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
          <span className="text-slate-400 block mb-0.5">鏡腿長度 (Temple)</span>
          <span className="text-sm font-mono font-bold text-white">{templeLength} mm</span>
        </div>
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
          <span className="text-slate-400 block mb-0.5">實測克重 (Weight)</span>
          <span className="text-sm font-mono font-bold text-white">{weight} g</span>
        </div>
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
          <span className="text-slate-400 block mb-0.5">前框材質 (Material)</span>
          <span className="text-sm font-semibold text-sky-300 truncate block" title={item.frontMaterial}>
            {item.frontMaterial || '未指定'}
          </span>
        </div>
        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
          <span className="text-slate-400 block mb-0.5">鉸鏈型式 (Hinge)</span>
          <span className="text-sm font-semibold text-amber-300 truncate block" title={item.hingeType}>
            {item.hingeType || '未指定'}
          </span>
        </div>
      </div>

      {/* Post-Processing (後製: ex.防霧、強化) Highlight Banner */}
      <div className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <span className="text-amber-400 font-bold text-xs shrink-0 mt-0.5">⚙️ 後製(ex.防霧、強化)：</span>
          <span className="text-xs text-amber-200/90 font-medium leading-relaxed">
            {item.postProcessing || '尚未填寫後製(ex.防霧、強化)'}
          </span>
        </div>
      </div>
    </div>
  );
};
