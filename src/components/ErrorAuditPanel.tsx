import React, { useState } from 'react';
import { EyewearItem, ValidationError, AIAuditResult } from '../types/eyewear';
import { validateAllEyewear, applyAutoFix } from '../utils/validation';
import { AlertTriangle, AlertOctagon, Info, CheckCircle, Sparkles, Wrench, RefreshCw, Eye } from 'lucide-react';

interface Props {
  items: EyewearItem[];
  onUpdateItems: (newItems: EyewearItem[]) => void;
  onEditItem: (item: EyewearItem) => void;
}

export const ErrorAuditPanel: React.FC<Props> = ({ items, onUpdateItems, onEditItem }) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [isAiAuditing, setIsAiAuditing] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<AIAuditResult | null>(null);
  const [aiAuditError, setAiAuditError] = useState<string | null>(null);

  const errorMap = validateAllEyewear(items);

  // 計算統計指標
  let criticalCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  let autoFixableCount = 0;
  let itemsWithErrorsCount = 0;

  items.forEach((item) => {
    const errs = errorMap.get(item.id) || [];
    if (errs.length > 0) itemsWithErrorsCount++;
    errs.forEach((e) => {
      if (e.type === 'critical') criticalCount++;
      else if (e.type === 'warning') warningCount++;
      else if (e.type === 'info') infoCount++;
      if (e.autoFixable) autoFixableCount++;
    });
  });

  const totalErrors = criticalCount + warningCount + infoCount;
  const passRate = items.length > 0 ? Math.round(((items.length - itemsWithErrorsCount) / items.length) * 100) : 100;

  // 執行全數一鍵自動修復
  const handleBatchAutoFix = () => {
    const updatedItems = items.map((item) => {
      let cur = { ...item };
      const errs = errorMap.get(item.id) || [];
      errs.forEach((err) => {
        if (err.autoFixable) {
          cur = applyAutoFix(cur, err);
        }
      });
      return cur;
    });
    onUpdateItems(updatedItems);
  };

  // 單款自動修復
  const handleSingleFix = (item: EyewearItem, err: ValidationError) => {
    const fixed = applyAutoFix(item, err);
    const updatedItems = items.map((it) => (it.id === item.id ? fixed : it));
    onUpdateItems(updatedItems);
  };

  // 呼叫伺服器端 Gemini 3.8 Flash 進行深層眼鏡工藝審查
  const handleRunAiAudit = async () => {
    setIsAiAuditing(true);
    setAiAuditError(null);
    try {
      const response = await fetch('/api/ai-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((it) => ({
            sku: it.sku,
            name: it.name,
            specCode: it.specCode,
            lensWidth: it.lensWidth,
            bridgeWidth: it.bridgeWidth,
            templeLength: it.templeLength,
            lensHeight: it.lensHeight,
            frameWidth: it.frameWidth,
            weight: it.weight,
            frontMaterial: it.frontMaterial,
            postProcessing: it.postProcessing,
            lensMaterial: it.lensMaterial,
            shape: it.frameShape,
          })),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'AI 審查失敗');
      }

      const data: AIAuditResult = await response.json();
      setAiAuditResult(data);
    } catch (err: any) {
      console.error(err);
      setAiAuditError(err?.message || 'AI 規格檢測執行失敗');
    } finally {
      setIsAiAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>規格合格率</span>
            <span className="p-1 bg-emerald-500/10 text-emerald-400 rounded">
              <CheckCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{passRate}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {items.length - itemsWithErrorsCount} / {items.length} 款完全無誤
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>嚴重錯誤 (Critical)</span>
            <span className="p-1 bg-rose-500/10 text-rose-400 rounded">
              <AlertOctagon className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{criticalCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">缺品號/缺後製或尺寸嚴重矛盾</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>後製警示 (Warning)</span>
            <span className="p-1 bg-amber-500/10 text-amber-400 rounded">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{warningCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">防霧/強化工藝衝突或尺寸偏離</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>格式優化 (Info)</span>
            <span className="p-1 bg-sky-500/10 text-sky-400 rounded">
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400">{infoCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">方框標號可標準化</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm col-span-2 sm:col-span-1 flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">可自動修復數</div>
            <div className="text-2xl font-bold font-mono text-indigo-400">{autoFixableCount}</div>
          </div>
          <button
            onClick={handleBatchAutoFix}
            disabled={autoFixableCount === 0}
            className="w-full mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5" />
            一鍵自動修復 ({autoFixableCount})
          </button>
        </div>
      </div>

      {/* AI Deep Spec Audit Action Bar */}
      <div className="p-4 bg-gradient-to-r from-sky-950/60 via-indigo-950/60 to-purple-950/60 border border-sky-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/20 text-sky-300 rounded-xl border border-sky-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Gemini AI 眼鏡模具與後製(ex.防霧、強化)深層衝突檢測
              <span className="text-[10px] px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded font-normal border border-sky-500/40">
                gemini-3.8-flash
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              智能分析材質與表面處理之耐溫性、裝配咬合應力、無框破片風險及國際鏡光標註合理性
            </p>
          </div>
        </div>

        <button
          onClick={handleRunAiAudit}
          disabled={isAiAuditing}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
        >
          {isAiAuditing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              AI 智能審查中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              啟動 AI 工藝深層審查
            </>
          )}
        </button>
      </div>

      {/* AI Audit Results Container */}
      {aiAuditError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs">
          ⚠️ {aiAuditError}
        </div>
      )}

      {aiAuditResult && (
        <div className="bg-slate-900 border border-sky-500/40 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-sky-400">
                AI 工藝專家審查報告
              </span>
              <span className="px-2 py-0.5 bg-sky-950 text-sky-300 text-xs font-mono font-bold rounded border border-sky-800">
                綜合健康評分: {aiAuditResult.overallHealthScore} / 100
              </span>
            </div>
            <button
              onClick={() => setAiAuditResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              隱藏報告
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            {aiAuditResult.generalObservations}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiAuditResult.itemAudits.map((audit) => (
              <div
                key={audit.sku}
                className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                  audit.status === 'critical'
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    : audit.status === 'warning'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="font-mono text-sm">{audit.sku}</span>
                  <span className="uppercase text-[10px] px-2 py-0.5 rounded font-mono">
                    {audit.status}
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  {audit.findings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
                {audit.recommendation && (
                  <div className="pt-1 text-[11px] font-medium text-sky-300 border-t border-slate-800/80">
                    💡 建議對策：{audit.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs & Error List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterSeverity === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              全部檢測問題 ({totalErrors})
            </button>
            <button
              onClick={() => setFilterSeverity('critical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterSeverity === 'critical'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-950/30 text-rose-300 hover:bg-rose-950/50 border border-rose-800/40'
              }`}
            >
              嚴重錯誤 ({criticalCount})
            </button>
            <button
              onClick={() => setFilterSeverity('warning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterSeverity === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-950/30 text-amber-300 hover:bg-amber-950/50 border border-amber-800/40'
              }`}
            >
              工藝警示 ({warningCount})
            </button>
            <button
              onClick={() => setFilterSeverity('info')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterSeverity === 'info'
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-950/30 text-sky-300 hover:bg-sky-950/50 border border-sky-800/40'
              }`}
            >
              格式提示 ({infoCount})
            </button>
          </div>
        </div>

        {/* Issue Cards */}
        {totalErrors === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">樣品總表完全無錯誤！</h3>
            <p className="text-xs text-slate-400">
              品號、後製工藝、52□18-140 國際標註及幾何尺寸全部符合標準，隨時可匯出量產 Excel。
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const allItemErrors = errorMap.get(item.id) || [];
              const itemErrors = allItemErrors.filter((e) =>
                filterSeverity === 'all' ? true : e.type === filterSeverity
              );

              if (itemErrors.length === 0) return null;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sky-400 text-sm bg-slate-800 px-2 py-0.5 rounded">
                        {item.sku || '【缺失品號】'}
                      </span>
                      <span className="text-xs text-white font-medium">{item.name}</span>
                      <span className="text-[11px] text-slate-400">
                        ({item.frontMaterial} | {item.specCode || '無規格'})
                      </span>
                    </div>

                    <button
                      onClick={() => onEditItem(item)}
                      className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      編輯修正此款
                    </button>
                  </div>

                  {/* Errors List */}
                  <div className="grid gap-2">
                    {itemErrors.map((err) => (
                      <div
                        key={err.id}
                        className={`p-3 rounded-lg border flex items-start justify-between gap-3 text-xs ${
                          err.type === 'critical'
                            ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                            : err.type === 'warning'
                            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                            : 'bg-sky-950/20 border-sky-500/30 text-sky-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                err.type === 'critical'
                                  ? 'bg-rose-900 text-rose-200'
                                  : err.type === 'warning'
                                  ? 'bg-amber-900 text-amber-200'
                                  : 'bg-sky-900 text-sky-200'
                              }`}
                            >
                              {err.fieldLabel}
                            </span>
                            <span className="font-semibold text-slate-200">{err.message}</span>
                          </div>
                          {err.suggestion && (
                            <p className="text-[11px] text-slate-400 pl-0.5">
                              💡 建議修正：{err.suggestion}
                            </p>
                          )}
                        </div>

                        {err.autoFixable && (
                          <button
                            onClick={() => handleSingleFix(item, err)}
                            className="shrink-0 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-[11px] transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Wrench className="w-3 h-3" />
                            修復為 {String(err.suggestedValue)}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
