import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 6;
const rateBuckets = globalThis.__shenxueImageRateBuckets || new Map();
globalThis.__shenxueImageRateBuckets = rateBuckets;

function safeText(value, maxLength = 600) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function matchesAccessCode(received, expected) {
  const left = Buffer.from(String(received || ""));
  const right = Buffer.from(String(expected || ""));
  return left.length === right.length && timingSafeEqual(left, right);
}

function allowRequest(ip) {
  const now = Date.now();
  const recent = (rateBuckets.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  rateBuckets.set(ip, [...recent, now]);
  return true;
}

function buildPrompt(input) {
  const title = safeText(input.title, 120);
  const subtitle = safeText(input.subtitle, 180);
  const insight = safeText(input.insight, 320);
  const question = safeText(input.question, 240);
  const modules = Array.isArray(input.modules) ? input.modules.map((item) => safeText(item, 80)).filter(Boolean).slice(0, 3) : [];

  return `
为“申学 Family”家庭规划科普内容创作一张高端朋友圈竖版视觉底图。

内容主题：${title}
核心认知：${insight || subtitle}
画面线索：${modules.join("、") || "家庭责任、现金流、长期规划"}
思考问题：${question}

视觉方向：真实、温和、克制的中国家庭生活场景与编辑式信息图结合。可以出现家庭成员整理资料、共同讨论计划、查看时间轴或清单的自然动作；人物为中国家庭形象，不直视镜头，不摆拍。使用白色和浅灰留白、申学品牌蓝绿为主色、少量暖金提示重点。画面专业、可信、安静，适合保险与家庭财务科普，但不要出现保险产品、保单推销、现金堆叠、收益数字或焦虑表情。

构图要求：3:4 竖版；顶部约 28% 保持干净、浅色、低细节，供后期叠加中文标题和真实 Logo；主体放在中下部；底部保留安全留白。画面应有明确的信息层级和一个可识别的家庭规划动作，不做装饰性科技背景。

严格限制：图片中不要生成任何文字、汉字、字母、数字、Logo、品牌标志、二维码、水印、边框或界面按钮。不要伪造“申学 Family”Logo，品牌与中文标题将在生成后由程序准确叠加。
  `.trim();
}

async function imageBytesFromResponse(data) {
  const first = data?.data?.[0];
  if (first?.b64_json) return first.b64_json;
  if (!first?.url) return "";
  const response = await fetch(first.url);
  if (!response.ok) return "";
  return Buffer.from(await response.arrayBuffer()).toString("base64");
}

export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const accessCode = process.env.IMAGE_GENERATION_ACCESS_CODE;

  if (!apiKey || !accessCode) {
    return Response.json({ error: "AI 生图尚未完成服务器配置。", code: "not_configured" }, { status: 503 });
  }

  if (!matchesAccessCode(request.headers.get("x-image-access-code"), accessCode)) {
    return Response.json({ error: "生图口令不正确。", code: "unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowRequest(ip)) {
    return Response.json({ error: "本小时生成次数已用完，请稍后再试。", code: "rate_limited" }, { status: 429 });
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "生图内容格式不正确。", code: "invalid_request" }, { status: 400 });
  }

  if (!safeText(input?.title, 120)) {
    return Response.json({ error: "请先生成朋友圈素材，再生成配图。", code: "missing_title" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
        prompt: buildPrompt(input),
        size: "1024x1536",
        quality: "medium",
        output_format: "jpeg",
        output_compression: 82,
        n: 1
      }),
      signal: controller.signal
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI image generation failed", response.status, data?.error?.code || "unknown");
      const status = response.status === 429 ? 429 : 502;
      const error = response.status === 429 ? "OpenAI 生图额度或频率受限，请稍后再试。" : "AI 图片生成失败，请稍后重试。";
      return Response.json({ error, code: "generation_failed" }, { status });
    }

    const base64 = await imageBytesFromResponse(data);
    if (!base64) {
      return Response.json({ error: "没有收到可用图片，请重新生成。", code: "empty_image" }, { status: 502 });
    }

    return Response.json({ image: `data:image/jpeg;base64,${base64}` });
  } catch (error) {
    const message = error?.name === "AbortError" ? "AI 生图等待超时，请重新尝试。" : "AI 图片生成失败，请稍后重试。";
    return Response.json({ error: message, code: "generation_failed" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
