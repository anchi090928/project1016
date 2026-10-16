import { EyewearItem, ValidationError } from '../types/eyewear';

export function validateEyewearItem(item: EyewearItem, allItems: EyewearItem[] = []): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. 必填項檢測: 品號 (SKU)
  if (!item.sku || item.sku.trim() === '') {
    errors.push({
      id: `${item.id}-sku-empty`,
      type: 'critical',
      field: 'sku',
      fieldLabel: '品號 (SKU)',
      message: '缺失品號，樣品無法進行追蹤與管理',
      suggestion: '請輸入供應商或內部標準品號代碼 (如 OG-2026-01)',
      autoFixable: false,
    });
  } else {
    // 品號重複檢查
    const duplicates = allItems.filter(
      (other) => other.id !== item.id && other.sku.trim().toLowerCase() === item.sku.trim().toLowerCase()
    );
    if (duplicates.length > 0) {
      errors.push({
        id: `${item.id}-sku-duplicate`,
        type: 'critical',
        field: 'sku',
        fieldLabel: '品號 (SKU)',
        message: `品號 [${item.sku}] 在總表中重複出現 (${duplicates.length + 1} 筆記錄)`,
        suggestion: '請加上色號或次批號後綴 (如 -C1, -C2, 或 RevA)',
        autoFixable: false,
      });
    }
  }

  // 2. 必填項檢測: 後製(ex.防霧、強化)
  if (!item.postProcessing || item.postProcessing.trim() === '') {
    errors.push({
      id: `${item.id}-post-empty`,
      type: 'critical',
      field: 'postProcessing',
      fieldLabel: '後製(ex.防霧、強化)',
      message: '缺失後製(ex.防霧、強化)描述，無法評估鏡片與鏡框表面處理規格',
      suggestion: '標註後製處理，例如：雙面防霧、高耐磨強化加硬、AR防反射、電鍍噴漆等',
      autoFixable: true,
      suggestedValue: '鏡片強化加硬 + 奈米防霧 (待確認)',
    });
  }

  // 3. 尺寸檢測: 鏡圈寬度 A (Lens Width)
  if (!item.lensWidth || item.lensWidth <= 0) {
    errors.push({
      id: `${item.id}-lensWidth-missing`,
      type: 'critical',
      field: 'lensWidth',
      fieldLabel: '鏡圈寬度 (A)',
      message: '缺失鏡圈寬度數值',
      suggestion: '常規成人眼鏡鏡圈寬度多在 48~58mm 之間',
      autoFixable: false,
    });
  } else if (item.lensWidth < 38 || item.lensWidth > 68) {
    errors.push({
      id: `${item.id}-lensWidth-extreme`,
      type: 'warning',
      field: 'lensWidth',
      fieldLabel: '鏡圈寬度 (A)',
      message: `鏡圈寬度 ${item.lensWidth}mm 偏離常規規格範圍 (正常 40~64mm)`,
      suggestion: '請確認是否為特殊兒童款、迷你閱讀鏡或超大風鏡，若為常規款請核對樣品實測',
      autoFixable: false,
    });
  }

  // 4. 尺寸檢測: 鼻樑寬度 DBL (Bridge Width)
  if (!item.bridgeWidth || item.bridgeWidth <= 0) {
    errors.push({
      id: `${item.id}-bridgeWidth-missing`,
      type: 'critical',
      field: 'bridgeWidth',
      fieldLabel: '鼻樑寬度 (DBL)',
      message: '缺失鼻樑/中樑寬度數值',
      suggestion: '成人光學及太陽眼鏡中樑常規為 16~21mm',
      autoFixable: false,
    });
  } else if (item.bridgeWidth < 10 || item.bridgeWidth > 26) {
    errors.push({
      id: `${item.id}-bridgeWidth-extreme`,
      type: 'critical',
      field: 'bridgeWidth',
      fieldLabel: '鼻樑寬度 (DBL)',
      message: `鼻樑寬度 ${item.bridgeWidth}mm 數值異常 (標準鼻樑為 13~22mm)`,
      suggestion: item.bridgeWidth > 26 ? '數值過大，可能誤將雙樑總寬或外徑填入中樑欄位' : '數值過窄，亞洲鼻型可能無法配戴',
      autoFixable: false,
    });
  }

  // 5. 尺寸檢測: 鏡腿長度 (Temple Length)
  if (!item.templeLength || item.templeLength <= 0) {
    errors.push({
      id: `${item.id}-templeLength-missing`,
      type: 'warning',
      field: 'templeLength',
      fieldLabel: '鏡腿長度',
      message: '缺失鏡腿長度',
      suggestion: '標準鏡腿長通常為 140mm 或 145mm',
      autoFixable: true,
      suggestedValue: 140,
    });
  } else if (item.templeLength < 120 || item.templeLength > 160) {
    errors.push({
      id: `${item.id}-templeLength-extreme`,
      type: 'warning',
      field: 'templeLength',
      fieldLabel: '鏡腿長度',
      message: `鏡腿長度 ${item.templeLength}mm 非常規範圍 (標準 130~150mm)`,
      suggestion: '請核對鏡腿彎折後總展開長度或樣品標記',
      autoFixable: false,
    });
  }

  // 6. 幾何尺寸邏輯驗證: 鏡框總寬 vs (2 * 鏡圈寬 + 鼻樑寬)
  if (item.lensWidth > 0 && item.bridgeWidth > 0 && item.frameWidth > 0) {
    const theoreticalMinFrameWidth = item.lensWidth * 2 + item.bridgeWidth;
    if (item.frameWidth < theoreticalMinFrameWidth - 2) {
      errors.push({
        id: `${item.id}-frameWidth-logic`,
        type: 'critical',
        field: 'frameWidth',
        fieldLabel: '鏡框總寬 (Frame Width)',
        message: `總寬 (${item.frameWidth}mm) 小於理論鏡面下限 (${theoreticalMinFrameWidth}mm = 鏡圈${item.lensWidth}*2 + 鼻樑${item.bridgeWidth})`,
        suggestion: `鏡框總寬需包含兩側莊頭厚度，建議修正為約 ${theoreticalMinFrameWidth + 8}mm`,
        suggestedValue: theoreticalMinFrameWidth + 8,
        autoFixable: true,
      });
    }
  }

  // 7. 鏡圈高度 B 邏輯檢測
  if (item.lensHeight > 0 && item.lensWidth > 0) {
    if (item.lensHeight >= item.lensWidth) {
      errors.push({
        id: `${item.id}-lensHeight-ratio`,
        type: 'warning',
        field: 'lensHeight',
        fieldLabel: '鏡圈高度 (B)',
        message: `鏡圈高度 (${item.lensHeight}mm) 大於或等於鏡寬 (${item.lensWidth}mm)，外觀比例呈現異常縱向橢圓`,
        suggestion: '常規威靈頓、波士頓框鏡高通常為鏡寬的 70%~90%',
        autoFixable: false,
      });
    }
  }

  // 8. 標準規格標註 format (A□DBL-Temple) 檢測
  const standardSpecRegex = /^\d{2}□\d{2}-\d{3}$/;
  if (!item.specCode || item.specCode.trim() === '') {
    if (item.lensWidth > 0 && item.bridgeWidth > 0 && item.templeLength > 0) {
      const generatedSpec = `${item.lensWidth}□${item.bridgeWidth}-${item.templeLength}`;
      errors.push({
        id: `${item.id}-specCode-missing`,
        type: 'info',
        field: 'specCode',
        fieldLabel: '規格標註代號',
        message: '未填寫國際標準規格代號 (如 52□18-140)',
        suggestion: `可依現有尺寸自動生成 [${generatedSpec}]`,
        suggestedValue: generatedSpec,
        autoFixable: true,
      });
    }
  } else if (!standardSpecRegex.test(item.specCode)) {
    // 檢查是否為 52-18-140 或 52#18-140
    const looseMatch = item.specCode.match(/^(\d{2})[-/x#](\d{2})[-/x#](\d{3})$/);
    if (looseMatch) {
      const normalized = `${looseMatch[1]}□${looseMatch[2]}-${looseMatch[3]}`;
      errors.push({
        id: `${item.id}-specCode-format`,
        type: 'info',
        field: 'specCode',
        fieldLabel: '規格標註代號',
        message: `規格格式 [${item.specCode}] 非國際通用標準方框標記`,
        suggestion: `建議格式化為國際標準方框符號：[${normalized}]`,
        suggestedValue: normalized,
        autoFixable: true,
      });
    }
  }

  // 9. 工藝與材質相容性檢測 (Material & Process Conflicts)
  const frontMatLower = (item.frontMaterial || '').toLowerCase();
  const postLower = (item.postProcessing || '').toLowerCase();

  // 板料 (Acetate) / TR90 不適用陽極氧化 (陽極氧化只適用於鋁鎂金屬)
  if ((frontMatLower.includes('板料') || frontMatLower.includes('acetate') || frontMatLower.includes('tr90')) &&
      (postLower.includes('陽極氧化') || postLower.includes('陽極處理') || postLower.includes('anodiz'))) {
    errors.push({
      id: `${item.id}-material-conflict-anodizing`,
      type: 'critical',
      field: 'postProcessing',
      fieldLabel: '後製(ex.防霧、強化)相容性矛盾',
      message: `前框材質為非金屬 [${item.frontMaterial}]，卻標註「陽極氧化」工藝（陽極氧化僅適用鋁鎂等金屬）`,
      suggestion: '板料框建議後製改為「手工滾筒拋光」或「鏡片強化防霧後製」',
      autoFixable: false,
    });
  }

  // 板料標註「高溫電鍍」
  if ((frontMatLower.includes('板料') || frontMatLower.includes('acetate')) &&
      (postLower.includes('高溫電鍍') || postLower.includes('高溫烤漆'))) {
    errors.push({
      id: `${item.id}-material-conflict-hightemp`,
      type: 'warning',
      field: 'postProcessing',
      fieldLabel: '後製(ex.防霧、強化)風險提示',
      message: '醋酸纖維板料不耐 80°C 以上高溫，高溫電鍍/烤漆會導致鏡框變形發白起泡',
      suggestion: '請確認是否指金屬配件局部電鍍，或改用常溫 UV 塗裝工藝',
      autoFixable: false,
    });
  }

  // 純鈦重量異常檢測
  if ((frontMatLower.includes('純鈦') || frontMatLower.includes('titanium') || frontMatLower.includes('β鈦')) && item.weight > 30) {
    errors.push({
      id: `${item.id}-titanium-weight`,
      type: 'warning',
      field: 'weight',
      fieldLabel: '鏡框重量',
      message: `標註為鈦金屬，但樣品重量達 ${item.weight}g (純鈦鏡架通常在 10~20g 左右)`,
      suggestion: '請確認是否包含展示鏡片重量，或材質為含鉛/鋅之厚重合金混合件',
      autoFixable: false,
    });
  }

  // 10. 無框/半框鏡片材質相容性
  const shapeLower = (item.frameShape || '').toLowerCase();
  const lensMatLower = (item.lensMaterial || '').toLowerCase();
  if ((shapeLower.includes('rimless') || shapeLower.includes('無框') || shapeLower.includes('半框')) &&
      lensMatLower.includes('cr-39') && !lensMatLower.includes('加硬')) {
    errors.push({
      id: `${item.id}-lens-rimless-cr39`,
      type: 'warning',
      field: 'lensMaterial',
      fieldLabel: '鏡片規格建議',
      message: '無框或半框拉絲款式需打孔/開槽，一般 CR-39 樹脂脆性高易崩邊破裂',
      suggestion: '建議指定高抗衝擊材質：PC防爆片或特種尼龍 (Nylon) 鏡片',
      autoFixable: false,
    });
  }

  return errors;
}

// 批次檢測所有樣品
export function validateAllEyewear(items: EyewearItem[]): Map<string, ValidationError[]> {
  const map = new Map<string, ValidationError[]>();
  items.forEach((item) => {
    const errs = validateEyewearItem(item, items);
    map.set(item.id, errs);
  });
  return map;
}

// 一鍵自動修復可修正項目
export function applyAutoFix(item: EyewearItem, error: ValidationError): EyewearItem {
  const updated = { ...item };
  if (!error.autoFixable || error.suggestedValue === undefined) return item;

  switch (error.field) {
    case 'specCode':
      updated.specCode = error.suggestedValue;
      break;
    case 'frameWidth':
      updated.frameWidth = error.suggestedValue;
      break;
    case 'templeLength':
      updated.templeLength = error.suggestedValue;
      break;
    case 'postProcessing':
      if (!updated.postProcessing) {
        updated.postProcessing = error.suggestedValue;
      }
      break;
  }
  return updated;
}
