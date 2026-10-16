import * as XLSX from 'xlsx';
import { EyewearItem } from '../types/eyewear';

export interface ParseResult {
  items: EyewearItem[];
  detectedColumns: Record<string, string>;
  rawRowCount: number;
  unrecognizedRows: number;
  sourceType: 'excel' | 'csv' | 'ai';
}

export async function parseExcelOrCsvFile(file: File): Promise<ParseResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // 轉換為二維陣列以便尋找表頭
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rows || rows.length === 0) {
    throw new Error('試算表內容為空');
  }

  // 尋找表頭行 (包含品號或後製或規格等關鍵字的行)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const rowStr = (rows[i] || []).join(' ').toLowerCase();
    if (
      rowStr.includes('品號') ||
      rowStr.includes('sku') ||
      rowStr.includes('model') ||
      rowStr.includes('型號') ||
      rowStr.includes('後製') ||
      rowStr.includes('規格')
    ) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders: string[] = (rows[headerRowIndex] || []).map((h) => String(h || '').trim());
  const columnMap = mapHeadersToEyewearFields(rawHeaders);

  const items: EyewearItem[] = [];
  let unrecognizedRows = 0;

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rowObj: Record<string, any> = {};
    rawHeaders.forEach((h, idx) => {
      rowObj[h] = row[idx];
    });

    const parsedItem = extractEyewearItemFromRow(rowObj, columnMap, i);
    if (parsedItem) {
      items.push(parsedItem);
    } else {
      unrecognizedRows++;
    }
  }

  return {
    items,
    detectedColumns: columnMap,
    rawRowCount: rows.length - headerRowIndex - 1,
    unrecognizedRows,
    sourceType: file.name.endsWith('.csv') ? 'csv' : 'excel',
  };
}

function mapHeadersToEyewearFields(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};

  headers.forEach((h) => {
    const clean = h.toLowerCase().replace(/[\s_\-()（）]/g, '');

    // 品號 (SKU)
    if (
      clean.includes('品號') ||
      clean === 'sku' ||
      clean.includes('model') ||
      clean.includes('型號') ||
      clean.includes('貨號') ||
      clean.includes('款號') ||
      clean.includes('樣品編號')
    ) {
      map['sku'] = h;
    }
    // 品名 / 款式
    else if (clean.includes('品名') || clean.includes('款式') || clean.includes('name') || clean.includes('系列')) {
      map['name'] = h;
    }
    // 後製 (ex.防霧、強化)
    else if (
      clean.includes('後製') ||
      clean.includes('防霧') ||
      clean.includes('強化') ||
      clean.includes('加硬') ||
      clean.includes('工藝') ||
      clean.includes('表面處理') ||
      clean.includes('電鍍') ||
      clean.includes('烤漆') ||
      clean.includes('finish') ||
      clean.includes('treatment') ||
      clean.includes('postprocessing')
    ) {
      map['postProcessing'] = h;
    }
    // 規格標註 (52□18-140)
    else if (
      clean.includes('標準規格') ||
      clean.includes('規格代號') ||
      clean.includes('spec') ||
      clean === 'size' ||
      clean.includes('標註') ||
      clean.includes('尺寸規格')
    ) {
      map['specCode'] = h;
    }
    // 鏡圈寬度 A
    else if (
      clean.includes('鏡圈寬') ||
      clean.includes('鏡圈') ||
      clean.includes('圈寬') ||
      clean.includes('lenswidth') ||
      clean === 'a' ||
      clean === '寬度'
    ) {
      map['lensWidth'] = h;
    }
    // 鼻樑寬度 DBL
    else if (
      clean.includes('鼻樑') ||
      clean.includes('中樑') ||
      clean.includes('鼻橋') ||
      clean.includes('bridgewidth') ||
      clean === 'dbl' ||
      clean === 'bridge'
    ) {
      map['bridgeWidth'] = h;
    }
    // 鏡腿長度
    else if (
      clean.includes('鏡腿') ||
      clean.includes('鏡腳') ||
      clean.includes('腿長') ||
      clean.includes('腳長') ||
      clean.includes('templelength') ||
      clean === 'temple'
    ) {
      map['templeLength'] = h;
    }
    // 鏡圈高度 B
    else if (clean.includes('鏡高') || clean.includes('圈高') || clean.includes('lensheight') || clean === 'b') {
      map['lensHeight'] = h;
    }
    // 鏡框總寬
    else if (clean.includes('總寬') || clean.includes('面寬') || clean.includes('framewidth') || clean.includes('框寬')) {
      map['frameWidth'] = h;
    }
    // 重量
    else if (clean.includes('重量') || clean.includes('weight') || clean.includes('克重')) {
      map['weight'] = h;
    }
    // 材質
    else if (clean.includes('前框材質') || clean.includes('材質') || clean.includes('material') || clean.includes('框材')) {
      map['frontMaterial'] = h;
    }
    // 鏡腿材質
    else if (clean.includes('鏡腿材質') || clean.includes('腿材')) {
      map['templeMaterial'] = h;
    }
    // 色號 / 顏色
    else if (clean.includes('色號') || clean.includes('顏色') || clean.includes('color')) {
      map['colorCode'] = h;
    }
    // 鏡片
    else if (clean.includes('鏡片') || clean.includes('lens')) {
      map['lensMaterial'] = h;
    }
    // 配件
    else if (clean.includes('配件') || clean.includes('包裝') || clean.includes('accessory')) {
      map['accessories'] = h;
    }
    // 框型
    else if (clean.includes('框型') || clean.includes('shape') || clean.includes('形狀')) {
      map['frameShape'] = h;
    }
  });

  return map;
}

