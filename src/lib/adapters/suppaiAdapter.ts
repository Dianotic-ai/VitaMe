// file: src/lib/adapters/suppaiAdapter.ts — L2 判断层第 2 路：SUPP.AI 补剂×药物交互
//
// P0 当前状态：bakeSuppai 尚未跑（需 MINIMAX_API_KEY 或离线数据包）。
// adapter 返回空结果 + partialData=true，提醒前端"数据源降级"，合规红线不降级返绿色。
// 待 src/lib/db/suppai-interactions.ts 烘焙完成后，此处改为查 Map（O(1)）。

import type { LookupRequest, LookupResponse, SafetyAdapter } from '@/lib/types/adapter';

export const suppaiAdapter: SafetyAdapter = {
  name: 'suppai',
  async lookup(_req: LookupRequest): Promise<LookupResponse> {
    return {
      risks: [],
      partialData: true,
      source: 'suppai',
      error: 'suppai_not_baked',
    };
  },
};
