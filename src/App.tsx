import React, { useState, useEffect, useMemo } from 'react';
import { EyewearItem, EyewearVersion } from './types/eyewear';
import { INITIAL_VERSIONS } from './data/sampleEyewearData';
import { validateEyewearItem, validateAllEyewear } from './utils/validation';
import { exportEyewearMasterToExcel } from './utils/excelExporter';
import { EyewearBlueprintDiagram } from './components/EyewearBlueprintDiagram';
import { EyewearComparisonModal } from './components/EyewearComparisonModal';
import { VersionDiffViewer } from './components/VersionDiffViewer';
import { ErrorAuditPanel } from './components/ErrorAuditPanel';
import { SmartUploadModal } from './components/SmartUploadModal';
import { EyewearDetailModal } from './components/EyewearDetailModal';
import { LoginScreen } from './components/LoginScreen';
import {
  Glasses,
  FileSpreadsheet,
  UploadCloud,
  ArrowRightLeft,
  GitCompare,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Download,
  RotateCcw,
  CheckSquare,
  Square,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  LogOut,
  User,
} from 'lucide-react';

export default function App() {
  // 使用者登入認證狀態 (預設帳號 admin / admin)
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string; name: string } | null>(() => {
    try {
      const saved = localStorage.getItem('eyewear_auth_user') || sessionStorage.getItem('eyewear_auth_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem('eyewear_auth_user');
    sessionStorage.removeItem('eyewear_auth_user');
    setCurrentUser(null);
  };

  // 載入版本資料 (localStorage 或 預載示範樣品)
  const [versions, setVersions] = useState<EyewearVersion[]>(() => {
    try {
      const saved = localStorage.getItem('eyewear_master_versions_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_VERSIONS;
  });

  const [activeVersionId, setActiveVersionId] = useState<string>(() => {
    return versions[0]?.id || 'ver-2.0';
  });

  // 取得當前作用中的版本
  const currentVersion = useMemo(() => {
    return versions.find((v) => v.id === activeVersionId) || versions[0];
  }, [versions, activeVersionId]);

  // 同步儲存至 localStorage
  useEffect(() => {
    try {
      localStorage.setItem('eyewear_master_versions_v1', JSON.stringify(versions));
    } catch (e) {
      console.error('Storage failed', e);
    }
  }, [versions]);

  // 主頁面導航分頁
  const [activeTab, setActiveTab] = useState<'table' | 'audit' | 'compare' | 'versions'>('table');

  // 篩選與搜尋狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('all');
  const [errorStatusFilter, setErrorStatusFilter] = useState<'all' | 'errors_only' | 'passed_only'>('all');

  // 選取欲比對的眼鏡 ID 清單
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // 展開圖解的眼鏡 ID (單列展開藍圖)
  const [expandedDiagramId, setExpandedDiagramId] = useState<string | null>(null);

  // Modals 控制
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isVersionDiffModalOpen, setIsVersionDiffModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EyewearItem | null>(null);

  // 計算當前版本的錯誤地圖
  const errorMap = useMemo(() => {
    return validateAllEyewear(currentVersion.items);
  }, [currentVersion.items]);

  // 統計指標
  const stats = useMemo(() => {
    let criticals = 0;
    let warnings = 0;
    let infos = 0;
    let itemsWithIssues = 0;

    currentVersion.items.forEach((it) => {
      const errs = errorMap.get(it.id) || [];
      if (errs.length > 0) itemsWithIssues++;
      errs.forEach((e) => {
        if (e.type === 'critical') criticals++;
        else if (e.type === 'warning') warnings++;
        else if (e.type === 'info') infos++;
      });
    });

    const passRate = currentVersion.items.length > 0
      ? Math.round(((currentVersion.items.length - itemsWithIssues) / currentVersion.items.length) * 100)
      : 100;

    return {
      totalItems: currentVersion.items.length,
      criticals,
      warnings,
      infos,
      totalIssues: criticals + warnings + infos,
      passRate,
    };
  }, [currentVersion.items, errorMap]);

  // 篩選樣品資料
  const filteredItems = useMemo(() => {
    return currentVersion.items.filter((item) => {
      // 搜尋 (品號、品名、後製、材質、規格)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSku = item.sku.toLowerCase().includes(query);
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesPost = (item.postProcessing || '').toLowerCase().includes(query);
        const matchesMat = (item.frontMaterial || '').toLowerCase().includes(query);
        const matchesSpec = (item.specCode || '').toLowerCase().includes(query);
        if (!matchesSku && !matchesName && !matchesPost && !matchesMat && !matchesSpec) {
          return false;
        }
      }

      // 類別篩選
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // 材質篩選
      if (materialFilter !== 'all') {
        const mat = (item.frontMaterial || '').toLowerCase();
        if (!mat.includes(materialFilter.toLowerCase())) {
          return false;
        }
      }

      // 檢測狀態篩選
      if (errorStatusFilter !== 'all') {
        const errs = errorMap.get(item.id) || [];
        if (errorStatusFilter === 'errors_only' && errs.length === 0) return false;
        if (errorStatusFilter === 'passed_only' && errs.length > 0) return false;
      }

      return true;
    });
  }, [currentVersion.items, searchQuery, categoryFilter, materialFilter, errorStatusFilter, errorMap]);

  // 更新當前版本的品項清單
  const updateCurrentVersionItems = (newItems: EyewearItem[]) => {
    setVersions((prev) =>
      prev.map((v) => (v.id === activeVersionId ? { ...v, items: newItems } : v))
    );
  };

  // 儲存單款修改
  const handleSaveItem = (updated: EyewearItem) => {
    const exists = currentVersion.items.some((it) => it.id === updated.id);
    let newItems: EyewearItem[];
    if (exists) {
      newItems = currentVersion.items.map((it) => (it.id === updated.id ? updated : it));
    } else {
      newItems = [updated, ...currentVersion.items];
    }
    updateCurrentVersionItems(newItems);
  };

  // 刪除單款
  const handleDeleteItem = (id: string) => {
    const newItems = currentVersion.items.filter((it) => it.id !== id);
    updateCurrentVersionItems(newItems);
    setSelectedForCompare((prev) => prev.filter((i) => i !== id));
  };

  // 匯入上傳檔案解析結果
  const handleImportItems = (
    newItems: EyewearItem[],
    createNewVer: boolean,
    newVersionTitle?: string
  ) => {
    if (createNewVer) {
      const nextVerNumber = `v${versions.length + 1}.0`;
      const newVersion: EyewearVersion = {
        id: `ver-${Date.now()}`,
        versionNumber: nextVerNumber,
        title: newVersionTitle || `${nextVerNumber} 匯入樣品總表`,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        createdBy: '樣品專案負責人',
        notes: `由外部上傳自動解析匯入，共含 ${newItems.length} 款眼鏡規格資料。`,
        items: newItems,
        isLocked: false,
      };
      setVersions([newVersion, ...versions]);
      setActiveVersionId(newVersion.id);
    } else {
      // 追加到當前版本
      updateCurrentVersionItems([...newItems, ...currentVersion.items]);
    }
  };

  // 建立全新樣品款項
  const handleCreateNewSku = () => {
    const newItem: EyewearItem = {
      id: `new-${Date.now()}`,
      sku: `SAMPLE-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '新款打樣光學框',
      category: 'optical',
      frameShape: 'boston',
      specCode: '50□19-140',
      lensWidth: 50,
      bridgeWidth: 19,
      templeLength: 140,
      lensHeight: 42,
      frameWidth: 138,
      weight: 15.5,
      frontMaterial: '日本純鈦 (Pure Titanium)',
      templeMaterial: '高彈性 β-鈦',
      hingeType: '精密彈簧鉸鏈',
      postProcessing: 'IP真空玫瑰金超耐磨電鍍 + 手工拋光',
      colorCode: 'C1 玫瑰金',
      lensMaterial: 'CR-39 樹脂光學片',
      lensCoating: 'UV400 + 抗反光綠膜',
      uvCategory: 'Cat.0',
      lensColor: '清晰透明',
      accessories: '原廠磁吸鏡盒、超細擦拭布',
      status: 'sample_review',
    };
    setEditingItem(newItem);
  };

  // 重設為示範資料
  const handleResetData = () => {
    if (confirm('確定要重設為系統預設的示範樣品總表與版本歷程嗎？')) {
      setVersions(INITIAL_VERSIONS);
      setActiveVersionId(INITIAL_VERSIONS[0].id);
      localStorage.removeItem('eyewear_master_versions_v1');
    }
  };

  // 切換選取比對
  const toggleSelectForCompare = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 4) {
        alert('最多同時比對 4 款眼鏡規格');
        return prev;
      }
      return [...prev, id];
    });
  };

  // 取得已選取的比對清單
  const selectedCompareItems = useMemo(() => {
    return currentVersion.items.filter((it) => selectedForCompare.includes(it.id));
  }, [currentVersion.items, selectedForCompare]);

  // 若尚未登入，顯示系統安全登入畫面 (預設 admin / admin，介面無預載密碼提示)
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-sky-950/50">
              <Glasses className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  眼鏡樣品總表智能解析與規格管理系統
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  EXCEL SPEC MATRIX
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                品號 / 後製(ex.防霧、強化) / 52□18-140尺寸結構化辨識 ‧ 自動化錯誤檢測 ‧ 版本控制
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Version Selector Dropdown */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-xl p-1 text-xs">
              <span className="px-2 text-slate-400 font-medium flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                版本:
              </span>
              <select
                value={activeVersionId}
                onChange={(e) => setActiveVersionId(e.target.value)}
                className="bg-slate-900 text-sky-300 font-bold px-2.5 py-1 rounded-lg border-0 focus:outline-none cursor-pointer"
              >
                {versions.map((ver) => (
                  <option key={ver.id} value={ver.id}>
                    {ver.versionNumber} - {ver.title} ({ver.items.length}款) {ver.isLocked ? '🔒' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-sky-950 flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              上傳樣品總表
            </button>

            {/* Export Excel Button */}
            <button
              onClick={() => exportEyewearMasterToExcel(currentVersion)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              匯出 Excel 表格
            </button>

            {/* Version Diff Button */}
            <button
              onClick={() => setIsVersionDiffModalOpen(true)}
              className="px-3 py-2 bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-800/80 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <GitCompare className="w-3.5 h-3.5" />
              版本比對
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 rounded-xl text-xs border border-slate-700/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span className="text-slate-200 font-semibold">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({currentUser.username})</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700/80 hover:border-rose-800/60 transition-colors"
                title="登出系統"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Status Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between border-t border-slate-800/80 text-xs">
          <nav className="flex items-center gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('table')}
              className={`py-3 px-3.5 font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'table'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              規格總表瀏覽 ({filteredItems.length})
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-3.5 font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'audit'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              自動化錯誤檢測
              {stats.totalIssues > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold border border-amber-500/40">
                  {stats.totalIssues}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (selectedForCompare.length < 2) {
                  // 自動勾選前兩款以利體驗
                  const ids = currentVersion.items.slice(0, 2).map((it) => it.id);
                  setSelectedForCompare(ids);
                }
                setIsCompareModalOpen(true);
              }}
              className="py-3 px-3.5 font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-4 h-4 text-sky-400" />
              規格比對矩陣
              {selectedForCompare.length > 0 && (
                <span className="px-1.5 py-0.2 bg-sky-950 text-sky-300 rounded text-[10px] font-bold border border-sky-800">
                  {selectedForCompare.length} 款
                </span>
              )}
            </button>
          </nav>

          {/* Quick Info & Reset */}
          <div className="hidden md:flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              規格合格率：
              <strong className={stats.passRate === 100 ? 'text-emerald-400' : 'text-amber-400'}>
                {stats.passRate}%
              </strong>
            </span>
            <span className="h-3 w-px bg-slate-800" />
            <button
              onClick={handleResetData}
              className="hover:text-slate-200 flex items-center gap-1 transition-colors"
              title="重設回預設示範樣品"
            >
              <RotateCcw className="w-3 h-3" />
              重設示範資料
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'audit' ? (
          /* TAB 2: 自動化錯誤檢測中心 */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  眼鏡規格與後製(ex.防霧、強化)自動化錯誤檢測
                  <span className="text-xs px-2.5 py-0.5 font-mono font-bold bg-slate-800 text-sky-400 rounded-full">
                    {currentVersion.versionNumber}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  嚴格防呆審查：品號缺失、後製(ex.防霧、強化)漏填、幾何尺寸總寬矛盾、醋酸板料工藝相容性矛盾
                </p>
              </div>

              <button
                onClick={() => setActiveTab('table')}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
              >
                返回總表清單
              </button>
            </div>

            <ErrorAuditPanel
              items={currentVersion.items}
              onUpdateItems={updateCurrentVersionItems}
              onEditItem={(it) => setEditingItem(it)}
            />
          </div>
        ) : (
          /* TAB 1: 樣品規格總表瀏覽 */
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋品號、品名、後製 (如: 防霧/強化/電鍍/烤漆)、材質、規格 (如: 52□18)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Right Action: Create New SKU */}
                <button
                  onClick={handleCreateNewSku}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  手動新增眼鏡品號
                </button>
              </div>

              {/* Secondary Filter Chips */}
              <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>款式類別:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="all">全部類別</option>
                    <option value="optical">光學鏡框 (Optical)</option>
                    <option value="sunglasses">太陽眼鏡 (Sunglasses)</option>
                    <option value="sports">運動風鏡 (Sports)</option>
                    <option value="reading">老花閱讀 (Reading)</option>
                    <option value="kids">兒童款 (Kids)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <span>前框材質:</span>
                  <select
                    value={materialFilter}
                    onChange={(e) => setMaterialFilter(e.target.value)}
                    className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="all">全部材質</option>
                    <option value="鈦">純鈦 / β-鈦</option>
                    <option value="板料">醋酸纖維板料 (Acetate)</option>
                    <option value="鋼">不鏽鋼 / 手術鋼</option>
                    <option value="tr90">TR90 記憶高分子</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <span>規格檢測狀態:</span>
                  <select
                    value={errorStatusFilter}
                    onChange={(e) => setErrorStatusFilter(e.target.value as any)}
                    className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="all">全部狀態</option>
                    <option value="errors_only">僅顯示含檢測異常/警示款</option>
                    <option value="passed_only">僅顯示完全通過驗證款</option>
                  </select>
                </div>

                {(searchQuery || categoryFilter !== 'all' || materialFilter !== 'all' || errorStatusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setMaterialFilter('all');
                      setErrorStatusFilter('all');
                    }}
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium ml-auto"
                  >
                    清除所有篩選條件
                  </button>
                )}
              </div>
            </div>

            {/* Selection for Side-by-Side Comparison Floating/Fixed Banner */}
            {selectedForCompare.length > 0 && (
              <div className="p-3 bg-gradient-to-r from-sky-950/90 to-indigo-950/90 border border-sky-600/50 rounded-xl flex items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-2 text-xs">
                  <ArrowRightLeft className="w-4 h-4 text-sky-400" />
                  <span className="text-white font-medium">
                    已勾選 <strong className="text-sky-400 font-bold">{selectedForCompare.length}</strong> 款眼鏡進行規格比較
                  </span>
                  <span className="text-slate-400">
                    ({selectedCompareItems.map((i) => i.sku).join(', ')})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedForCompare([])}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    清空選擇
                  </button>
                  <button
                    onClick={() => setIsCompareModalOpen(true)}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    開啟規格比對矩陣
                  </button>
                </div>
              </div>
            )}

            {/* Master Eyewear Specs Table */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/80 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800/90 text-slate-300 border-b border-slate-700/80 font-semibold select-none">
                      <th className="p-3 w-10 text-center">
                        <span className="sr-only">比對勾選</span>
                      </th>
                      <th className="p-3 min-w-[130px]">品號 (SKU)</th>
                      <th className="p-3 min-w-[150px]">品名 / 款式</th>
                      <th className="p-3 min-w-[120px]">標準規格 (A□DBL-Temple)</th>
                      <th className="p-3 min-w-[200px]">後製(ex.防霧、強化)</th>
                      <th className="p-3 min-w-[130px]">前框材質</th>
                      <th className="p-3 min-w-[80px]">實重(g)</th>
                      <th className="p-3 min-w-[140px]">鏡片規格</th>
                      <th className="p-3 min-w-[100px]">樣品狀態</th>
                      <th className="p-3 min-w-[120px]">錯誤檢測</th>
                      <th className="p-3 min-w-[130px] text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-12 text-center text-slate-500">
                          <Glasses className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm font-semibold text-slate-400">查無符合條件的眼鏡樣品</p>
                          <p className="text-xs text-slate-500 mt-1">請調整篩選字串或點擊上傳總表匯入</p>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isSelected = selectedForCompare.includes(item.id);
                        const isExpanded = expandedDiagramId === item.id;
                        const itemErrors = errorMap.get(item.id) || [];
                        const hasCritical = itemErrors.some((e) => e.type === 'critical');
                        const hasWarning = itemErrors.some((e) => e.type === 'warning');

                        return (
                          <React.Fragment key={item.id}>
                            <tr
                              className={`hover:bg-slate-800/40 transition-colors ${
                                isSelected ? 'bg-sky-950/20' : ''
                              } ${hasCritical ? 'bg-rose-950/10' : ''}`}
                            >
                              {/* Compare Selection Checkbox */}
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleSelectForCompare(item.id)}
                                  className="text-slate-400 hover:text-sky-400 transition-colors"
                                  title="勾選以進行規格比對"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-sky-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-600" />
                                  )}
                                </button>
                              </td>

                              {/* SKU */}
                              <td className="p-3 font-mono font-bold text-sky-400 text-sm">
                                {item.sku || <span className="text-rose-400 italic">缺品號</span>}
                              </td>

                              {/* Name & Shape */}
                              <td className="p-3">
                                <div className="font-semibold text-slate-200">{item.name}</div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span className="capitalize">{item.category}</span>
                                  <span>•</span>
                                  <span className="capitalize text-slate-400">{item.frameShape}</span>
                                </div>
                              </td>

                              {/* Spec Code (52□18-140) */}
                              <td className="p-3 font-mono">
                                <span className="font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60 text-xs">
                                  {item.specCode || `${item.lensWidth}□${item.bridgeWidth}-${item.templeLength}`}
                                </span>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  面寬 {item.frameWidth || '--'}mm | 高 {item.lensHeight || '--'}mm
                                </div>
                              </td>

                              {/* Post Processing 後製(ex.防霧、強化) */}
                              <td className="p-3">
                                <div className="text-amber-200/90 font-medium leading-relaxed max-w-xs line-clamp-2" title={item.postProcessing}>
                                  {item.postProcessing || <span className="text-rose-400 italic">尚未填寫後製(ex.防霧、強化)</span>}
                                </div>
                                {item.colorCode && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    色號: {item.colorCode}
                                  </div>
                                )}
                              </td>

                              {/* Front Material */}
                              <td className="p-3 text-slate-300">
                                <div>{item.frontMaterial}</div>
                                <div className="text-[10px] text-slate-500">腿: {item.templeMaterial}</div>
                              </td>

                              {/* Weight */}
                              <td className="p-3 font-mono font-bold text-slate-300">
                                {item.weight}g
                              </td>

                              {/* Lens Spec */}
                              <td className="p-3 text-slate-300">
                                <div className="truncate max-w-[130px]" title={item.lensMaterial}>
                                  {item.lensMaterial}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate" title={item.lensCoating}>
                                  {item.lensCoating} ({item.uvCategory})
                                </div>
                              </td>

                              {/* Status */}
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                    item.status === 'approved'
                                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                      : item.status === 'mass_production'
                                      ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                                      : item.status === 'revision_needed'
                                      ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                                      : 'bg-sky-950/80 text-sky-300 border-sky-800'
                                  }`}
                                >
                                  {item.status === 'approved'
                                    ? '封樣核可'
                                    : item.status === 'mass_production'
                                    ? '量產開模'
                                    : item.status === 'revision_needed'
                                    ? '待修樣品'
                                    : '初審中'}
                                </span>
                              </td>

                              {/* Validation Status */}
                              <td className="p-3">
                                {itemErrors.length === 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    規格合規
                                  </span>
                                ) : hasCritical ? (
                                  <span
                                    className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-bold cursor-pointer hover:underline"
                                    onClick={() => setActiveTab('audit')}
                                    title="點擊查看詳細嚴重錯誤"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {itemErrors.filter((e) => e.type === 'critical').length} 項嚴重錯誤
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium cursor-pointer hover:underline"
                                    onClick={() => setActiveTab('audit')}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {itemErrors.length} 項警示
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedDiagramId(isExpanded ? null : item.id)
                                  }
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition-colors inline-block"
                                  title={isExpanded ? '收合藍圖圖解' : '展開眼鏡工程尺寸藍圖'}
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingItem(item)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs font-medium inline-block"
                                >
                                  編輯
                                </button>
                              </td>
                            </tr>

                            {/* Inline Expandable Blueprint Diagram */}
                            {isExpanded && (
                              <tr className="bg-slate-950/70">
                                <td colSpan={11} className="p-4 sm:p-6 border-b border-slate-800">
                                  <div className="max-w-4xl mx-auto">
                                    <EyewearBlueprintDiagram item={item} />
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {/* 1. Smart Upload Modal */}
      {isUploadModalOpen && (
        <SmartUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onImportItems={handleImportItems}
        />
      )}

      {/* 2. Side-by-Side Comparison Matrix Modal */}
      {isCompareModalOpen && (
        <EyewearComparisonModal
          items={selectedCompareItems.length > 0 ? selectedCompareItems : currentVersion.items.slice(0, 2)}
          onClose={() => setIsCompareModalOpen(false)}
          onRemoveItem={(id) => setSelectedForCompare((prev) => prev.filter((i) => i !== id))}
        />
      )}

      {/* 3. Version Diff Viewer Modal */}
      {isVersionDiffModalOpen && (
        <VersionDiffViewer
          versions={versions}
          currentVersionId={activeVersionId}
          onClose={() => setIsVersionDiffModalOpen(false)}
          onSelectVersion={(newVerId) => setActiveVersionId(newVerId)}
        />
      )}

      {/* 4. Eyewear Detail / Edit Modal */}
      {editingItem && (
        <EyewearDetailModal
          item={editingItem}
          allItems={currentVersion.items}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
