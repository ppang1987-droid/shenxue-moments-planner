"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  Clipboard,
  Download,
  FileText,
  Link,
  Save,
  Sparkles,
  Trash2
} from "lucide-react";

const storageKeys = {
  archive: "shenxue-moments-archive-v2",
  checklist: "shenxue-moments-checklist-v2"
};

const topics = [
  {
    id: "pension",
    title: "养老与长期现金流",
    hot: "退休准备、家庭现金流、长期照护",
    angle: "从家庭责任和长期现金流出发，提醒大家先盘点现状。",
    imageFocus: "现金流时间轴、家庭责任清单、长期规划"
  },
  {
    id: "medical",
    title: "医疗支出与保障盘点",
    hot: "医疗费用、健康管理、家庭保障缺口",
    angle: "把医疗议题转成一次温和的家庭保障检查。",
    imageFocus: "三栏知识卡、保障盘点、家庭健康预算"
  },
  {
    id: "education",
    title: "教育金与家庭预算",
    hot: "教育成本、升学规划、家庭预算",
    angle: "用预算视角谈规划，不承诺收益或结果。",
    imageFocus: "教育阶段地图、预算表、家庭目标"
  },
  {
    id: "care",
    title: "照护责任与家庭分工",
    hot: "老人照护、子女责任、家庭沟通",
    angle: "把照护压力转成家庭成员可讨论的清单。",
    imageFocus: "家庭分工图、照护责任、沟通清单"
  }
];

const slots = [
  { id: "morning", time: "08:30", name: "轻观点", target: "先建立专业存在感", length: "80-120 字" },
  { id: "noon", time: "12:20", name: "知识卡", target: "午间快速阅读", length: "3 个检查点" },
  { id: "night", time: "20:40", name: "复盘", target: "服务视角收束", length: "120-180 字" }
];

const tones = [
  { id: "steady", name: "稳重专业", hint: "适合客户和同业都能看到的内容" },
  { id: "warm", name: "温和生活", hint: "更像朋友圈里的真实提醒" },
  { id: "short", name: "短句清爽", hint: "适合忙的时候快速发布" }
];

const trendExamples = [
  "最近看到不少家庭开始重新讨论养老现金流：不是马上做决定，而是先看未来十年的确定支出。",
  "医疗费用和家庭预算经常被分开看，但真正做规划时，两件事其实要放在同一张表里。",
  "教育规划不只是准备一笔钱，也是在不同阶段提前确认家庭目标和支出节奏。",
  "照护责任常常等到事情发生才被讨论，提前把分工说清楚，反而能减少很多临时压力。"
];

const riskyWords = ["保证", "稳赚", "必赔", "最高收益", "翻倍", "无风险", "一定", "躺赚"];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function buildMaterial(topic, slot, tone, customText) {
  const cue = customText.trim() || `今天看到和「${topic.hot}」有关的讨论。`;
  const toneLead = {
    steady: "从规划角度看",
    warm: "我会把它理解成一个家庭提醒",
    short: "简单说"
  }[tone.id];

  const slotText = {
    morning: `${cue}\n\n${toneLead}，很多家庭真正需要的不是马上做决定，而是先把责任、现金流和已有安排整理清楚。\n\n规划不是制造焦虑，也不是承诺结果。它更像一次定期体检，帮助一家人知道现在有什么、缺什么、下一步该问什么。`,
    noon: `${cue}\n\n可以先做三个检查：\n1. 家里现在承担哪些责任\n2. 未来三到五年有哪些确定支出\n3. 已有保障和现金流能不能互相配合\n\n先看清楚，再做选择，会比临时决定更稳。`,
    night: `${cue}\n\n今天复盘时，我更确定一件事：好的家庭规划，不是把复杂问题讲得更吓人，而是把问题拆小。\n\n先看责任，再看现金流，最后看已有安排。每一步都不用急，但每一步都值得认真看。`
  }[slot.id];

  const shortText = `${cue}\n\n先看责任，再看现金流，最后看已有安排。规划不承诺结果，只帮助家庭把问题看清楚。`;
  const post = tone.id === "short" ? shortText : slotText;

  return {
    topic: topic.title,
    slot: `${slot.time} ${slot.name}`,
    tone: tone.name,
    post,
    card: `知识卡标题：${topic.title}的 3 个检查点\n1. 家庭责任是否清楚\n2. 现金流节奏是否稳定\n3. 已有安排是否匹配\n视觉：白底、蓝绿主色、金色重点符号，右下角放申学 Family logo。\n画面重点：${topic.imageFocus}`,
    comment: "你家做规划时，一般会先看支出，还是先看已有保障？",
    chat: "您好，我今天整理了一个家庭规划的小思路：先看责任，再看现金流，最后看已有安排。您有空时可以先按这三项做个简单盘点。",
    compliance: ["不做收益承诺", "不制造焦虑", "不夸大保障", "不承诺具体产品结果"],
    createdAt: new Date().toLocaleString("zh-CN")
  };
}

