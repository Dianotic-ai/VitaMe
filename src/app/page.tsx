// file: src/app/page.tsx — VitaMe landing 主页（v0.4 D19 上线）
//
// 设计稿 1:1 还原自 2024-4-28彩蛋ui设计/0429/vitame_landing_design_final_package/vitame_landing_design_final.html
// 保留全部 inline CSS + :root vars + @media query，用 styled-jsx 写
// 视觉契约：水彩温和 + 圆角 30px + 软阴影 + Inter body / Georgia display
// 按钮统一跳 /chat
//
// 资源：public/landing/ 下 7 张 PNG（hero-seed / cta-landscape / features-rendered + 4 个 feature 单图）

import Link from 'next/link';
import { VitaMeLogo } from '@/components/brand/VitaMeLogo';
import { SeedSproutStage } from '@/components/brand/SeedSproutStage';

export const metadata = {
  title: 'VitaMe｜补剂安全翻译 Agent',
  description: '辨别之后，安心生长。补剂安全翻译 Agent，帮你看懂成分、风险与证据。',
};

export default function HomePage() {
  return (
    <div className="vitame-landing">
      <header>
        <div className="container nav">
          <Link href="/" className="brand-link" aria-label="VitaMe 首页">
            <VitaMeLogo size={56} variant="horizontal" />
          </Link>
          <nav className="links">
            <a href="#features">产品功能</a>
            <a href="#process">如何使用</a>
            <a href="#evidence">科学证据</a>
            <a href="#about">关于我们</a>
            <a href="#blog">博客</a>
          </nav>
          <Link className="btn" href="/chat">开始提问</Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <div className="eyebrow">SUPPLEMENT SAFETY AGENT</div>
              <h1 className="headline serif">辨别之后，<br/>安心生长</h1>
              <p className="subhead">补剂安全翻译 Agent，帮你看懂成分、风险与证据。</p>
              <Link className="ask" href="/chat">
                <div>
                  <div className="ask-title">我能不能吃这个补剂？</div>
                  <div className="ask-input">例如：辅酶Q10、鱼油、维生素D…</div>
                </div>
                <div className="round">→</div>
              </Link>
              <div className="tags">
                <span><b>✿</b>基于权威证据</span>
                <span><b>⌾</b>风险先行评估</span>
                <span><b>♙</b>为你量身考虑</span>
              </div>
            </div>
            <div className="hero-art">
              <div className="halo" aria-hidden="true"/>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="hero-img" src="/landing/hero-seed.png" alt="种子发芽水彩插画"/>
            </div>
          </div>
        </section>

        <section id="process" className="section">
          <div className="container glass process">
            <article className="step">
              <div className="ico"><SeedSproutStage stage="seed" size={72} /></div>
              <h3 className="serif">种子</h3>
              <p>提出问题<br/>播下一个值得探索的念头</p>
            </article>
            <article className="step">
              <div className="ico"><SeedSproutStage stage="sprout" size={72} /></div>
              <h3 className="serif">发芽</h3>
              <p>多维分析<br/>理解成分与潜在影响</p>
            </article>
            <article className="step">
              <div className="ico"><SeedSproutStage stage="bloom" size={72} /></div>
              <h3 className="serif">开花</h3>
              <p>整合证据<br/>看见更完整的答案</p>
            </article>
            <article className="step">
              <div className="ico"><SeedSproutStage stage="fruit" size={72} /></div>
              <h3 className="serif">结果</h3>
              <p>形成建议<br/>陪你做出安心选择</p>
            </article>
          </div>
        </section>

        <section id="features" className="section">
          <div className="container features-render-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="features-render-img"
              src="/landing/features-rendered.png"
              alt="VitaMe 产品功能：安全判断、平实解释、权威来源、个体差异提醒"
            />
          </div>
        </section>

        <section id="evidence" className="section">
          <div className="container glass evidence">
            <div>
              <h2 className="serif">以证据为根，<br/>以人为本。</h2>
              <p className="muted">VitaMe 参考全球权威指南与研究，并持续更新，让建议更可靠。</p>
              <a className="more" href="#">查看我们的证据标准 →</a>
            </div>
            <div className="metric">
              <div>📖</div>
              <div className="num serif">200+</div>
              <small>权威指南与机构<br/>持续更新</small>
            </div>
            <div className="metric">
              <div>⌕</div>
              <div className="num serif">10,000+</div>
              <small>高质量研究<br/>系统评估</small>
            </div>
            <div className="metric">
              <div>♙</div>
              <div className="num serif">50+</div>
              <small>专家顾问<br/>多学科合作</small>
            </div>
            <div className="metric">
              <div>🛡</div>
              <div className="num serif" style={{ fontSize: 30 }}>隐私守护</div>
              <small>对话与健康信息<br/>全程加密保护</small>
            </div>
          </div>
        </section>

        <section id="cta" className="section">
          <div className="container">
            <div className="glass cta">
              <picture>
                <source media="(max-width: 640px)" srcSet="/landing/cta-landscape-mobile.png" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="cta-bg" src="/landing/cta-landscape.png" alt="水彩自然景观"/>
              </picture>
              <div className="cta-center">
                <h2 className="serif">每个人的身体，<br/>都藏着自己的答案。</h2>
                <p>从一个问题开始，给自己多一份确定。</p>
                <Link className="btn" href="/chat">开始提问</Link>
                <div className="tiny">◷ 无需注册，即问即用</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .vitame-landing {
          --bg: #f7f1e7;
          --paper: #fffaf2;
          --paper2: #fbf4ea;
          --ink: #242723;
          --muted: #6f675d;
          --green: #2f5c42;
          --green2: #6e8a72;
          --brown: #8c6742;
          --blue: #4d88a8;
          --line: rgba(92, 74, 52, .16);
          --shadow: 0 24px 70px rgba(73, 55, 36, .08), 0 6px 18px rgba(73, 55, 36, .06);
          --radius: 30px;
          --max: 1160px;
          color: var(--ink);
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: var(--bg);
          line-height: 1.65;
          overflow-x: hidden;
          min-height: 100vh;
          position: relative;
        }
        .vitame-landing * { box-sizing: border-box; }
        .vitame-landing::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: -2;
          background:
            radial-gradient(circle at 12% 8%, rgba(255, 255, 255, .95), transparent 28%),
            radial-gradient(circle at 85% 12%, rgba(137, 181, 203, .20), transparent 24%),
            radial-gradient(circle at 45% 70%, rgba(202, 180, 139, .18), transparent 35%),
            linear-gradient(180deg, #fbf7ef 0%, #f5ecdf 100%);
        }
        .vitame-landing::after {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: -1;
          opacity: .18;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
        }

        .vitame-landing .container { width: min(var(--max), calc(100vw - 48px)); margin: 0 auto; }
        .vitame-landing .serif { font-family: ui-serif, Georgia, "Times New Roman", serif; }
        .vitame-landing .muted { color: var(--muted); }

        .vitame-landing header {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(18px);
          background: rgba(247, 241, 231, .78);
          border-bottom: 1px solid rgba(92, 74, 52, .08);
        }
        .vitame-landing .nav {
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .vitame-landing .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--green);
          font-weight: 700;
          text-decoration: none;
          font-size: 24px;
        }
        .vitame-landing .logo {
          width: 42px; height: 42px;
          border: 1.7px solid var(--green);
          border-radius: 999px;
          display: grid;
          place-items: center;
        }
        .vitame-landing .logo svg { width: 25px; height: 25px; }
        .vitame-landing .links {
          display: flex; gap: 44px;
          font-size: 15px; font-weight: 650;
        }
        .vitame-landing .links a {
          color: #30332f;
          text-decoration: none;
          opacity: .86;
        }
        .vitame-landing .links a:hover { opacity: 1; }
        .vitame-landing .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 999px;
          background: var(--green);
          color: #fff;
          text-decoration: none;
          font-weight: 750;
          padding: 13px 27px;
          box-shadow: 0 12px 24px rgba(47, 92, 66, .15);
          transition: transform .2s, box-shadow .2s;
        }
        .vitame-landing .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 28px rgba(47, 92, 66, .2);
        }

        .vitame-landing .hero { padding: 74px 0 24px; }
        .vitame-landing .hero-grid {
          display: grid;
          grid-template-columns: .94fr 1.12fr;
          gap: 54px;
          align-items: center;
        }
        .vitame-landing .eyebrow {
          color: var(--brown);
          font-weight: 700;
          letter-spacing: .12em;
          font-size: 12px;
          margin-bottom: 14px;
        }
        .vitame-landing .headline {
          font-size: clamp(58px, 6vw, 86px);
          line-height: 1.03;
          letter-spacing: -.055em;
          font-weight: 520;
          margin: 0 0 20px;
        }
        .vitame-landing .subhead {
          font-size: 20px;
          color: #423c34;
          margin: 0 0 30px;
          max-width: 560px;
        }
        .vitame-landing .ask {
          width: min(520px, 100%);
          border: 1px solid rgba(92, 74, 52, .12);
          background: linear-gradient(135deg, rgba(255, 255, 255, .88), rgba(255, 249, 240, .72));
          border-radius: 22px;
          padding: 22px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: var(--shadow);
          position: relative;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: transform .2s, box-shadow .2s;
        }
        .vitame-landing .ask:hover {
          transform: translateY(-2px);
          box-shadow: 0 32px 80px rgba(73, 55, 36, .12), 0 8px 22px rgba(73, 55, 36, .08);
        }
        .vitame-landing .ask::after {
          content: "";
          position: absolute;
          inset: auto -15% -45% 45%;
          height: 90px;
          background: radial-gradient(circle, rgba(77, 136, 168, .16), transparent 68%);
        }
        .vitame-landing .ask-title { font-weight: 750; margin-bottom: 5px; }
        .vitame-landing .ask-input { color: #a39b90; }
        .vitame-landing .round {
          width: 50px; height: 50px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: var(--blue);
          color: white;
          font-size: 24px;
          z-index: 1;
        }
        .vitame-landing .tags {
          display: flex;
          gap: 30px;
          flex-wrap: wrap;
          margin-top: 22px;
          color: #586157;
          font-size: 14px;
        }
        .vitame-landing .tags span { display: flex; gap: 8px; align-items: center; }
        .vitame-landing .tags b { color: var(--green); font-size: 19px; }

        .vitame-landing .hero-art {
          position: relative;
          min-height: 640px;
        }
        .vitame-landing .halo {
          position: absolute;
          inset: 4% -2% 2% -8%;
          border-radius: 46%;
          background:
            radial-gradient(circle at 58% 52%, rgba(255, 250, 239, .35), transparent 55%),
            radial-gradient(circle at 65% 36%, rgba(91, 142, 169, .16), transparent 38%),
            radial-gradient(circle at 52% 70%, rgba(145, 120, 86, .14), transparent 42%);
          filter: blur(3px);
        }
        .vitame-landing .hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          /* hero-seed.png 已用 ffmpeg colorkey=0xf7f1e7:0.10:0.05 处理为透明背景，
             与页面米色 bg 无缝。不再需要 mix-blend-mode 或 mask 兜底。 */
          filter: saturate(.94) contrast(.98);
        }

        .vitame-landing .section { padding: 28px 0; }
        .vitame-landing .glass {
          background: linear-gradient(135deg, rgba(255, 252, 246, .78), rgba(249, 241, 230, .64));
          border: 1px solid var(--line);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          position: relative;
          overflow: hidden;
        }
        .vitame-landing .glass::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 0 0, rgba(255, 255, 255, .85), transparent 30%),
            radial-gradient(circle at 90% 90%, rgba(77, 136, 168, .06), transparent 36%);
        }

        .vitame-landing .process { display: grid; grid-template-columns: repeat(4, 1fr); }
        .vitame-landing .step {
          position: relative;
          padding: 28px 30px;
          text-align: center;
          min-height: 214px;
        }
        .vitame-landing .step + .step { border-left: 1px solid var(--line); }
        .vitame-landing .step .ico {
          display: grid;
          place-items: center;
          margin: 0 auto 12px;
        }
        .vitame-landing .step h3 { font-size: 26px; margin: 0 0 3px; }
        .vitame-landing .step p { margin: 0; color: var(--muted); font-size: 14px; }

        .vitame-landing .features-render-wrap {
          margin-top: 10px;
          position: relative;
          border-radius: 28px;
          overflow: hidden;
        }
        .vitame-landing .features-render-img {
          display: block;
          width: 100%;
          height: auto;
          border-radius: 28px;
          filter: saturate(.98) contrast(.99);
          box-shadow: 0 24px 70px rgba(73, 55, 36, .07), 0 6px 18px rgba(73, 55, 36, .05);
        }

        .vitame-landing .evidence {
          display: grid;
          grid-template-columns: 1.25fr repeat(4, 1fr);
          margin-top: 28px;
        }
        .vitame-landing .evidence > * { padding: 28px 24px; z-index: 1; }
        .vitame-landing .evidence > * + * { border-left: 1px solid var(--line); }
        .vitame-landing .evidence h2 {
          font-size: 38px;
          line-height: 1.15;
          margin: 0 0 12px;
          font-weight: 520;
        }
        .vitame-landing .more {
          display: inline-block;
          margin-top: 18px;
          color: var(--green);
          text-decoration: none;
          font-size: 14px;
          font-weight: 760;
        }
        .vitame-landing .metric {
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .vitame-landing .metric > div:first-child { font-size: 22px; }
        .vitame-landing .num {
          color: var(--green);
          font-size: 36px;
          line-height: 1.1;
          margin: 6px 0;
        }
        .vitame-landing .metric small { color: var(--muted); }

        .vitame-landing .cta {
          margin: 34px 0 74px;
          position: relative;
          padding: 0;
          /* aspect 3:1 跟 features 卡片对齐；图本身白色 wash 已 ffmpeg 替换成米色，
             跟容器 .glass 底色无缝融合，容器放大不再露出"白色空格" */
          aspect-ratio: 3 / 1;
          overflow: hidden;
          border-radius: 28px;
        }
        .vitame-landing .cta-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          /* 图本身水彩 wash 边米色 = 容器 .glass 米色，直接 cover 显示视觉融合；
             不再 opacity/multiply（旧值会让 wash 区色差被放大成"空白横条"） */
          object-fit: cover;
          object-position: center;
        }
        .vitame-landing .cta-center {
          /* 文字浮在图上方居中 */
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          text-align: center;
          background: radial-gradient(circle, rgba(255, 250, 242, .82), rgba(255, 250, 242, .42) 58%, transparent 75%);
          padding: 16px;
          max-width: 60%;
          margin: 0 auto;
        }
        .vitame-landing .cta h2 {
          font-size: clamp(32px, 3.8vw, 50px);
          line-height: 1.15;
          font-weight: 520;
          margin: 0 0 10px;
        }
        .vitame-landing .cta p {
          margin: 0 0 20px;
          color: #4a443d;
          font-size: 18px;
        }
        .vitame-landing .tiny {
          font-size: 13px;
          color: #746e65;
          margin-top: 10px;
        }

        @media (max-width: 980px) {
          .vitame-landing .hero-grid,
          .vitame-landing .evidence { grid-template-columns: 1fr; }
          .vitame-landing .hero-art { min-height: 520px; }
          .vitame-landing .cards { grid-template-columns: repeat(2, 1fr); }
          .vitame-landing .process { grid-template-columns: repeat(2, 1fr); }
          .vitame-landing .step + .step,
          .vitame-landing .evidence > * + * {
            border-left: 0;
            border-top: 1px solid var(--line);
          }
          .vitame-landing .cta-center { max-width: 90%; }
          .vitame-landing .links { display: none; }
        }
        @media (max-width: 640px) {
          .vitame-landing .container { width: calc(100vw - 28px); }
          .vitame-landing .hero { padding-top: 42px; }
          .vitame-landing .headline { font-size: 52px; }
          .vitame-landing .process { grid-template-columns: 1fr; }
          .vitame-landing .hero-art { min-height: 420px; }
          .vitame-landing .nav { height: 68px; }
          .vitame-landing .btn { padding: 11px 20px; }
          .vitame-landing .features-render-wrap { overflow-x: auto; border-radius: 22px; }
          .vitame-landing .features-render-img { min-width: 980px; border-radius: 22px; }
          /* mobile 用专属 1.5:1 padded 图（picture srcset 切），
             aspect 1.5:1 让容器纵向更高容纳文字 overlay */
          .vitame-landing .cta {
            aspect-ratio: 1.5 / 1;
            border-radius: 22px;
          }
          .vitame-landing .cta-bg {
            object-fit: cover;
            object-position: center;
          }
          .vitame-landing .cta-center {
            max-width: 92%;
            padding: 14px 16px;
          }
          .vitame-landing .cta h2 { font-size: 24px; line-height: 1.25; }
          .vitame-landing .cta p { font-size: 14px; margin-bottom: 14px; }
          .vitame-landing .cta .btn { padding: 10px 22px; font-size: 14px; }
          .vitame-landing .cta .tiny { font-size: 11px; margin-top: 8px; }
        }
      ` }} />
    </div>
  );
}
