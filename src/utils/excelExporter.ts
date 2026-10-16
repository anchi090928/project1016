import * as XLSX from 'xlsx';
import { EyewearItem, EyewearVersion } from '../types/eyewear';
import { validateEyewearItem } from './validation';

export function exportEyewearMasterToExcel(
  version: EyewearVersion,
  filename?: string
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: 眼鏡樣品規格總表
  const masterRows = version.items.map((item, index) => {
    const errors = validateEyewearItem(item, version.items);
    const errorStatus = errors.length === 0
      ? '通過驗證'
      : errors.some((e) => e.type === 'critical')
      ? `嚴重錯誤 (${errors.filter((e) => e.type === 'critical').length})`
      : `規格警示 (${errors.length})`;

    return {
      項次: index + 1,
      品號: item.sku,
      品名_款式: item.name || '',
      款式類別: translateCategory(item.category),
      框型: translateShape(item.frameShape),
      '標準規格 (A□DBL-Temple)': item.specCode || `${item.lensWidth}□${item.bridgeWidth}-${item.templeLength}`,
      '鏡圈寬度 A (mm)': item.lensWidth || '',
      '鼻樑寬度 DBL (mm)': item.bridgeWidth || '',
      '鏡腿長度 (mm)': item.templeLength || '',
      '鏡圈高度 B (mm)': item.lensHeight || '',
      '鏡框總寬 (mm)': item.frameWidth || '',
      '鏡框重量 (g)': item.weight || '',
      前框材質: item.frontMaterial || '',
      鏡腿材質: item.templeMaterial || '',
      鉸鏈型式: item.hingeType || '',
      '後製(ex.防霧、強化)': item.postProcessing || '',
      色號與顏色: item.colorCode || '',
      鏡片材質: item.lensMaterial || '',
      鏡片鍍膜與防護: item.lensCoating || '',
      遮光等級: item.uvCategory || '',
      鏡片顏色: item.lensColor || '',
      包裝與配件: item.accessories || '',
      樣品進度狀態: translateStatus(item.status),
      規格檢測狀態: errorStatus,
      備註說明: item.remarks || '',
    };
  });

  const wsMaster = XLSX.utils.json_to_sheet(masterRows);

  // 設定欄位寬度
  wsMaster['!cols'] = [
    { wch: 6 }, // 項次
    { wch: 14 }, // 品號
    { wch: 18 }, // 品名
    { wch: 12 }, // 類別
    { wch: 12 }, // 框型
    { wch: 22 }, // 規格
    { wch: 14 }, // A
    { wch: 14 }, // DBL
    { wch: 12 }, // 鏡腿
    { wch: 12 }, // B
    { wch: 12 }, // 總寬
    { wch: 12 }, // 重量
    { wch: 14 }, // 前框材質
    { wch: 14 }, // 鏡腿材質
    { wch: 14 }, // 鉸鏈
    { wch: 32 }, // 後製工藝
    { wch: 16 }, // 色號
    { wch: 14 }, // 鏡片材質
    { wch: 18 }, // 鏡片鍍膜
    { wch: 10 }, // 遮光等級
    { wch: 12 }, // 鏡片顏色
    { wch: 20 }, // 配件
    { wch: 14 }, // 狀態
    { wch: 18 }, // 檢測
    { wch: 24 }, // 備註
  ];

  XLSX.utils.book_append_sheet(wb, wsMaster, '眼鏡樣品規格總表');

  // Sheet 2: 規格錯誤與品質異常檢測清單
  const allErrors: any[] = [];
  version.items.forEach((item) => {
    const errors = validateEyewearItem(item, version.items);
    errors.forEach((err) => {
      allErrors.push({
        品號: item.sku,
        品名: item.name,
        嚴重等級: err.type === 'critical' ? '嚴重錯誤 (Critical)' : err.type === 'warning' ? '異常警告 (Warning)' : '格式提示 (Info)',
        異常欄位: err.fieldLabel,
        檢測說明: err.message,
        建議修正方案: err.suggestion || '',
        可否一鍵自動修復: err.autoFixable ? '是' : '否 (需工程確認)',
      });
    });
  });

  const wsErrors = XLSX.utils.json_to_sheet(
    allErrors.length > 0
      ? allErrors
      : [{ 檢驗狀態: '恭喜！此版本全部樣品皆通過自動化錯誤檢測，無任何異常。' }]
  );
  wsErrors['!cols'] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 36 },
    { wch: 36 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsErrors, '自動化錯誤檢測報告');

  // Sheet 3: 版本資訊與修訂紀錄
  const versionSummary = [
    { 項目: '版本編號', 內容: version.versionNumber },
    { 項目: '版本標題', 內容: version.title },
    { 項目: '修訂人員', 內容: version.createdBy },
    { 項目: '建立時間', 內容: version.createdAt },
    { 項目: '款項總數', 內容: `${version.items.length} 款` },
    { 項目: '版本說明', 內容: version.notes || '無' },
    { 項目: '封存狀態', 內容: version.isLocked ? '已封存鎖定 (不可篡改)' : '草稿修訂中' },
  ];
  const wsVersion = XLSX.utils.json_to_sheet(versionSummary);
  wsVersion['!cols'] = [{ wch: 16 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsVersion, '版本資訊');

  const exportName = filename || `眼鏡樣品總表_${version.versionNumber}_${version.title.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, exportName);
}

function translateCategory(cat: string): string {
  switch (cat) {
    case 'optical':
      return '光學眼鏡 (Optical)';
    case 'sunglasses':
      return '太陽眼鏡 (Sunglasses)';
    case 'sports':
      return '運動風鏡 (Sports)';
    case 'reading':
      return '老花閱讀 (Reading)';
    case 'kids':
      return '兒童鏡框 (Kids)';
    default:
      return cat || '眼鏡';
  }
}

function translateShape(shape: string): string {
  switch (shape) {
    case 'wellington':
      return '威靈頓 (Wellington)';
    case 'boston':
      return '波士頓 (Boston)';
    case 'aviator':
      return '飛行員 (Aviator)';
    case 'cat_eye':
      return '貓眼 (Cat-Eye)';
    case 'browline':
      return '眉架 (Browline)';
    case 'round':
      return '圓框 (Round)';
    case 'square':
      return '方框 (Square)';
    case 'polygon':
      return '多角幾何 (Polygon)';
    case 'rimless':
      return '無框/半框 (Rimless)';
    default:
      return shape || '常規';
  }
}

function translateStatus(status: string): string {
  switch (status) {
    case 'sample_review':
      return '樣品初審中';
    case 'revision_needed':
      return '需修正樣品';
    case 'approved':
      return '已核可封樣';
    case 'mass_production':
      return '進入量產';
    default:
      return status || '未定';
  }
}