function materialMarkdown(material) {
  return `# ${material.topic}｜${material.slot}

生成时间：${material.createdAt}
语气：${material.tone}

## 朋友圈正文

${material.post}

## 配图方向

${material.card}

## 评论引导

${material.comment}

## 私聊承接

${material.chat}

## 合规检查

${material.compliance.map((item) => `- ${item}`).join("\n")}
`;
}

export default function MomentsStandalonePage() {
  const checklistKey = `${storageKeys.checklist}-${todayKey()}`;
  const [topicId, setTopicId] = useState("pension");
  const [slotId, setSlotId] = useState("morning");
  const [toneId, setToneId] = useState("steady");
  const [customText, setCustomText] = useState("");
  const [material, setMaterial] = useState(null);
  const [archive, setArchive] = useState(() => loadJson(storageKeys.archive, []));
  const [checklist, setChecklist] = useState(() => loadJson(checklistKey, {}));
  const [copied, setCopied] = useState("");

  useEffect(() => {
    window.localStorage.setItem(storageKeys.archive, JSON.stringify(archive));
  }, [archive]);

  useEffect(() => {
    window.localStorage.setItem(checklistKey, JSON.stringify(checklist));
  }, [checklist, checklistKey]);

  const topic = useMemo(() => topics.find((item) => item.id === topicId) || topics[0], [topicId]);
  const slot = useMemo(() => slots.find((item) => item.id === slotId) || slots[0], [slotId]);
  const tone = useMemo(() => tones.find((item) => item.id === toneId) || tones[0], [toneId]);
  const today = new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", weekday: "short" });
  const riskHits = useMemo(() => {
    const text = [customText, material?.post, material?.chat].filter(Boolean).join("\n");
    return riskyWords.filter((word) => text.includes(word));
  }, [customText, material]);

  const generate = () => {
    setMaterial(buildMaterial(topic, slot, tone, customText));
    setCopied("");
  };

  const copyText = async (key, text) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
  };

  const saveArchive = () => {
    if (!material) return;
    setArchive((items) => [{ ...material, id: Date.now() }, ...items].slice(0, 20));
    setChecklist((items) => ({ ...items, archive: true }));
  };

  const downloadMarkdown = () => {
    if (!material) return;
    const url = URL.createObjectURL(new Blob([materialMarkdown(material)], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `申学朋友圈素材-${material.topic}-${slot.time.replace(":", "")}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearArchive = () => {
    setArchive([]);
    setChecklist((items) => ({ ...items, archive: false }));
  };

  const progress = slots.filter((item) => checklist[item.id]).length;

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
          <p>当前是独立稳定版：不依赖云端接口，先把选题、生成、复制、下载、存档和发布打卡跑顺。</p>
        </div>
        <div className="rhythm">
          {slots.map((item) => (
            <button className={slotId === item.id ? "rhythm-card active" : "rhythm-card"} key={item.id} onClick={() => setSlotId(item.id)}>
              <span>{item.time}</span>
              <strong>{item.name}</strong>
              <p>{item.target} · {item.length}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="status-strip">
        <article>
          <strong>{progress}/3</strong>
          <span>今日发布进度</span>
        </article>
        <article>
          <strong>{archive.length}</strong>
          <span>本机素材存档</span>
        </article>
        <article className={riskHits.length ? "warn" : "ok"}>
          <strong>{riskHits.length ? riskHits.length : "OK"}</strong>
          <span>{riskHits.length ? `需检查：${riskHits.join("、")}` : "合规词检查通过"}</span>
        </article>
      </section>

      <section className="workspace">
        <aside className="panel control-panel">
          <div className="panel-title">
            <CalendarCheck size={18} />
            <strong>今日输入</strong>
          </div>

          <div className="section-label">热点方向</div>
          <div className="topic-grid">
            {topics.map((item) => (
              <button className={item.id === topicId ? "active" : ""} key={item.id} onClick={() => setTopicId(item.id)}>
                <strong>{item.title}</strong>
                <span>{item.hot}</span>
              </button>
            ))}
          </div>

          <div className="section-label">语气模式</div>
          <div className="segmented">
            {tones.map((item) => (
              <button className={toneId === item.id ? "active" : ""} key={item.id} onClick={() => setToneId(item.id)} title={item.hint}>
                {item.name}
              </button>
            ))}
          </div>

          <label className="manual">
            <span>手动导入热点</span>
            <textarea value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder="粘贴微博、知乎、抖音、小红书或新闻里的热点摘要..." />
          </label>

          <div className="sample-list">
            {trendExamples.map((item) => (
              <button key={item} onClick={() => setCustomText(item)}>
                <Link size={14} />
                {item}
              </button>
            ))}
          </div>

          <button className="primary" onClick={generate}>
            <Sparkles size={17} />
            生成 {slot.time} 素材
          </button>
        </aside>

        <section className="panel output">
          <div className="panel-title output-title">
            <FileText size={18} />
            <strong>{material ? `${material.topic}｜${material.slot}` : "待生成素材"}</strong>
          </div>

          {riskHits.length ? (
            <div className="risk-box">
              <AlertTriangle size={17} />
              <span>检测到敏感表达：{riskHits.join("、")}。发布前建议改成更克制的描述。</span>
            </div>
          ) : null}

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
                  <button onClick={() => copyText("card", material.card)}><Clipboard size={15} />{copied === "card" ? "已复制" : "复制配图"}</button>
                </div>
                <div>
                  <span>私聊承接</span>
                  <p>{material.chat}</p>
                  <button onClick={() => copyText("chat", material.chat)}><Clipboard size={15} />{copied === "chat" ? "已复制" : "复制私聊"}</button>
                </div>
              </div>
              <div className="asset compact">
                <span>评论引导</span>
                <p>{material.comment}</p>
                <button onClick={() => copyText("comment", material.comment)}><Clipboard size={15} />{copied === "comment" ? "已复制" : "复制评论"}</button>
              </div>
              <div className="actions">
                <button onClick={saveArchive}><Save size={15} />存到本机</button>
                <button onClick={downloadMarkdown}><Download size={15} />下载 Markdown</button>
              </div>
            </>
          ) : (
            <div className="empty">
              <strong>先选一个热点方向和发布时间</strong>
              <span>{topic.angle}</span>
              <small>页面不会请求外部 API，所以不会因为额度或接口超时卡住。</small>
            </div>
          )}
        </section>
      </section>

      <section className="lower-grid">
        <section className="archive">
          <div className="panel-title">
            <Download size={18} />
            <strong>本机素材库</strong>
            {archive.length ? <button className="text-action" onClick={clearArchive}><Trash2 size={14} />清空</button> : null}
          </div>
          {archive.length ? archive.map((item) => (
            <article key={item.id}>
              <span>{item.createdAt} · {item.slot}</span>
              <strong>{item.topic}</strong>
              <p>{item.post.slice(0, 110)}...</p>
              <button onClick={() => copyText(`archive-${item.id}`, materialMarkdown(item))}>
                <Clipboard size={14} />
                {copied === `archive-${item.id}` ? "已复制" : "复制整包"}
              </button>
            </article>
          )) : <p className="muted">点击“存到本机”后，会保存到当前浏览器。换设备或清缓存会丢失，正式版需要接 Notion 或 Drive。</p>}
        </section>

        <section className="archive">
          <div className="panel-title">
            <Check size={18} />
            <strong>今日发布打卡</strong>
          </div>
          <div className="checklist">
            {slots.map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={Boolean(checklist[item.id])}
                  onChange={(event) => setChecklist((values) => ({ ...values, [item.id]: event.target.checked }))}
                />
                <span>{item.time}</span>
                <strong>{item.name}</strong>
              </label>
            ))}
            <label>
              <input
                type="checkbox"
                checked={Boolean(checklist.archive)}
                onChange={(event) => setChecklist((values) => ({ ...values, archive: event.target.checked }))}
              />
              <span>同步</span>
              <strong>已整理素材包</strong>
            </label>
          </div>
        </section>
      </section>
    </main>
  );
}
