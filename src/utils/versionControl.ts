import { EyewearItem, EyewearVersion, ItemDiff, VersionDiffResult } from '../types/eyewear';

const FIELD_LABELS: Record<string, string> = {
  sku: '品號',
  name: '品名/款式',
  category: '款式類別',
  frameShape: '框型',
  specCode: '標準規格',
  lensWidth: '鏡圈寬(A)',
  bridgeWidth: '鼻樑寬(DBL)',
  templeLength: '鏡腿長',
  lensHeight: '鏡圈高(B)',
  frameWidth: '鏡框總寬',
  weight: '鏡框重量(g)',
  frontMaterial: '前框材質',
  templeMaterial: '鏡腿材質',
  hingeType: '鉸鏈類型',
  postProcessing: '後製(ex.防霧、強化)',
  colorCode: '色號',
  lensMaterial: '鏡片材質',
  lensCoating: '鏡片鍍膜',
  uvCategory: '遮光等級',
  accessories: '配件規格',
  status: '樣品狀態',
  remarks: '備註說明',
};

export function compareVersions(baseVersion: EyewearVersion, targetVersion: EyewearVersion): VersionDiffResult {
  const baseMap = new Map<string, EyewearItem>();
  baseVersion.items.forEach((item) => {
    baseMap.set(item.sku.trim().toLowerCase(), item);
  });

  const targetMap = new Map<string, EyewearItem>();
  targetVersion.items.forEach((item) => {
    targetMap.set(item.sku.trim().toLowerCase(), item);
  });

  const added: EyewearItem[] = [];
  const removed: EyewearItem[] = [];
  const modified: ItemDiff[] = [];
  let unchangedCount = 0;

  // 找新增與修改
  targetVersion.items.forEach((targetItem) => {
    const key = targetItem.sku.trim().toLowerCase();
    const baseItem = baseMap.get(key);

    if (!baseItem) {
      added.push(targetItem);
    } else {
      // 比對欄位差異
      const changes: Array<{ field: string; fieldLabel: string; oldVal: any; newVal: any }> = [];

      Object.keys(FIELD_LABELS).forEach((field) => {
        const oldVal = (baseItem as any)[field];
        const newVal = (targetItem as any)[field];

        // 數值或字串比較
        const isDiff =
          typeof oldVal === 'number' && typeof newVal === 'number'
            ? Math.abs(oldVal - newVal) > 0.001
            : String(oldVal ?? '').trim() !== String(newVal ?? '').trim();

        if (isDiff) {
          changes.push({
            field,
            fieldLabel: FIELD_LABELS[field] || field,
            oldVal: oldVal ?? '-',
            newVal: newVal ?? '-',
          });
        }
      });

      if (changes.length > 0) {
        modified.push({
          sku: targetItem.sku,
          name: targetItem.name || baseItem.name,
          changes,
        });
      } else {
        unchangedCount++;
      }
    }
  });

  // 找移除
  baseVersion.items.forEach((baseItem) => {
    const key = baseItem.sku.trim().toLowerCase();
    if (!targetMap.has(key)) {
      removed.push(baseItem);
    }
  });

  return {
    baseVersion,
    targetVersion,
    added,
    removed,
    modified,
    unchangedCount,
  };
}

export function generateNextVersionNumber(currentVersions: EyewearVersion[]): string {
  if (currentVersions.length === 0) return 'v1.0';
  const latest = currentVersions[0];
  const match = latest.versionNumber.match(/^v?(\d+)\.(\d+)$/);
  if (!match) return `v${currentVersions.length + 1}.0`;
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  return `v${major}.${minor + 1}`;
}