function extractEyewearItemFromRow(
  rowObj: Record<string, any>,
  colMap: Record<string, string>,
  index: number
): EyewearItem | null {
  const getVal = (field: string) => {
    const colName = colMap[field];
    return colName ? rowObj[colName] : undefined;
  };

  const rawSku = getVal('sku');
  const rawPost = getVal('postProcessing');
  const rawSpec = getVal('specCode');

  // 若該行連品號與後製工藝都沒有，視為空行或無效行
  if (!rawSku && !rawPost && !rawSpec) {
    return null;
  }

  let lensWidth = Number(getVal('lensWidth')) || 0;
  let bridgeWidth = Number(getVal('bridgeWidth')) || 0;
  let templeLength = Number(getVal('templeLength')) || 0;
  let specCode = String(rawSpec || '').trim();

  // 若沒有個別尺寸，嘗試從 specCode 解析 (例如 52□18-140 或 54-17-142)
  if (specCode) {
    const match = specCode.match(/(\d{2})[□\-/x#](\d{2})[□\-/x#](\d{3})/);
    if (match) {
      if (!lensWidth) lensWidth = parseInt(match[1], 10);
      if (!bridgeWidth) bridgeWidth = parseInt(match[2], 10);
      if (!templeLength) templeLength = parseInt(match[3], 10);
    }
  }

  // 若有個別尺寸但無 specCode，組合生成標準 52□18-140
  if (!specCode && lensWidth > 0 && bridgeWidth > 0 && templeLength > 0) {
    specCode = `${lensWidth}□${bridgeWidth}-${templeLength}`;
  }

  const lensHeight = Number(getVal('lensHeight')) || Math.round(lensWidth * 0.8) || 40;
  let frameWidth = Number(getVal('frameWidth')) || 0;
  if (!frameWidth && lensWidth > 0 && bridgeWidth > 0) {
    frameWidth = lensWidth * 2 + bridgeWidth + 8; // 理論莊頭加成
  }

  const weight = Number(getVal('weight')) || 18.5;
  const sku = String(rawSku || `SAMPLE-${index}`).trim();
  const name = String(getVal('name') || `${sku} 眼鏡樣品`).trim();
  const frontMat = String(getVal('frontMaterial') || '醋酸纖維板料 (Acetate)').trim();
  const templeMat = String(getVal('templeMaterial') || frontMat).trim();
  const postProcessing = String(rawPost || '高耐磨強化加硬 + 雙面奈米防霧處理').trim();
  const colorCode = String(getVal('colorCode') || 'C1 經典亮黑').trim();
  const frameShape = inferShape(getVal('frameShape') || name);

  return {
    id: `item-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    sku,
    name,
    category: inferCategory(name + ' ' + sku),
    frameShape,
    specCode,
    lensWidth,
    bridgeWidth,
    templeLength,
    lensHeight,
    frameWidth,
    weight,
    frontMaterial: frontMat,
    templeMaterial: templeMat,
    hingeType: '彈簧鉸鏈 (德國五金)',
    postProcessing,
    colorCode,
    lensMaterial: 'CR-39 樹脂光學片 (可替換)',
    lensCoating: 'UV400 抗紫外線 + 內側抗反射AR綠膜',
    uvCategory: 'Cat.3',
    lensColor: '清晰透明 / 漸變灰',
    accessories: String(getVal('accessories') || '硬殼收納盒、高纖維拭鏡布、樣品標籤卡').trim(),
    status: 'sample_review',
    remarks: '',
  };
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('太陽') || lower.includes('sun') || lower.includes('墨鏡')) return 'sunglasses';
  if (lower.includes('運動') || lower.includes('sport') || lower.includes('風鏡')) return 'sports';
  if (lower.includes('老花') || lower.includes('read')) return 'reading';
  if (lower.includes('兒') || lower.includes('kid')) return 'kids';
  return 'optical';
}

function inferShape(text: string): string {
  const lower = String(text || '').toLowerCase();
  if (lower.includes('威靈頓') || lower.includes('wellington')) return 'wellington';
  if (lower.includes('波士頓') || lower.includes('boston')) return 'boston';
  if (lower.includes('飛行員') || lower.includes('aviator') || lower.includes('蛤蟆')) return 'aviator';
  if (lower.includes('貓眼') || lower.includes('cat')) return 'cat_eye';
  if (lower.includes('眉架') || lower.includes('browline') || lower.includes('俱樂部')) return 'browline';
  if (lower.includes('圓') || lower.includes('round')) return 'round';
  if (lower.includes('方') || lower.includes('square')) return 'square';
  if (lower.includes('多角') || lower.includes('幾何') || lower.includes('polygon') || lower.includes('八角')) return 'polygon';
  if (lower.includes('無框') || lower.includes('半框') || lower.includes('rimless')) return 'rimless';
  return 'wellington';
}
