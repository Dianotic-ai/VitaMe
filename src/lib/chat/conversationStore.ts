// file: src/lib/chat/conversationStore.ts — 客户端 zustand persist 多轮 history
//
// 目的：刷新浏览器后 chat 历史不丢（CLAUDE.md §3.5 P0 polish #1）
// 跟 profile 隔离：profile 存"用户身体状况"，conversation 存"完整对话气泡"
// LocalStorage key = 'vitame-conversation-v1'
//
// 跟 useChat 集成方式：
// 1. chat/page.tsx 等本 store hydrate 完成后渲染 ChatBody
// 2. ChatBody useChat({ messages: storedMessages }) 当作初始值
// 3. 用 useEffect 监听 useChat 返回的 messages，写回本 store
// 4. "新对话"按钮调 clearMessages() 清空

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UIMessage } from 'ai';

interface ConversationState {
  messages: UIMessage[];
  /** 仅保留最近 50 条，避免 LocalStorage 撑爆 */
  setMessages: (next: UIMessage[]) => void;
  clearMessages: () => void;
  /** hydration 完成标记（避免 SSR/CSR 错位） */
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

const MAX_PERSIST = 50;

export const useConversationStore = create<ConversationState>()(
  persist(
    (set) => ({
      messages: [],
      hasHydrated: false,
      setMessages: (next) => set({ messages: next.slice(-MAX_PERSIST) }),
      clearMessages: () => set({ messages: [] }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'vitame-conversation-v1',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (undefined as never))),
      partialize: (state) => ({ messages: state.messages }), // 只持久化 messages，hasHydrated 不持久化
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
