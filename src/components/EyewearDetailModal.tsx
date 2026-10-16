import React, { useState } from 'react';
import { EyewearItem } from '../types/eyewear';
import { validateEyewearItem } from '../utils/validation';
import { EyewearBlueprintDiagram } from './EyewearBlueprintDiagram';
import { X, Save, Trash2, Wand2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  item: EyewearItem;
  allItems: EyewearItem[];
  onSave: (updatedItem: EyewearItem) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const EyewearDetailModal: React.FC<Props> = ({ item, allItems, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState<EyewearItem>({ ...item });
  const [activeTab, setActiveTab] = useState<'form' | 'blueprint'>('form');

  const currentErrors = validateEyewearItem(formData, allItems);

  const handleChange = (field: keyof EyewearItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 一鍵自動由 A、DBL、Temple 規格代碼生成 52□18-140
  const handleAutoSpecCode = () => {
    if (formData.lensWidth > 0 && formData.bridgeWidth > 0 && formData.templeLength > 0) {
      handleChange('specCode', `${formData.lensWidth}□${formData.bridgeWidth}-${formData.templeLength}`);
    }
  };

  // 自動依 A 和 DBL 重新計算建議總寬
  const handleAutoFrameWidth = () => {
    if (formData.lensWidth > 0 && formData.bridgeWidth > 0) {
      handleChange('frameWidth', formData.lensWidth * 2 + formData.bridgeWidth + 8);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sky-400 bg-sky-950 px-2.5 py-1 rounded border border-sky-800 text-sm">
              {formData.sku || '新建樣品'}
            </span>
            <div>
              <h2 className="text-base font-bold text-white">{formData.name || '眼鏡詳細規格檢視與編輯'}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>後製工藝與工業尺寸精確校驗</span>
                {currentErrors.length > 0 ? (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {currentErrors.length} 項檢驗警示
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    規格合規通過
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'form' ? 'blueprint' : 'form')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
            >
              {activeTab === 'form' ? '切換藍圖視圖' : '切換表單視圖'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'blueprint' ? (
            <div className="space-y-4">
              <EyewearBlueprintDiagram item={formData} />
              <div className="text-center text-xs text-slate-400">
                可點擊上方「切換表單視圖」直接調整各項幾何參數，藍圖將即時重繪。
              </div>
            </div>
          ) : (
            <form id="eyewear-detail-form" onSubmit={handleFormSubmit} className="space-y-6">
              {/* Errors Alert Box */}
              {currentErrors.length > 0 && (
                <div className="p-3 bg-amber-950/30 border border-amber-600/40 rounded-xl space-y-1.5 text-xs">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    自動化錯誤檢測提醒：
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-amber-200/90 pl-1">
                    {currentErrors.map((err) => (
                      <li key={err.id}>
                        <strong>[{err.fieldLabel}]</strong> {err.message}
                        {err.suggestion && <span className="text-slate-400"> (建議: {err.suggestion})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 1. 基本資訊與品號 (Basic & SKU) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  基本識別與分類 (Basic Information)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      品號 (SKU) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => handleChange('sku', e.target.value)}
                      placeholder="例：RB-4165F"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      品名 / 款式系列
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="例：經典波士頓復古鏡架"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      款式類別
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="optical">光學鏡框 (Optical)</option>
                      <option value="sunglasses">太陽眼鏡 (Sunglasses)</option>
                      <option value="sports">運動風鏡 (Sports)</option>
                      <option value="reading">老花閱讀鏡 (Reading)</option>
                      <option value="kids">兒童鏡框 (Kids)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. 框型與尺寸工程規格 (Dimensions & Blueprint Specs) */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    尺寸規格 (Dimensions: A□DBL-Temple)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoSpecCode}
                      className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800"
                    >
                      <Wand2 className="w-3 h-3" />
                      自動生成方框規格標註
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoFrameWidth}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800"
                    >
                      <Wand2 className="w-3 h-3" />
                      幾何試算總寬
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      標準規格代碼
                    </label>
                    <input
                      type="text"
                      value={formData.specCode}
                      onChange={(e) => handleChange('specCode', e.target.value)}
                      placeholder="52□18-140"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-sky-400 font-mono font-bold focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      鏡圈寬 A (mm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.lensWidth || ''}
                      onChange={(e) => handleChange('lensWidth', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      鼻樑寬 DBL (mm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.bridgeWidth || ''}
                      onChange={(e) => handleChange('bridgeWidth', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      鏡腿長 (mm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formData.templeLength || ''}
                      onChange={(e) => handleChange('templeLength', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      鏡圈高 B (mm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.lensHeight || ''}
                      onChange={(e) => handleChange('lensHeight', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      總面寬 (mm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.frameWidth || ''}
                      onChange={(e) => handleChange('frameWidth', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      重量 (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight || ''}
                      onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. 後製(ex.防霧、強化) (Post-Processing & Treatments) */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    後製(ex.防霧、強化) (Post-Processing & Treatments)
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">快速範本：</span>
                    <button
                      type="button"
                      onClick={() => handleChange('postProcessing', '雙面奈米防霧鍍膜 + 高耐磨強化加硬 (4H)')}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-sky-300 px-2 py-0.5 rounded border border-slate-700"
                    >
                      防霧+強化
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('postProcessing', '鏡片強化加硬 + AR防反射鍍膜 + 疏水抗油污')}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-0.5 rounded border border-slate-700"
                    >
                      強化加硬+AR
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      後製(ex.防霧、強化)描述 <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.postProcessing}
                      onChange={(e) => handleChange('postProcessing', e.target.value)}
                      placeholder="例：雙面奈米防霧鍍膜 + 鏡片高耐磨強化加硬 (4H) + IP真空超耐磨電鍍"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-200 font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      色號與塗裝顏色
                    </label>
                    <input
                      type="text"
                      value={formData.colorCode}
                      onChange={(e) => handleChange('colorCode', e.target.value)}
                      placeholder="例：C1 啞光槍金黑 / 透灰腳套"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      框型設計 (Frame Shape)
                    </label>
                    <select
                      value={formData.frameShape}
                      onChange={(e) => handleChange('frameShape', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="wellington">威靈頓 (Wellington)</option>
                      <option value="boston">波士頓 (Boston)</option>
                      <option value="aviator">飛行員雙樑 (Aviator)</option>
                      <option value="cat_eye">貓眼 (Cat-Eye)</option>
                      <option value="browline">眉架半框 (Browline)</option>
                      <option value="round">圓框 (Round)</option>
                      <option value="square">方框 (Square)</option>
                      <option value="polygon">多角幾何 (Polygon)</option>
                      <option value="rimless">無框 (Rimless)</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. 材質與鏡片 (Materials & Lens Specs) */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  材質與鏡片規格 (Materials & Optical Lens)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      前框材質
                    </label>
                    <input
                      type="text"
                      value={formData.frontMaterial}
                      onChange={(e) => handleChange('frontMaterial', e.target.value)}
                      placeholder="例：日本純鈦 / 義大利板料"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      鏡腿材質
                    </label>
                    <input
                      type="text"
                      value={formData.templeMaterial}
                      onChange={(e) => handleChange('templeMaterial', e.target.value)}
                      placeholder="例：高彈性 β-鈦"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      鉸鏈結構
                    </label>
                    <input
                      type="text"
                      value={formData.hingeType}
                      onChange={(e) => handleChange('hingeType', e.target.value)}
                      placeholder="例：無螺絲一體嵌合 / 彈簧鉸鏈"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      鏡片材質
                    </label>
                    <input
                      type="text"
                      value={formData.lensMaterial}
                      onChange={(e) => handleChange('lensMaterial', e.target.value)}
                      placeholder="例：偏光 TAC / CR-39 / PC 防爆片"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      鏡片鍍膜防護
                    </label>
                    <input
                      type="text"
                      value={formData.lensCoating}
                      onChange={(e) => handleChange('lensCoating', e.target.value)}
                      placeholder="例：UV400 + AR防反射膜 + 防潑水"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      樣品進度狀態
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="sample_review">樣品初審中 (Review)</option>
                      <option value="revision_needed">需修正樣品 (Revision)</option>
                      <option value="approved">已核可封樣 (Approved)</option>
                      <option value="mass_production">進入量產 (Mass Prod)</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`確定要刪除品號 [${formData.sku}] 嗎？`)) {
                    onDelete(formData.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg font-medium transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                刪除此款
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              form="eyewear-detail-form"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4" />
              儲存規格變更
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
