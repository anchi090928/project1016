# 眼鏡樣品總表智能解析與規格管理系統 (Eyewear Master Sheet AI Specification Management System)

專為眼鏡製造、外銷貿易及品牌設計團隊打造的眼鏡樣品總表智能解析、規格管理、幾何衝突檢測與多維度版本比對系統。

---

## 🌟 主要功能特點

1. **智能樣品表解析 (AI Smart Parsing)**
   - 支援 Excel 格式上傳（標準 / 非標準各類廠商格式）
   - 支援 混亂文字、複製貼上表格直接解析
   - 支援 規格照片、樣品卡視覺辨識（Gemini Multimodal OCR）
   - 自動提取 SKU、款式、框型、尺寸標註（A/DBL/鏡腿/鏡高/總寬）、材質、鉸鏈型式、後製防霧/強化工藝、鏡片規格等 18 項關鍵指標

2. **工業級規格矛盾與品質審查 (AI Deep Specs Audit)**
   - 尺寸幾何矛盾檢測（總寬、鏡寬、鼻樑寬、鏡高等數值邏輯校驗）
   - 後製工藝與材質相容性檢查（如板料高溫真空電鍍、CR-39無框脆性、純鈦超重預警等）
   - 表面處理與光學等級完整性診斷，自動輸出整體品質健康度評分與修改建議

3. **樣品規格視覺化工程藍圖 (Blueprint Diagram)**
   - 依據標註數據實時動態渲染眼鏡工程圖與尺寸分佈標記

4. **多款式多維度規格比對 (Comparison Matrix)**
   - 橫向對比多款樣品的結構、重量、表面處理工藝與配件規格

5. **版本變更追蹤 (Version Diff Viewer)**
   - 記錄每次修改歷史，精準比對版本間的尺寸與工藝差異

6. **標準規格總表匯出 (Excel Export)**
   - 一鍵匯出符合國際驗收標準的眼鏡樣品總表 Excel 檔案

---

## 🚀 本地開發與啟動 (Local Development)

### 系統需求
- Node.js 20+

### 安裝與啟動
1. 安裝相依套件：
   ```bash
   npm install --legacy-peer-deps
   ```
2. 設定環境變數（可參考 `.env.example`）：
   ```env
   GEMINI_API_KEY="您的_GEMINI_API_KEY"
   ```
3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```
4. 建置生產環境版本：
   ```bash
   npm run build
   ```

---

## ☁️ Cloudflare Pages 雲端部署

本專案已完整適配 **Cloudflare Pages**：
- **靜態前端**：由 Cloudflare 全球 CDN 高速交付 (`dist/`)
- **無伺服器後端**：透過 Cloudflare Pages Functions (`functions/api/`) 提供 `/api/parse-sample` 與 `/api/ai-audit` API 服務
- **路由重定向**：內建 `public/_redirects` 確保 SPA 單頁應用程式深度連結正常運行
- **線上訪問網址**：https://project1016.pages.dev
