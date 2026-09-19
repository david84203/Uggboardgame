import { createMcpHandler, McpServer } from '@modelcontextprotocol/server'
import { originValidation, toNodeHandler } from '@modelcontextprotocol/node'
import { z } from 'zod'
import { loadGames, searchGames, toPublicGame } from './game-search.js'

const allowedOrigins = originValidation([
  'gemini.google.com',
  'localhost',
  '127.0.0.1',
])

function createUggServer() {
  const server = new McpServer(
    { name: '烏嘎嘎桌遊搜尋', version: '1.0.0' },
    {
      instructions:
        '搜尋烏嘎嘎桌遊店的公開桌遊清單。請優先使用使用者提供的人數、時間、分類與標籤篩選，不要宣稱即時庫存狀態。',
    },
  )

  server.registerTool(
    'search_board_games',
    {
      title: '搜尋烏嘎嘎桌遊',
      description:
        '從烏嘎嘎桌遊店的公開清單搜尋桌遊。可以用中英文名稱、遊戲類型或關鍵字搜尋，並依人數、最長遊戲時間、分類、標籤、難度模式、熱門與是否有教學影片篩選。',
      inputSchema: z.object({
        query: z.string().trim().max(100).optional().describe('中文名稱、英文名稱或關鍵字'),
        playerCount: z.number().int().min(1).max(99).optional().describe('遊玩人數'),
        maxMinutes: z.number().int().min(1).max(600).optional().describe('希望遊戲最長不超過幾分鐘'),
        category: z.string().trim().max(30).optional().describe('分類，例如派對、策略、兒童、雙人'),
        tags: z.array(z.string().trim().max(30)).max(10).optional().describe('必須同時具備的標籤'),
        playerMode: z.enum(['輕鬆', '動腦', '超燒腦']).optional().describe('玩家模式'),
        onlyHot: z.boolean().optional().describe('是否只顯示店內熱門遊戲'),
        onlyTutorial: z.boolean().optional().describe('是否只顯示有教學影片的遊戲'),
        limit: z.number().int().min(1).max(20).default(10).describe('回傳數量，最多 20 款'),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (filters) => {
      try {
        const games = await loadGames()
        const result = searchGames(games, filters)
        const payload = {
          totalMatches: result.total,
          returned: result.games.length,
          note: result.total > result.games.length
            ? `符合 ${result.total} 款，先回傳前 ${result.games.length} 款。可以增加條件縮小範圍。`
            : undefined,
          games: result.games.map(toPublicGame),
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `桌遊資料載入失敗：${error instanceof Error ? error.message : '未知錯誤'}`,
          }],
        }
      }
    },
  )

  return server
}

const mcpHandler = toNodeHandler(createMcpHandler(createUggServer))

export default async function handler(request, response) {
  if (!allowedOrigins(request, response)) return
  await mcpHandler(request, response)
}

