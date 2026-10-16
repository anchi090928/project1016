interface Env {
  GEMINI_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json() as { rawText?: string; imageBase64?: string; mimeType?: string };
    const { rawText, imageBase64, mimeType } = body;

    if (!rawText && !imageBase64) {
      return new Response(JSON.stringify({ error: '請提供樣品表文字內容或圖片' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: '未設定 GEMINI_API_KEY。請至 Cloudflare Pages 專案設定中加入環境變數 GEMINI_API_KEY。',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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

    const schema = {
      type: "OBJECT",
      properties: {
        items: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              sku: { type: "STRING" },
              name: { type: "STRING" },
              category: { type: "STRING" },
              frameShape: { type: "STRING" },
              specCode: { type: "STRING" },
              lensWidth: { type: "NUMBER" },
              bridgeWidth: { type: "NUMBER" },
              templeLength: { type: "NUMBER" },
              lensHeight: { type: "NUMBER" },
              frameWidth: { type: "NUMBER" },
              weight: { type: "NUMBER" },
              frontMaterial: { type: "STRING" },
              templeMaterial: { type: "STRING" },
              hingeType: { type: "STRING" },
              postProcessing: { type: "STRING" },
              colorCode: { type: "STRING" },
              lensMaterial: { type: "STRING" },
              lensCoating: { type: "STRING" },
              uvCategory: { type: "STRING" },
              lensColor: { type: "STRING" },
              accessories: { type: "STRING" },
              remarks: { type: "STRING" }
            },
            required: ["sku", "postProcessing", "specCode"]
          }
        },
        detectedFormat: { type: "STRING" },
        summary: { type: "STRING" }
      },
      required: ["items"]
    };

    let contentsParts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, '');
      contentsParts = [
        {
          inline_data: {
            mime_type: mimeType || 'image/jpeg',
            data: cleanBase64
          }
        },
        {
          text: '請辨識這張眼鏡樣品總表/規格圖中的所有眼鏡款式資訊，轉換成標準規格清單。'
        }
      ];
    } else {
      contentsParts = [
        {
          text: `請辨識並結構化以下眼鏡樣品總表內容：\n\n${rawText}`
        }
      ];
    }

    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [{ role: 'user', parts: contentsParts }],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: schema
      }
    };

    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let lastErr = '';
    let parsedResult = null;

    for (const model of models) {
      try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!resp.ok) {
          const errText = await resp.text();
          lastErr = `${model} returned ${resp.status}: ${errText}`;
          continue;
        }
        const data: any = await resp.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          parsedResult = JSON.parse(candidateText);
          break;
        }
      } catch (err: any) {
        lastErr = err.message || String(err);
      }
    }

    if (!parsedResult) {
      throw new Error(lastErr || '未能從 Gemini 獲取有效回應');
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'AI 辨識樣品表失敗，請檢查內容或格式',
      details: error?.message || String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
