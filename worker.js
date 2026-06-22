const ALLOWED_MODELS = new Set([
  "openrouter/free",
  "owl-alpha",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "poolside/laguna-m1",
  "deepseek/deepseek-chat",
  "deepseek/deepseek-r1",
]);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CSP = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  "form-action 'self'",
].join("; ");

const BASE_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy": CSP,
  "X-Content-Type-Options": "nosniff",
};

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/") {
      return new Response(
        `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>LLM Dashboard</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; max-width: 800px; }
    label { display: block; margin-top: 1rem; font-weight: bold; }
    select, textarea, button { margin-top: 0.5rem; width: 100%; box-sizing: border-box; }
    textarea { resize: vertical; }
    button { padding: 0.5rem; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Chọn mô hình LLM</h1>
  <form method="post" action="/chat">
    <label for="model">Model:</label>
    <select name="model" id="model">
      <option value="openrouter/free">Router Free</option>
      <option value="owl-alpha">Owl Alpha</option>
      <option value="nvidia/nemotron-3-8b-instruct">Nemotron Ultra</option>
      <option value="poolside/laguna-m1">Laguna M.1</option>
              <option value="deepseek/deepseek-chat">DeepSeek V3</option>
              <option value="deepseek/deepseek-r1">DeepSeek R1</option>
    </select>
    <label for="prompt">Prompt:</label>
    <textarea name="prompt" id="prompt" rows="5" required></textarea>
    <button type="submit">Gửi</button>
  </form>
</body>
</html>`,
        { headers: BASE_HEADERS }
      );
    }

    if (pathname === "/chat" && request.method === "POST") {
      const formData = await request.formData();
      const model = formData.get("model") ?? "";
      const prompt = formData.get("prompt") ?? "";

      if (!ALLOWED_MODELS.has(model)) {
        return new Response("Model không hợp lệ.", { status: 400 });
      }

      if (!prompt.trim()) {
        return new Response("Prompt không được để trống.", { status: 400 });
      }

      let output;
      try {
        const apiRes = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: prompt }],
              max_tokens: 1024,
              temperature: 0.7,
            }),
          }
        );

        if (!apiRes.ok) {
          const errText = await apiRes.text();
          console.error("OpenRouter error", apiRes.status, errText);
          return new Response(
            `Lỗi từ API (${apiRes.status}). Vui lòng thử lại sau.`,
            { status: 502 }
          );
        }

        const result = await apiRes.json();
        output =
          result.choices?.[0]?.message?.content ?? "Không có phản hồi.";
      } catch (err) {
        console.error("Fetch failed", err);
        return new Response("Không thể kết nối tới API. Vui lòng thử lại.", {
          status: 502,
        });
      }

      return new Response(
        `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Kết quả – LLM Dashboard</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; max-width: 800px; }
    pre { white-space: pre-wrap; background: #f4f4f4; padding: 1rem; border-radius: 4px; }
    a { display: inline-block; margin-top: 1rem; }
  </style>
</head>
<body>
  <h2>Kết quả từ ${escapeHtml(model)}</h2>
  <pre>${escapeHtml(output)}</pre>
  <a href="/">&#8592; Quay lại Dashboard</a>
</body>
</html>`,
        { headers: BASE_HEADERS }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
};
