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
    audience: "45 岁以上家庭、上有老下有小的中坚家庭",
    angle: "从家庭责任和长期现金流出发，提醒大家先盘点现状。",
    insight: "养老不是某一个年龄点才开始的决定，而是一组长期支出的提前排序。",
    misread: "把养老规划理解成买一个产品，容易忽略医疗、照护、住房和子女支持这些真实支出。",
    question: "如果未来十年收入节奏变化，家里的固定责任谁来接住？",
    imageFocus: "现金流时间轴、家庭责任清单、长期规划",
    visualModules: ["家庭责任时间轴", "固定支出清单", "已有安排盘点"]
  },
  {
    id: "medical",
    title: "医疗支出与保障盘点",
    hot: "医疗费用、健康管理、家庭保障缺口",
    audience: "有老人、有孩子、正在关注健康管理的家庭",
    angle: "把医疗议题转成一次温和的家庭保障检查。",
    insight: "医疗风险最难的地方，不是某一张账单，而是它会同时影响现金流、照护时间和家庭分工。",
    misread: "只讨论报销比例，容易漏掉收入中断、异地照护和康复期支出。",
    question: "家里如果有人住院三个月，钱、时间和照护由谁分别承担？",
    imageFocus: "三栏知识卡、保障盘点、家庭健康预算",
    visualModules: ["医疗费用分层", "照护时间表", "保障缺口提醒"]
  },
  {
    id: "education",
    title: "教育金与家庭预算",
    hot: "教育成本、升学规划、家庭预算",
    audience: "0-18 岁孩子家庭、准备升学或留学预算的父母",
    angle: "用预算视角谈规划，不承诺收益或结果。",
    insight: "教育规划的重点不是预测孩子会走哪条路，而是让家庭在不同选择前都有余地。",
    misread: "只盯着学费总额，容易低估培训、生活、择校、陪伴时间带来的连锁成本。",
    question: "孩子下一阶段最确定的支出是什么，最不确定的选择又是什么？",
    imageFocus: "教育阶段地图、预算表、家庭目标",
    visualModules: ["教育阶段地图", "确定支出表", "弹性预算区"]
  },
  {
    id: "care",
    title: "照护责任与家庭分工",
    hot: "老人照护、子女责任、家庭沟通",
    audience: "独生子女家庭、三明治家庭、异地照护家庭",
    angle: "把照护压力转成家庭成员可讨论的清单。",
    insight: "照护问题表面是时间安排，背后其实是钱、精力、情绪和家庭共识的再分配。",
    misread: "等事情发生再商量，往往会把本来可以分担的问题变成临时冲突。",
    question: "如果父母需要长期陪诊或照护，家庭里谁能出时间，谁能出钱，谁负责协调？",
    imageFocus: "家庭分工图、照护责任、沟通清单",
    visualModules: ["照护分工表", "家庭沟通问题", "应急联系人清单"]
  }
];

const slots = [
  { id: "morning", time: "08:30", name: "轻观点", target: "先建立专业存在感", length: "80-120 字" },
  { id: "noon", time: "12:20", name: "知识卡", target: "午间快速阅读", length: "3 个检查点" },
  { id: "night", time: "20:40", name: "复盘", target: "服务视角收束", length: "120-180 字" }
];

const tones = [
  { id: "steady", name: "稳重专业", hint: "适合客户和同业都能看到的内容", voice: "克制、清楚、有服务视角" },
  { id: "warm", name: "温和生活", hint: "更像朋友圈里的真实提醒", voice: "像一次认真聊天，不说教" },
  { id: "short", name: "短句清爽", hint: "适合忙的时候快速发布", voice: "短句、有停顿、适合直接发" }
];

const trendExamples = [
  "今天刷到一个讨论：很多家庭开始重新算父母养老和自己退休的现金流，焦点不是缺不缺钱，而是未来十年哪些支出一定会发生。",
  "有个热帖说住院账单只是表面压力，真正难的是陪护时间、收入中断和康复期安排，这其实很适合转成家庭保障盘点。",
  "最近升学预算讨论很多，大家不是单纯焦虑学费，而是发现培训、择校、生活半径和家庭现金流都绑在一起。",
  "照护话题又热了。很多人说最难的不是孝不孝顺，而是事情突然发生时，家庭里没有提前说清楚分工。"
];

