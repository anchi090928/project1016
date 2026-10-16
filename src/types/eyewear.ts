export type EyewearCategory = 'optical' | 'sunglasses' | 'sports' | 'reading' | 'kids' | 'other';

export type FrameShape =
  | 'wellington'
  | 'boston'
  | 'aviator'
  | 'cat_eye'
  | 'browline'
  | 'round'
  | 'square'
  | 'polygon'
  | 'rimless'
  | 'other';

export interface ValidationError {
  id: string;
  type: 'critical' | 'warning' | 'info';
  field: string;
  fieldLabel: string;
  message: string;
  suggestion?: string;
  suggestedValue?: any;
  autoFixable?: boolean;
}

export interface EyewearItem {
  id: string;
  sku: string; // 品號 (必填)
  name: string; // 品名/款式名稱
  category: EyewearCategory | string; // 類別: 光學/太陽/運動/老花
  frameShape: FrameShape | string; // 框型
  specCode: string; // 52□18-140
  lensWidth: number; // A 鏡圈寬度 (mm)
  bridgeWidth: number; // DBL 鼻樑寬度 (mm)
  templeLength: number; // 鏡腿長度 (mm)
  lensHeight: number; // B 鏡圈高度 (mm)
  frameWidth: number; // 鏡框總寬 (mm)
  weight: number; // 鏡框重量 (g)
  frontMaterial: string; // 前框材質
  templeMaterial: string; // 鏡腿材質
  hingeType: string; // 鉸鏈類型
  postProcessing: string; // 後製(ex.防霧、強化)
  colorCode: string; // 色號與顏色描述
  lensMaterial: string; // 鏡片材質 (TAC/PC/CR39/尼龍)
  lensCoating: string; // 鏡片鍍膜 (UV400/AR/水銀/漸變)
  uvCategory: string; // 遮光防護等級 (Cat.0 ~ Cat.4)
  lensColor: string; // 鏡片顏色
  accessories: string; // 配件 (鏡盒、拭鏡布、標籤)
  status: 'sample_review' | 'revision_needed' | 'approved' | 'mass_production';
  remarks?: string;
  errors?: ValidationError[];
  updatedAt?: string;
}

export interface EyewearVersion {
  id: string;
  versionNumber: string; // e.g. "v1.0", "v1.1", "v2.0"
  title: string;
  createdAt: string;
  createdBy: string;
  notes: string;
  items: EyewearItem[];
  isLocked?: boolean;
}

export interface FieldDiff {
  field: string;
  fieldLabel: string;
  oldVal: any;
  newVal: any;
}

export interface ItemDiff {
  sku: string;
  name: string;
  changes: FieldDiff[];
}

export interface VersionDiffResult {
  baseVersion: EyewearVersion;
  targetVersion: EyewearVersion;
  added: EyewearItem[];
  removed: EyewearItem[];
  modified: ItemDiff[];
  unchangedCount: number;
}

export interface AIAuditResult {
  overallHealthScore: number;
  generalObservations: string;
  itemAudits: Array<{
    sku: string;
    status: 'pass' | 'warning' | 'critical';
    findings: string[];
    recommendation: string;
  }>;
}
