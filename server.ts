import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Gemini client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API: Smart Parse Eyewear Master Sheet using Gemini 3.8 Flash
app.post('/api/parse-sample', async (req, res) => {
  try {
    const { rawText, imageBase64, mimeType } = req.body;

    if (!rawText && !imageBase64) {
      return res.status(400).json({ error: '請提供樣品表文字內容或圖片' });
    }

    const systemInstruction = `你是一位資深眼鏡製造業與外銷樣品規格工程師。
你的任務是解析使用者上傳的各類眼鏡樣品總表（可能是供應商非標準 Excel 文字、混亂表格、或照片掃描件）。
請精確辨識並結構化提取每一款眼鏡的詳細資料：
1. 品號 (sku, 型號/貨號)
2. 品名/款式 (name)
3. 類別 (category): optical (光學鏡框), sunglasses (太陽眼鏡), sports (運動風鏡), reading (老花/閱讀), kids (兒童鏡框)
4. 框型 (frameShape): wellington (威靈頓), boston (波士頓), aviator (飛行員), cat_eye (貓眼), browline (眉架), round (圓框), square (方框), polygon (多角幾何), rimless (無框/半框), other (其他)
5. 規格標註 (specCode, 例如 52□18-140 或 54-17-142)
6. 鏡圈寬度 A (lensWidth, mm 數字, 正常 40-66)
7. 鼻樑寬度 DBL (bridgeWidth, mm 數字, 正常 12-24)
8. 鏡腿長度 (templeLength, mm 數字, 正常 125-155)
9. 鏡圈高度 B (lensHeight, mm 數字, 正常 25-55)
10. 鏡框總寬 (frameWidth, mm 數字, 正常大約是 A*2 + DBL + 邊框厚度)
11. 重量 (weight, g 數字, 正常 10-35)
12. 前框材質 (frontMaterial: 如 純鈦, β鈦, 醋酸纖維板料, TR90, 不鏽鋼)
13. 鏡腿材質 (templeMaterial: 如 鈦合金, 板料包芯, 記憶金屬)
14. 鉸鏈型式 (hingeType: 如 彈簧鉸鏈, 無螺絲一體鉸鏈, 五枚蝶番, 標準鉸鏈)
15. 後製(ex.防霧、強化) (postProcessing: 完整描述，如「鏡片雙面奈米防霧鍍膜 + 高耐磨強化加硬 (4H) + IP真空超耐磨電鍍」)
16. 後製細節 (finishingDetails: plating 電鍍規格, coating 烤漆/塗層, polishing 拋光工藝, special 特殊細節, colorCode 色號)
17. 鏡片規格 (lensSpec: material 鏡片材質如偏光TAC/CR-39/PC, coating 鍍膜如抗UV400/AR藍膜/雙面水銀, uvCategory 如 Cat.3, color 鏡片顏色)
18. 配件與備註 (accessories, remarks)

請務必嚴格輸出合法 JSON 格式。`;

    let response;

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, '');
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/jpeg',
              },
            },
            {
              text: '請辨識這張眼鏡樣品總表/規格圖中的所有眼鏡款式資訊，轉換成標準規格清單。',
            },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sku: { type: Type.STRING },
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    frameShape: { type: Type.STRING },
                    specCode: { type: Type.STRING },
                    lensWidth: { type: Type.NUMBER },
                    bridgeWidth: { type: Type.NUMBER },
                    templeLength: { type: Type.NUMBER },
                    lensHeight: { type: Type.NUMBER },
                    frameWidth: { type: Type.NUMBER },
                    weight: { type: Type.NUMBER },
                    frontMaterial: { type: Type.STRING },
                    templeMaterial: { type: Type.STRING },
                    hingeType: { type: Type.STRING },
                    postProcessing: { type: Type.STRING },
                    colorCode: { type: Type.STRING },
                    lensMaterial: { type: Type.STRING },
                    lensCoating: { type: Type.STRING },
                    uvCategory: { type: Type.STRING },
                    lensColor: { type: Type.STRING },
                    accessories: { type: Type.STRING },
                    remarks: { type: Type.STRING },
                  },
                  required: ['sku', 'postProcessing', 'specCode'],
                },
              },
              detectedFormat: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ['items'],
          },
        },
      });
    } else {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `請辨識並結構化以下眼鏡樣品總表內容：\n\n${rawText}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sku: { type: Type.STRING },
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    frameShape: { type: Type.STRING },
                    specCode: { type: Type.STRING },
                    lensWidth: { type: Type.NUMBER },
                    bridgeWidth: { type: Type.NUMBER },
                    templeLength: { type: Type.NUMBER },
                    lensHeight: { type: Type.NUMBER },
                    frameWidth: { type: Type.NUMBER },
                    weight: { type: Type.NUMBER },
                    frontMaterial: { type: Type.STRING },
                    templeMaterial: { type: Type.STRING },
                    hingeType: { type: Type.STRING },
                    postProcessing: { type: Type.STRING },
                    colorCode: { type: Type.STRING },
                    lensMaterial: { type: Type.STRING },
                    lensCoating: { type: Type.STRING },
                    uvCategory: { type: Type.STRING },
                    lensColor: { type: Type.STRING },
                    accessories: { type: Type.STRING },
                    remarks: { type: Type.STRING },
                  },
                  required: ['sku', 'postProcessing', 'specCode'],
                },
              },
              detectedFormat: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ['items'],
          },
        },
      });
    }

    const result = JSON.parse(response.text || '{}');
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/parse-sample:', error);
    return res.status(500).json({
      error: 'AI 辨識樣品表失敗，請檢查內容或格式',
      details: error?.message || String(error),
    });
  }
});

// API: AI Deep Eyewear Specs Audit (檢驗眼鏡規格衝突與工藝相容性)
app.post('/api/ai-audit', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: '請提供要檢驗的樣品規格清單' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `請以國際眼鏡產業品質驗收標準與製造工藝原理，深入審查以下眼鏡樣品規格清單。
檢查各眼鏡是否存在：
1. 尺寸幾何矛盾 (如總寬小於2倍鏡寬+鼻樑寬、鏡高異常過大或過小)
2. 後製工藝與材質不相容 (如純板料進行高溫真空電鍍易變形、無框架使用脆性未加硬CR39鏡片、超輕純鈦標記超過35g重)
3. 表面處理標記不完整或鏡片光學防護等級缺失
4. 規格代號 (如 52□18-140) 與個別長度欄位數值矛盾

請審查清單：
${JSON.stringify(items, null, 2)}`,
      config: {
        systemInstruction: '你是一位資深眼鏡品管主任與模具結構專家。請客觀且嚴謹地提供審查診斷。',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallHealthScore: { type: Type.NUMBER, description: '樣品規格總體品質評分 0-100' },
            generalObservations: { type: Type.STRING, description: '總體審查診斷說明' },
            itemAudits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sku: { type: Type.STRING },
                  status: { type: Type.STRING, description: 'pass | warning | critical' },
                  findings: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  recommendation: { type: Type.STRING },
                },
                required: ['sku', 'status', 'findings'],
              },
            },
          },
          required: ['overallHealthScore', 'itemAudits'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai-audit:', error);
    return res.status(500).json({
      error: 'AI 規格檢測執行失敗',
      details: error?.message || String(error),
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

startServer();