const riskyWords = ["保证", "稳赚", "必赔", "最高收益", "翻倍", "无风险", "一定", "躺赚"];
const qualityRules = ["有具体家庭场景", "有误区修正", "有可执行问题", "不做产品承诺"];

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
  const opening = {
    steady: "这类热点不太适合简单跟风，更适合拿来做一次家庭规划复盘。",
    warm: "我看到这类讨论时，第一反应不是焦虑，而是想起很多家庭平时不太会坐下来聊这件事。",
    short: "热点会过去，但家庭责任不会自动消失。"
  }[tone.id];

  const slotText = {
    morning: `${cue}\n\n${opening}\n\n${topic.insight}\n\n我更建议先问一个问题：${topic.question}\n\n把这个问题想清楚，再谈工具和方案，心里会稳很多。`,
    noon: `${cue}\n\n午间可以先做一个小盘点：\n1. 这件事影响的是谁的责任\n2. 未来 3 到 5 年有没有确定支出\n3. 现有现金流和保障安排能不能互相配合\n\n很多规划不是从买什么开始，而是从看清楚家庭结构开始。`,
    night: `${cue}\n\n今天复盘这个话题，我会把重点放在一个判断上：${topic.misread}\n\n家庭规划真正有价值的地方，是把一团压力拆成可以讨论、可以排序、可以慢慢补齐的事项。\n\n不急着下结论，先把问题讲清楚，已经是很重要的一步。`
  }[slot.id];

  const shortText = `${cue}\n\n${topic.insight}\n\n先问自己一句：${topic.question}\n\n规划不制造焦虑，也不承诺结果，只帮助家庭把问题看清楚。`;
  const post = tone.id === "short" ? shortText : slotText;
  const title = {
    morning: `${topic.title}，先问对问题`,
    noon: `${topic.title}的 3 个盘点动作`,
    night: `今天复盘：别把${topic.title}想窄了`
  }[slot.id];

  return {
    topic: topic.title,
    slot: `${slot.time} ${slot.name}`,
    tone: tone.name,
    title,
    strategy: {
      audience: topic.audience,
      angle: topic.angle,
      insight: topic.insight,
      boundary: "只做家庭规划提醒，不承诺收益、不暗示产品结果、不制造焦虑。"
    },
    post,
    card: `主标题：${title}\n副标题：先看家庭责任，再看现金流，再看已有安排\n画面结构：${topic.visualModules.join(" / ")}\n视觉要求：白底留白，蓝绿主色，金色只做重点提示，右下角放申学 Family logo。\n底部小字：内容仅作家庭规划思路参考，不构成具体产品建议。`,
    comment: `你觉得${topic.title}最容易被忽略的是钱、时间，还是家庭沟通？`,
    chat: `您好，我今天整理了一个关于「${topic.title}」的小盘点。它不涉及具体产品，主要是帮助家庭先看清责任、现金流和已有安排。您有空的话，可以先从这个问题开始：${topic.question}`,
    extensions: [
      `明天可以延展：${topic.title}的家庭责任清单`,
      `本周可以做一张：${topic.visualModules[0]}朋友圈知识卡`,
      `私域承接可以问：现在家里最确定的一笔长期支出是什么`
    ],
    compliance: ["不做收益承诺", "不制造焦虑", "不夸大保障", "不承诺具体产品结果"],
    quality: qualityRules,
    createdAt: new Date().toLocaleString("zh-CN")
  };
}

function materialMarkdown(material) {
  return `# ${material.topic}｜${material.slot}

生成时间：${material.createdAt}
语气：${material.tone}

## 朋友圈正文

${material.post}

## 选题判断

- 面向人群：${material.strategy.audience}
- 内容角度：${material.strategy.angle}
- 专业判断：${material.strategy.insight}
- 合规边界：${material.strategy.boundary}

## 配图方向

${material.card}

## 评论引导

${material.comment}

## 私聊承接

${material.chat}

## 延展选题

${material.extensions.map((item) => `- ${item}`).join("\n")}

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
              <div className="brief-grid">
                <article>
                  <span>面向人群</span>
                  <strong>{material.strategy.audience}</strong>
                </article>
                <article>
                  <span>内容判断</span>
                  <strong>{material.strategy.insight}</strong>
                </article>
                <article>
                  <span>合规边界</span>
                  <strong>{material.strategy.boundary}</strong>
                </article>
              </div>

              <div className="asset">
                <span>朋友圈正文</span>
                <h2>{material.title}</h2>
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
              <div className="quality-list">
                {material.quality.map((item) => (
                  <span key={item}><Check size={14} />{item}</span>
                ))}
              </div>
              <div className="asset compact">
                <span>评论引导</span>
                <p>{material.comment}</p>
                <button onClick={() => copyText("comment", material.comment)}><Clipboard size={15} />{copied === "comment" ? "已复制" : "复制评论"}</button>
              </div>
              <div className="asset">
                <span>二次延展</span>
                <ul className="extension-list">
                  {material.extensions.map((item) => <li key={item}>{item}</li>)}
                </ul>
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
