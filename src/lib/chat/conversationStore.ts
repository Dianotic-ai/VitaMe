// file: src/lib/chat/conversationStore.ts — 多 person 隔离的对话历史
//
// v0.4 D13 Codex Finding #1：v1 单 messages[] 共享 → 妈妈/我自己档案串扰。
// v2 schema 改为 messagesByPersonId: Record<string, UIMessage[]>，每 person 独立。
// v1→v2 自动迁移：把旧 messages[] 当作 self person 的历史挂上去（不丢用户数据）。
//
// 上限：每 person 仅保留最近 12 条 UI message ≈ 5-6 轮（user+assistant 成对），
// 同时降低 LocalStorage 占用。
//
// 跟 useChat 集成：
// 1. /chat 页等本 store hydrate 完成后渲染 ChatBody
// 2. ChatBody 用 getMessages(activePersonId) 拿当前 person 的历史当 useChat 初值
// 3. 用 useEffect 监听 useChat 返回的 messages → setMessages(activePersonId, ...)
// 4. 切换 person 时 useChat 自动 remount（key=activePersonId）拉新历史

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UIMessage } from 'ai';

interface ConversationStateV2 {
  messagesByPersonId: Record<string, UIMessage[]>;
  hasHydrated: boolean;

  /** 取某 person 的历史；缺省返回 [] 不抛 */
  getMessages: (personId: string) => UIMessage[];
  /** 写某 person 的历史（自动尾截 MAX_PERSIST） */
  setMessages: (personId: string, next: UIMessage[]) => void;
  /** 清某 person 的历史 — 用于"新对话"按钮，只影响当前 person */
  clearMessages: (personId: string) => void;
  /** 清所有 person 的历史 — 用于"销毁全部档案" cascade */
  clearAll: () => void;
  /** Person 删除时清理孤儿 */
  removePerson: (personId: string) => void;

  setHasHydrated: (v: boolean) => void;
}

const MAX_PERSIST_PER_PERSON = 12; // ≈ 5-6 轮

interface PersistedV1 {
  state?: { messages?: UIMessage[] };
}

export const useConversationStore = create<ConversationStateV2>()(
  persist(
    (set, get) => ({
      messagesByPersonId: {},
      hasHydrated: false,

      getMessages: (personId) => get().messagesByPersonId[personId] ?? [],
      setMessages: (personId, next) =>
        set((s) => ({
          messagesByPersonId: {
            ...s.messagesByPersonId,
            [personId]: next.slice(-MAX_PERSIST_PER_PERSON),
          },
        })),
      clearMessages: (personId) =>
        set((s) => {
          const copy = { ...s.messagesByPersonId };
          delete copy[personId];
          return { messagesByPersonId: copy };
        }),
      clearAll: () => set({ messagesByPersonId: {} }),
      removePerson: (personId) =>
        set((s) => {
          const copy = { ...s.messagesByPersonId };
          delete copy[personId];
          return { messagesByPersonId: copy };
        }),

      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'vitame-conversation-v2',
      version: 2,
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (undefined as never))),
      partialize: (state) => ({ messagesByPersonId: state.messagesByPersonId }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // v1 → v2 迁移：vitame-conversation-v1 旧 messages[] 挂到 'self' 临时桶
        // 加载时 chat 页能识别并归档到当前 active person（避免直接丢用户数据）
        if (typeof window !== 'undefined' && Object.keys(state.messagesByPersonId).length === 0) {
          try {
            const raw = window.localStorage.getItem('vitame-conversation-v1');
            if (raw) {
              const parsed = JSON.parse(raw) as PersistedV1;
              const oldMessages = parsed?.state?.messages ?? [];
              if (Array.isArray(oldMessages) && oldMessages.length > 0) {
                state.messagesByPersonId = {
                  __legacy_v1__: oldMessages.slice(-MAX_PERSIST_PER_PERSON),
                };
              }
            }
          } catch {
            // 解析失败忽略，按空历史走
          }
        }
        state.setHasHydrated(true);
      },
    }
  )
);
