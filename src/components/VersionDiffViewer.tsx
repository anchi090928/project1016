import React, { useState } from 'react';
import { EyewearVersion } from '../types/eyewear';
import { compareVersions } from '../utils/versionControl';
import { GitCompare, PlusCircle, MinusCircle, Edit3, ArrowRight, CheckCircle2, History } from 'lucide-react';

interface Props {
  versions: EyewearVersion[];
  currentVersionId: string;
  onClose: () => void;
  onSelectVersion: (versionId: string) => void;
}

export const VersionDiffViewer: React.FC<Props> = ({ versions, currentVersionId, onClose, onSelectVersion }) => {
  const [baseVerId, setBaseVerId] = useState<string>(
    versions.length > 1 ? versions[versions.length - 1].id : versions[0]?.id || ''
  );
  const [targetVerId, setTargetVerId] = useState<string>(
    versions[0]?.id || ''
  );
  const [filterType, setFilterType] = useState<'all' | 'added' | 'removed' | 'modified'>('all');

  const baseVer = versions.find((v) => v.id === baseVerId) || versions[0];
  const targetVer = versions.find((v) => v.id === targetVerId) || versions[0];

  const diffResult = compareVersions(baseVer, targetVer);

  const filteredModified = diffResult.modified;
  const filteredAdded = diffResult.added;
  const filteredRemoved = diffResult.removed;

  const totalChanges = filteredAdded.length + filteredRemoved.length + filteredModified.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                樣品總表版本控制與變更追蹤 (Version Diff Viewer)
              </h2>
              <p className="text-xs text-slate-400">
                精確追蹤不同送審版本間之品號增減、規格尺寸微調及後製(ex.防霧、強化)變更
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
          >
            關閉
          </button>
        </div>

        {/* Version Pickers Bar */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">基準版本 (Base Version)</label>
              <select
                value={baseVerId}
                onChange={(e) => setBaseVerId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-purple-500"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.versionNumber} - {v.title} ({v.items.length} 款)
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-5 text-slate-500">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">比對目標版本 (Target Version)</label>
              <select
                value={targetVerId}
                onChange={(e) => setTargetVerId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-purple-500"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.versionNumber} - {v.title} ({v.items.length} 款)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                filterType === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              全部變更 ({totalChanges})
            </button>
            <button
              onClick={() => setFilterType('added')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                filterType === 'added'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/60 border border-emerald-800/50'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              新增 ({diffResult.added.length})
            </button>
            <button
              onClick={() => setFilterType('modified')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                filterType === 'modified'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-950/40 text-amber-300 hover:bg-amber-950/60 border border-amber-800/50'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              規格修正 ({diffResult.modified.length})
            </button>
            <button
              onClick={() => setFilterType('removed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                filterType === 'removed'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-950/60 border border-rose-800/50'
              }`}
            >
              <MinusCircle className="w-3.5 h-3.5" />
              移除 ({diffResult.removed.length})
            </button>
          </div>
        </div>

        {/* Diff Content Body */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {totalChanges === 0 ? (
            <div className="text-center py-12 bg-slate-950/50 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">兩版本完全一致</h3>
              <p className="text-xs text-slate-400">
                [{baseVer.versionNumber}] 與 [{targetVer.versionNumber}] 的所有品號、後製(ex.防霧、強化)與尺寸數值皆相同。
              </p>
            </div>
          ) : (
            <>
              {/* 1. Modified Items (規格修正明細) */}
              {(filterType === 'all' || filterType === 'modified') && filteredModified.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4" />
                    規格數值或後製(ex.防霧、強化)微調 ({filteredModified.length} 款)
                  </h3>

                  <div className="grid gap-3">
                    {filteredModified.map((itemDiff) => (
                      <div
                        key={itemDiff.sku}
                        className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400 bg-amber-950/50 px-2.5 py-0.5 rounded border border-amber-800 text-sm">
                              {itemDiff.sku}
                            </span>
                            <span className="text-xs text-slate-300 font-medium">
                              {itemDiff.name}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            共異動 <strong className="text-amber-300">{itemDiff.changes.length}</strong> 項規格
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {itemDiff.changes.map((ch, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs"
                            >
                              <div className="font-semibold text-slate-400 mb-1 flex items-center justify-between">
                                <span>{ch.fieldLabel}</span>
                                <span className="text-[10px] text-amber-400">規格調整</span>
                              </div>
                              <div className="flex items-center gap-2 font-mono">
                                <span className="line-through text-rose-400/80 bg-rose-950/40 px-1.5 py-0.5 rounded text-[11px] truncate max-w-[45%]">
                                  {String(ch.oldVal)}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded text-[11px] truncate max-w-[45%]">
                                  {String(ch.newVal)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Added Items (新增款式) */}
              {(filterType === 'all' || filterType === 'added') && filteredAdded.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4" />
                    在目標版本 [{targetVer.versionNumber}] 中新加入款式 ({filteredAdded.length} 款)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredAdded.map((it) => (
                      <div
                        key={it.id}
                        className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-emerald-300 text-sm">
                            {it.sku}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 bg-emerald-900/60 text-emerald-300 rounded font-semibold">
                            NEW 新增
                          </span>
                        </div>
                        <div className="text-xs text-slate-200 font-medium">{it.name}</div>
                        <div className="text-[11px] text-slate-400">
                          規格: <span className="font-mono text-sky-400">{it.specCode}</span> | 前框: {it.frontMaterial}
                        </div>
                        <div className="text-[11px] text-amber-200/90 truncate">
                          後製: {it.postProcessing}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Removed Items (淘汰款式) */}
              {(filterType === 'all' || filterType === 'removed') && filteredRemoved.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MinusCircle className="w-4 h-4" />
                    自基準版本 [{baseVer.versionNumber}] 淘汰/刪除之款式 ({filteredRemoved.length} 款)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredRemoved.map((it) => (
                      <div
                        key={it.id}
                        className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-2 opacity-80"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-rose-300 text-sm line-through">
                            {it.sku}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 bg-rose-900/60 text-rose-300 rounded font-semibold">
                            REMOVED 淘汰
                          </span>
                        </div>
                        <div className="text-xs text-slate-300">{it.name}</div>
                        <div className="text-[11px] text-slate-400">
                          原規格: <span className="font-mono text-slate-400">{it.specCode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs text-slate-400">
          <div>
            當前作用中版本：<span className="font-bold text-white">[{versions.find(v => v.id === currentVersionId)?.versionNumber}]</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSelectVersion(targetVerId);
                onClose();
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <History className="w-4 h-4" />
              切換並載入目標版本 [{targetVer.versionNumber}]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
