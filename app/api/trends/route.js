export const dynamic = "force-dynamic";

const planningQueries = [
  "家庭 养老 现金流 医疗 支出 教育 预算 照护",
  "家庭财务 养老 医疗 教育 照护 责任",
  "退休 医疗费用 教育成本 家庭预算"
];

const fallbackTrends = [
  {
    id: "fallback-pension",
    title: "多地讨论养老准备和家庭现金流安排",
    summary: "养老、照护、医疗支出正在成为中年家庭重新盘点长期现金流的现实入口。",
    source: "内置兜底",
    url: "",
    publishedAt: "",
    channel: "fallback"
  },
  {
    id: "fallback-medical",
    title: "医疗支出和陪护时间成为家庭预算讨论焦点",
    summary: "住院费用之外，收入中断、异地陪护、康复期支出也会影响家庭安排。",
    source: "内置兜底",
    url: "",
    publishedAt: "",
    channel: "fallback"
  },
  {
    id: "fallback-education",
    title: "教育成本上升让父母重新审视家庭预算",
    summary: "教育规划不只是学费，还包括培训、择校、生活半径和家庭现金流弹性。",
    source: "内置兜底",
    url: "",
    publishedAt: "",
    channel: "fallback"
  }
];

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function stripHtml(value = "") {
  return decodeXml(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.title}-${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return Boolean(item.title);
  });
}

async function fetchGoogleNews() {
  const query = encodeURIComponent("家庭 养老 医疗 教育 照护 现金流");
  const response = await fetch(`https://news.google.com/rss/search?q=${query}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`, {
    next: { revalidate: 900 }
  });
  if (!response.ok) return [];
  const xml = await response.text();
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

  return itemBlocks.slice(0, 10).map((block, index) => {
    const title = stripHtml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "");
    const summary = stripHtml(block.match(/<description>([\s\S]*?)<\/description>/)?.[1] || title);
    const url = decodeXml(block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "");
    const publishedAt = stripHtml(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "");
    const source = stripHtml(block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "Google News");

    return {
      id: `google-news-${index}-${title}`,
      title,
      summary,
      source,
      url,
      publishedAt,
      channel: "google-news"
    };
  });
}

async function fetchTavily() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const results = [];
  for (const query of planningQueries.slice(0, 2)) {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        max_results: 4,
        include_answer: false,
        include_raw_content: false
      }),
      next: { revalidate: 900 }
    });

    if (!response.ok) continue;
    const data = await response.json();
    (data.results || []).forEach((item, index) => {
      results.push({
        id: `tavily-${query}-${index}`,
        title: item.title,
        summary: item.content || item.title,
        source: item.url ? new URL(item.url).hostname.replace(/^www\./, "") : "Tavily",
        url: item.url || "",
        publishedAt: "",
        channel: "tavily"
      });
    });
  }
  return results;
}

async function fetchGdelt() {
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", "(养老 OR 医疗 OR 教育 OR 照护 OR 家庭预算 OR 现金流)");
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", "12");
  url.searchParams.set("sort", "DateDesc");

  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) return [];
  const data = await response.json();
  return (data.articles || []).map((item, index) => ({
    id: `gdelt-${index}-${item.url}`,
    title: item.title,
    summary: item.seendate ? `新闻时间：${item.seendate}` : item.title,
    source: item.domain || "GDELT",
    url: item.url || "",
    publishedAt: item.seendate || "",
    channel: "gdelt"
  }));
}

export async function GET() {
  try {
    const [tavilyItems, googleNewsItems, gdeltItems] = await Promise.allSettled([fetchTavily(), fetchGoogleNews(), fetchGdelt()]);
    const items = dedupe([
      ...(tavilyItems.status === "fulfilled" ? tavilyItems.value : []),
      ...(googleNewsItems.status === "fulfilled" ? googleNewsItems.value : []),
      ...(gdeltItems.status === "fulfilled" ? gdeltItems.value : [])
    ]).slice(0, 12);

    const mode = items.length
      ? (process.env.TAVILY_API_KEY ? "tavily+google-news+gdelt" : "google-news+gdelt")
      : "fallback";

    return Response.json({
      updatedAt: new Date().toISOString(),
      mode,
      items: items.length ? items : fallbackTrends
    });
  } catch (error) {
    return Response.json({
      updatedAt: new Date().toISOString(),
      mode: "fallback",
      error: error instanceof Error ? error.message : "unknown error",
      items: fallbackTrends
    });
  }
}
