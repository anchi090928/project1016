import React from 'react';
import { EyewearItem } from '../types/eyewear';
import { X, Check, ArrowRightLeft, Layers, Sparkles, Scale, Ruler } from 'lucide-react';
import { EyewearBlueprintDiagram } from './EyewearBlueprintDiagram';

interface Props {
  items: EyewearItem[];
  onClose: () => void;
  onRemoveItem?: (id: string) => void;
}

export const EyewearComparisonModal: React.FC<Props> = ({ items, onClose, onRemoveItem }) => {
  if (items.length === 0) return null;

  // 比較項目清單
  const compareFields: Array<{
    key: keyof EyewearItem;
    label: string;
    category: 'basic' | 'dimension' | 'craft' | 'lens';
    formatter?: (val: any) => string;
  }> = [
    { key: 'category', label: '款式類別', category: 'basic' },
    { key: 'frameShape', label: '框型設計', category: 'basic' },
    { key: 'specCode', label: '標準規格 (A□DBL-Temple)', category: 'dimension' },
    { key: 'lensWidth', label: '鏡圈寬度 A (mm)', category: 'dimension', formatter: (v) => `${v} mm` },
    { key: 'bridgeWidth', label: '鼻樑寬度 DBL (mm)', category: 'dimension', formatter: (v) => `${v} mm` },
    { key: 'templeLength', label: '鏡腿長度 (mm)', category: 'dimension', formatter: (v) => `${v} mm` },
    { key: 'lensHeight', label: '鏡圈高度 B (mm)', category: 'dimension', formatter: (v) => `${v} mm` },
    { key: 'frameWidth', label: '鏡框總面寬 (mm)', category: 'dimension', formatter: (v) => `${v} mm` },
    { key: 'weight', label: '鏡架實重 (g)', category: 'dimension', formatter: (v) => `${v} g` },
    { key: 'frontMaterial', label: '前框材質', category: 'craft' },
    { key: 'templeMaterial', label: '鏡腿材質', category: 'craft' },
    { key: 'hingeType', label: '鉸鏈結構', category: 'craft' },
    { key: 'postProcessing', label: '後製(ex.防霧、強化)', category: 'craft' },
    { key: 'colorCode', label: '色號與塗裝顏色', category: 'craft' },
    { key: 'lensMaterial', label: '鏡片基材', category: 'lens' },
    { key: 'lensCoating', label: '鏡片鍍膜防護', category: 'lens' },
    { key: 'uvCategory', label: '遮光等級', category: 'lens' },
    { key: 'accessories', label: '樣品配件包裝', category: 'basic' },
    { key: 'status', label: '樣品進度狀態', category: 'basic' },
  ];

  // 判斷某個屬性是否所有選取的眼鏡完全相同
  const isFieldUniform = (key: keyof EyewearItem) => {
    if (items.length <= 1) return true;
    const firstVal = String(items[0][key] ?? '').trim().toLowerCase();
    return items.every((it) => String(it[key] ?? '').trim().toLowerCase() === firstVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-7xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                各類眼鏡詳細規格比對矩陣
                <span className="text-xs px-2 py-0.5 font-normal bg-sky-950 text-sky-300 border border-sky-800 rounded-full">
                  已選 {items.length} 款
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                黃色標籤標示各眼鏡規格差異項，藍色表示相同標準
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Comparison Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Eyewear Spec Blueprint Mini-Gallery */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-sky-400" />
              規格結構圖對照 (Standard Blueprint Projection)
            </h3>
            <div className={`grid gap-4 ${items.length === 2 ? 'grid-cols-1 md:grid-cols-2' : items.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
              {items.map((it) => (
                <div key={it.id} className="relative group">
                  {onRemoveItem && (
                    <button
                      onClick={() => onRemoveItem(it.id)}
                      className="absolute top-2 right-2 z-10 p-1 bg-slate-800/80 hover:bg-rose-500/80 text-slate-400 hover:text-white rounded-md transition-colors"
                      title="移除此款比對"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <EyewearBlueprintDiagram item={it} />
                </div>
              ))}
            </div>
          </div>

          {/* Dimension Metric Bar Comparison */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              關鍵尺寸與克重對比柱狀圖 (Dimension & Weight Metric)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 鏡圈寬度 A */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>鏡圈寬度 A (Lens Width)</span>
                  <span className="text-slate-500">標準 45~60 mm</span>
                </div>
                {items.map((it) => {
                  const pct = Math.min(100, Math.max(10, ((it.lensWidth || 45) / 65) * 100));
                  return (
                    <div key={it.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono text-slate-300 font-semibold">{it.sku}</span>
                        <span className="font-mono text-sky-400 font-bold">{it.lensWidth} mm</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 鏡腿長度 Temple */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>鏡腿長度 (Temple Length)</span>
                  <span className="text-slate-500">標準 135~145 mm</span>
                </div>
                {items.map((it) => {
                  const pct = Math.min(100, Math.max(10, (((it.templeLength || 135) - 120) / 40) * 100));
                  return (
                    <div key={it.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono text-slate-300 font-semibold">{it.sku}</span>
                        <span className="font-mono text-emerald-400 font-bold">{it.templeLength} mm</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 鏡框重量 Weight */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>鏡框重量 (Frame Weight)</span>
                  <span className="text-slate-500">超輕鈦 12g / 膠框 26g</span>
                </div>
                {items.map((it) => {
                  const pct = Math.min(100, Math.max(10, ((it.weight || 15) / 40) * 100));
                  return (
                    <div key={it.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono text-slate-300 font-semibold">{it.sku}</span>
                        <span className="font-mono text-amber-400 font-bold">{it.weight} g</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Deep Spec Detailed Matrix Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/90 text-slate-300 border-b border-slate-700">
                    <th className="p-3 font-semibold w-48 sticky left-0 bg-slate-800/95 z-10">
                      詳細規格欄位
                    </th>
                    {items.map((it) => (
                      <th key={it.id} className="p-3 font-mono font-bold text-sky-400 min-w-56 border-l border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white">{it.sku}</span>
                          <span className="text-xs font-normal text-slate-400">{it.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {compareFields.map((field) => {
                    const isUniform = isFieldUniform(field.key);
                    const isPostProcessing = field.key === 'postProcessing';

                    return (
                      <tr
                        key={field.key}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          !isUniform ? 'bg-amber-950/15' : ''
                        }`}
                      >
                        <td className="p-3 font-medium text-slate-400 sticky left-0 bg-slate-900/90 z-10 border-r border-slate-800 flex items-center justify-between">
                          <span>{field.label}</span>
                          {!isUniform ? (
                            <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                              差異
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                              一致
                            </span>
                          )}
                        </td>

                        {items.map((it) => {
                          const val = it[field.key];
                          const displayVal = field.formatter ? field.formatter(val) : String(val ?? '-');

                          return (
                            <td
                              key={it.id}
                              className={`p-3 border-l border-slate-800/80 ${
                                isPostProcessing ? 'font-semibold text-amber-200 leading-relaxed' : 'text-slate-200'
                              } ${!isUniform ? 'font-medium' : ''}`}
                            >
                              {displayVal}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
              規格差異項 (重點比對)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400/80 inline-block" />
              共通相符規格
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors"
          >
            關閉比對視窗
          </button>
        </div>
      </div>
    </div>
  );
};
