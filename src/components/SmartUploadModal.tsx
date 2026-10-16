import React, { useState, useRef } from 'react';
import { EyewearItem } from '../types/eyewear';
import { parseExcelOrCsvFile } from '../utils/excelParser';
import { exportEyewearMasterToExcel } from '../utils/excelExporter';
import { INITIAL_VERSIONS } from '../data/sampleEyewearData';
import { UploadCloud, FileSpreadsheet, Image as ImageIcon, Sparkles, AlertCircle, Check, X, FileText, Download } from 'lucide-react';

interface Props {
  onClose: () => void;
  onImportItems: (items: EyewearItem[], createNewVersion: boolean, newVersionTitle?: string) => void;
}

export const SmartUploadModal: React.FC<Props> = ({ onClose, onImportItems }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'image' | 'paste'>('file');
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewItems, setPreviewItems] = useState<EyewearItem[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createNewVersion, setCreateNewVersion] = useState(true);
  const [newVersionTitle, setNewVersionTitle] = useState('2026供應商新送審樣品表');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 1. 處理 Excel 或 CSV 檔案上傳
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const result = await parseExcelOrCsvFile(file);
      setPreviewItems(result.items);
      setDetectedColumns(result.detectedColumns);
      if (result.items.length === 0) {
        setErrorMessage('未能從檔案中解析出任何眼鏡款式，請確認表頭是否包含品號/後製/規格等欄位。');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`解析檔案失敗：${err.message || '格式不符'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. 處理圖片/規格卡照片上傳 (Gemini OCR Multimodal)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch('/api/parse-sample', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64,
              mimeType: file.type || 'image/jpeg',
            }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'AI 辨識圖片失敗');

          const mapped: EyewearItem[] = (json.items || []).map((it: any, idx: number) => ({
            id: `img-item-${Date.now()}-${idx}`,
            sku: it.sku || `SKU-${idx + 1}`,
            name: it.name || `${it.sku || '眼鏡'} 樣品`,
            category: it.category || 'optical',
            frameShape: it.frameShape || 'wellington',
            specCode: it.specCode || `${it.lensWidth || 52}□${it.bridgeWidth || 18}-${it.templeLength || 140}`,
            lensWidth: Number(it.lensWidth) || 52,
            bridgeWidth: Number(it.bridgeWidth) || 18,
            templeLength: Number(it.templeLength) || 140,
            lensHeight: Number(it.lensHeight) || 40,
            frameWidth: Number(it.frameWidth) || 140,
            weight: Number(it.weight) || 18,
            frontMaterial: it.frontMaterial || '純鈦/醋酸板料',
            templeMaterial: it.templeMaterial || '鈦合金',
            hingeType: it.hingeType || '精密鉸鏈',
            postProcessing: it.postProcessing || 'IP真空電鍍 + 手工拋光',
            colorCode: it.colorCode || 'C1 常規色',
            lensMaterial: it.lensMaterial || 'CR-39 光學平光展示片',
            lensCoating: it.lensCoating || 'UV400 + AR膜',
            uvCategory: it.uvCategory || 'Cat.3',
            lensColor: it.lensColor || '清晰透光',
            accessories: it.accessories || '眼鏡盒、拭鏡布',
            status: 'sample_review',
            remarks: it.remarks || '',
          }));

          setPreviewItems(mapped);
          setDetectedColumns({ 圖片辨識模式: 'Gemini 3.8 Flash 視覺多模態抽取' });
        } catch (innerErr: any) {
          setErrorMessage(innerErr.message || 'AI 辨識失敗');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || '讀取圖片失敗');
      setIsProcessing(false);
    }
  };

  // 3. 處理文字貼上 (AI 辨識文字表格)
  const handleParseText = async () => {
    if (!rawText.trim()) {
      setErrorMessage('請先貼上樣品表格文字');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/parse-sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '解析失敗');

      const mapped: EyewearItem[] = (json.items || []).map((it: any, idx: number) => ({
        id: `txt-item-${Date.now()}-${idx}`,
        sku: it.sku || `SKU-${idx + 1}`,
        name: it.name || `${it.sku || '眼鏡'} 款式`,
        category: it.category || 'optical',
        frameShape: it.frameShape || 'wellington',
        specCode: it.specCode || `${it.lensWidth || 52}□${it.bridgeWidth || 18}-${it.templeLength || 140}`,
        lensWidth: Number(it.lensWidth) || 52,
        bridgeWidth: Number(it.bridgeWidth) || 18,
        templeLength: Number(it.templeLength) || 140,
        lensHeight: Number(it.lensHeight) || 40,
        frameWidth: Number(it.frameWidth) || 140,
        weight: Number(it.weight) || 18,
        frontMaterial: it.frontMaterial || '醋酸板料 / 金屬',
        templeMaterial: it.templeMaterial || '板料 / 鋼芯',
        hingeType: it.hingeType || '五金鉸鏈',
        postProcessing: it.postProcessing || '手工拋光',
        colorCode: it.colorCode || 'C1',
        lensMaterial: it.lensMaterial || 'CR-39',
        lensCoating: it.lensCoating || 'UV400',
        uvCategory: it.uvCategory || 'Cat.3',
        lensColor: it.lensColor || '透灰',
        accessories: it.accessories || '標準配件包',
        status: 'sample_review',
        remarks: it.remarks || '',
      }));

      setPreviewItems(mapped);
      setDetectedColumns({ 智能文字解析: 'Gemini 3.8 Flash 自動正規化' });
    } catch (err: any) {
      setErrorMessage(err.message || '文字解析失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  // 下載標準示範範本
  const handleDownloadTemplate = () => {
    exportEyewearMasterToExcel(INITIAL_VERSIONS[0], '眼鏡樣品總表_標準匯入範本.xlsx');
  };

  // 確定匯入
  const handleConfirmImport = () => {
    if (previewItems.length === 0) return;
    onImportItems(previewItems, createNewVersion, newVersionTitle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">上傳眼鏡樣品總表與智能格式辨識</h2>
              <p className="text-xs text-slate-400">
                支援 Excel (.xlsx, .xls)、CSV、規格紙張圖片或複製貼上雜亂樣品文字
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('file');
                setErrorMessage(null);
              }}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'file'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel / CSV 檔案
            </button>
            <button
              onClick={() => {
                setActiveTab('image');
                setErrorMessage(null);
              }}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'image'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              樣品表照片 / 掃描圖 (AI OCR)
            </button>
            <button
              onClick={() => {
                setActiveTab('paste');
                setErrorMessage(null);
              }}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'paste'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              貼上雜亂表格文字 (AI 解析)
            </button>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="pb-3 text-xs font-medium text-slate-400 hover:text-sky-300 flex items-center gap-1"
            title="下載標準格式範本"
          >
            <Download className="w-3.5 h-3.5" />
            下載標準 Excel 範本
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-sky-500/80 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl p-8 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="w-12 h-12 rounded-full bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  點擊或拖曳眼鏡樣品總表檔案至此
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  支援 .xlsx, .xls, .csv 格式。系統將自動比對表頭（品號、後製(ex.防霧、強化)、52□18-140尺寸、框型、材質等）。
                </p>
              </div>
            </div>
          )}

          {activeTab === 'image' && (
            <div className="space-y-4">
              <div
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-sky-500/80 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl p-8 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  上傳眼鏡規格表照片 / 掃描圖紙 (AI OCR)
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  透過 Gemini 3.8 Flash 視覺模型自動辨識照片中的品號、尺寸標註與後製電鍍文字。
                </p>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                貼上供應商 Email、WeChat 或 Excel 複製之文字內容：
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="例如：
品號: RB-4165F  品名: 復古波士頓  規格: 52-18-140  後製: IP真空槍黑電鍍+手工精拋  材質: 純鈦  重量: 14g
品號: OG-8802   品名: 商務眉框    規格: 54-17-142  後製: 啞光黑烤漆+銀絲印       材質: 板料+不鏽鋼..."
                className="w-full h-36 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500 resize-none"
              />
              <button
                onClick={handleParseText}
                disabled={isProcessing || !rawText.trim()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isProcessing ? 'AI 正在解析抽取規格...' : '啟動 AI 智能辨識與格式提取'}
              </button>
            </div>
          )}

          {/* Processing Spinner */}
          {isProcessing && (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <div className="text-xs font-semibold text-sky-400">正在辨識規格欄位與後製工藝...</div>
              <div className="text-[11px] text-slate-400 mt-1">
                自動解析鏡圈 A、鼻樑 DBL、鏡腿長度及表面處理工藝規範
              </div>
            </div>
          )}

          {/* Parsed Preview Section */}
          {previewItems.length > 0 && !isProcessing && (
            <div className="space-y-3 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    成功辨識出 <strong className="text-emerald-400">{previewItems.length}</strong> 款眼鏡規格
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  可於下方預覽或匯入後進行自動化錯誤檢測
                </div>
              </div>

              {/* Detected Column Mapping Tags */}
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px]">
                <span className="text-slate-400 font-medium">辨識對齊欄位：</span>
                {Object.entries(detectedColumns).map(([f, col]) => (
                  <span key={f} className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded border border-slate-700">
                    {f} ➔ {col}
                  </span>
                ))}
              </div>

              {/* Preview Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-800 text-slate-300 sticky top-0">
                    <tr>
                      <th className="p-2 font-semibold">品號</th>
                      <th className="p-2 font-semibold">品名</th>
                      <th className="p-2 font-semibold">規格代號</th>
                      <th className="p-2 font-semibold">鏡圈(A)</th>
                      <th className="p-2 font-semibold">鼻樑(DBL)</th>
                      <th className="p-2 font-semibold">鏡腿長</th>
                      <th className="p-2 font-semibold">後製(ex.防霧、強化)</th>
                      <th className="p-2 font-semibold">材質</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {previewItems.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 text-slate-300">
                        <td className="p-2 font-mono font-bold text-sky-400">{it.sku}</td>
                        <td className="p-2">{it.name}</td>
                        <td className="p-2 font-mono text-emerald-400">{it.specCode}</td>
                        <td className="p-2 font-mono">{it.lensWidth}mm</td>
                        <td className="p-2 font-mono">{it.bridgeWidth}mm</td>
                        <td className="p-2 font-mono">{it.templeLength}mm</td>
                        <td className="p-2 text-amber-300/90 truncate max-w-xs">{it.postProcessing}</td>
                        <td className="p-2 truncate max-w-xs">{it.frontMaterial}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import Options */}
              <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300">版本控制選項：</div>
                <div className="flex flex-col sm:flex-row gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="versionMode"
                      checked={createNewVersion}
                      onChange={() => setCreateNewVersion(true)}
                      className="text-sky-500 focus:ring-sky-500"
                    />
                    <span className="text-white font-medium">建立為全新樣品版本 (推薦，保留歷史紀錄)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="versionMode"
                      checked={!createNewVersion}
                      onChange={() => setCreateNewVersion(false)}
                      className="text-sky-500 focus:ring-sky-500"
                    />
                    <span className="text-slate-300">直接追加至當前作用中版本</span>
                  </label>
                </div>

                {createNewVersion && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">新版本說明標題：</label>
                    <input
                      type="text"
                      value={newVersionTitle}
                      onChange={(e) => setNewVersionTitle(e.target.value)}
                      placeholder="例：2026供應商第二次修訂樣品總表"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
          >
            取消
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={previewItems.length === 0}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md"
          >
            <Check className="w-4 h-4" />
            確認匯入 {previewItems.length > 0 ? `(${previewItems.length} 款)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
