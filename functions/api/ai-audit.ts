interface Env {
  GEMINI_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json() as { items?: any[] };
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return new Response(JSON.stringify({ error: '請提供要檢驗的樣品規格清單' }), {
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

    const systemInstruction = '你是一位資深眼鏡品管主任與模具結構專家。請客觀且嚴謹地提供審查診斷。';
    const auditPrompt = `請以國際眼鏡產業品質驗收標準與製造工藝原理，深入審查以下眼鏡樣品規格清單。
檢查各眼鏡是否存在：
1. 尺寸幾何矛盾 (如總寬小於2倍鏡寬+鼻樑寬、鏡高異常過大或過小)
2. 後製工藝與材質不相容 (如純板料進行高溫真空電鍍易變形、無框架使用脆性未加硬CR39鏡片、超輕純鈦標記超過35g重)
3. 表面處理標記不完整或鏡片光學防護等級缺失
4. 規格代號 (如 52□18-140) 與個別長度欄位數值矛盾

請審查清單：
${JSON.stringify(items, null, 2)}`;

    const schema = {
      type: "OBJECT",
      properties: {
        overallHealthScore: { type: "NUMBER", description: "樣品規格總體品質評分 0-100" },
        generalObservations: { type: "STRING", description: "總體審查診斷說明" },
        itemAudits: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              sku: { type: "STRING" },
              status: { type: "STRING", description: "pass | warning | critical" },
              findings: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              recommendation: { type: "STRING" }
            },
            required: ["sku", "status", "findings"]
          }
        }
      },
      required: ["overallHealthScore", "itemAudits"]
    };

    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [{ role: 'user', parts: [{ text: auditPrompt }] }],
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
      error: 'AI 規格檢測執行失敗',
      details: error?.message || String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
