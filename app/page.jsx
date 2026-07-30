"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Check, Clipboard, Download, RefreshCcw, Sparkles } from "lucide-react";

const topics = [
  {
    id: "pension",
    title: "养老与长期现金流",
    hot: "退休准备、家庭现金流、长期照护",
    angle: "从家庭责任和长期现金流出发，提醒大家先盘点现状。",
    source: "GDELT / Tavily 可接入；当前独立版用本地热点模板试跑。"
  },
  {
    id: "medical",
    title: "医疗支出与保障盘点",
    hot: "医疗费用、健康管理、家庭保障缺口",
    angle: "把新闻里的医疗议题转成一次温和的家庭保障检查。",
    source: "适合 12:20 知识卡，表达要克制，不制造焦虑。"
  },
  {
    id: "education",
    title: "教育金与家庭预算",
    hot: "教育成本、升学规划、家庭预算",
    angle: "用预算视角谈规划，而不是承诺收益或结果。",
    source: "适合轻观点或清单式卡片。"
  },
  {
    id: "care",
    title: "照护责任与家庭分工",
    hot: "老人照护、子女责任、家庭沟通",
    angle: "把照护压力转成家庭成员可讨论的规划清单。",
    source: "适合晚上复盘，语气更像服务记录。"
  }
];

const slots = [
  { time: "08:30", name: "轻观点", goal: "用 80-120 字发一个温和观察，先建立专业存在感。" },
  { time: "12:20", name: "知识卡", goal: "用 3 个检查点做配图方向，适合午间快速阅读。" },
  { time: "20:40", name: "复盘", goal: "结合今天沟通，写服务视角的收束和私聊承接。" }
];

function buildMaterial(topic, customText) {
  const cue = customText.trim() || `今天看到和「${topic.hot}」有关的讨论。`;
  return {
    topic: topic.title,
    post: `${cue}\n\n我的感受是，家庭规划最怕的不是没有答案，而是问题一直没有被整理出来。\n\n可以先问三个很朴素的问题：家里现在承担哪些责任？未来三到五年有哪些确定支出？已有保障和现金流能不能互相配合？\n\n规划不是制造焦虑，也不是承诺结果。它更像一次定期体检，帮助一家人把现状看清楚，再决定下一步。`,
    card: `知识卡标题：${topic.title}的 3 个检查点\n1. 家庭责任是否清楚\n2. 现金流节奏是否稳定\n3. 已有保障是否匹配\n视觉：白底、蓝绿主色、金色重点符号，右下角放申学 Family logo。`,
    comment: "你家做规划时，一般会先看支出，还是先看已有保障？",
    chat: "您好，我今天整理了一个家庭规划的小思路：先看责任，再看现金流，最后看已有保障。您有空时可以按这三项做个简单盘点。",
    compliance: ["不做收益承诺", "不制造焦虑", "不夸大保障", "不承诺具体产品结果"]
  };
}

export default function MomentsStandalonePage() {
  const [topicId, setTopicId] = useState("pension");
  const [customText, setCustomText] = useState("");
  const [material, setMaterial] = useState(null);
  const [archive, setArchive] = useState([]);
  const [copied, setCopied] = useState("");

  const topic = useMemo(() => topics.find((item) => item.id === topicId) || topics[0], [topicId]);
  const today = new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", weekday: "short" });

  const generate = () => {
    setMaterial(buildMaterial(topic, customText));
    setCopied("");
  };

  const copyText = async (key, text) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
  };

  const saveArchive = () => {
    if (!material) return;
    setArchive((items) => [{ ...material, id: Date.now(), date: new Date().toLocaleString("zh-CN") }, ...items].slice(0, 8));
  };

  const downloadMarkdown = () => {
    if (!material) return;
    const markdown = `# ${material.topic}\n\n## 朋友圈正文\n\n${material.post}\n\n## 配图方向\n\n${material.card}\n\n## 评论引导\n\n${material.comment}\n\n## 私聊承接\n\n${material.chat}\n\n## 合规检查\n\n${material.compliance.map((item) => `- ${item}`).join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `申学朋友圈素材-${material.topic}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="shell">
      <section className="hero">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/shenxue-family-logo.png" alt="申学 Family" />
          <div>
            <span>申学 Family</span>
            <strong>朋友圈每日规划台</strong>
          </div>
        </div>
        <div className="hero-copy">
          <span className="eyebrow">DAILY MOMENTS PLANNER · {today}</span>
          <h1>把今天的热点，转成可以安心发布的朋友圈素材。</h1>
          <p>独立试用版先走本地生成逻辑，保证页面稳定可用；OpenAI、Tavily、知乎等接口后续接回云端版本。</p>
        </div>
        <div className="rhythm">
          {slots.map((slot) => (
            <article key={slot.time}>
              <span>{slot.time}</span>
              <strong>{slot.name}</strong>
              <p>{slot.goal}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace">
        <aside className="panel">
          <div className="panel-title">
            <CalendarCheck size={18} />
            <strong>今日热点方向</strong>
          </div>
          <div className="topic-grid">
            {topics.map((item) => (
              <button className={item.id === topicId ? "active" : ""} key={item.id} onClick={() => setTopicId(item.id)}>
                <strong>{item.title}</strong>
                <span>{item.hot}</span>
              </button>
            ))}
          </div>
          <label className="manual">
            <span>手动导入热点</span>
            <textarea value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder="粘贴微博、知乎、抖音、小红书或新闻里的热点摘要..." />
          </label>
          <button className="primary" onClick={generate}>
            <Sparkles size={17} />
            生成朋友圈素材
          </button>
        </aside>

        <section className="panel output">
          <div className="panel-title">
            <RefreshCcw size={18} />
            <strong>{material ? material.topic : "待生成素材"}</strong>
          </div>
          {material ? (
            <>
              <div className="asset">
                <span>朋友圈正文</span>
                <p>{material.post}</p>
                <button onClick={() => copyText("post", material.post)}><Clipboard size={15} />{copied === "post" ? "已复制" : "复制正文"}</button>
              </div>
              <div className="asset two">
                <div>
                  <span>配图方向</span>
                  <p>{material.card}</p>
                </div>
                <div>
                  <span>私聊承接</span>
                  <p>{material.chat}</p>
                </div>
              </div>
              <div className="actions">
                <button onClick={saveArchive}><Check size={15} />临时存档</button>
                <button onClick={downloadMarkdown}><Download size={15} />下载 Markdown</button>
              </div>
            </>
          ) : (
            <div className="empty">
              <strong>先选一个热点方向</strong>
              <span>{topic.angle}</span>
              <small>{topic.source}</small>
            </div>
          )}
        </section>
      </section>

      <section className="archive">
        <div className="panel-title">
          <Download size={18} />
          <strong>本次会话存档</strong>
        </div>
        {archive.length ? archive.map((item) => (
          <article key={item.id}>
            <span>{item.date}</span>
            <strong>{item.topic}</strong>
            <p>{item.post.slice(0, 90)}...</p>
          </article>
        )) : <p className="muted">生成后点击“临时存档”，会先保存在当前浏览器会话里。</p>}
      </section>
    </main>
  );
}
