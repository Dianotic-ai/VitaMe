// file: src/app/page.tsx — P0 启动占位；正式 Hero 在 T-UI-1 按 DESIGN.md §5.1 落地

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center gap-4 px-6 py-10">
      <p className="text-xs uppercase tracking-widest text-neutral-500">VitaMe P0 · boot</p>
      <h1 className="text-2xl font-semibold leading-tight">
        补剂安全翻译 Agent<br />
        <span className="text-neutral-500">正在搭建中</span>
      </h1>
      <p className="text-sm text-neutral-600">
        当前为工程脚手架占位页面。正式首页、输入框、风险卡等组件将依照 DESIGN.md 与 p0-plan 排期交付。
      </p>
    </main>
  );
}
