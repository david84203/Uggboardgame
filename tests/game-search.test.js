import test from 'node:test'
import assert from 'node:assert/strict'
import { parseGamesCsv, searchGames, toPublicGame } from '../api/game-search.js'

const csv = `裝飾行
中文名稱,英文名稱,語言版本,遊戲人數,放置櫃位,BGG玩家評分,BGG建議最佳人數,BGG遊戲時間(分鐘),BGG遊戲難度,BGG連結,所有人,分類,標籤1,標籤2,標籤3,店內熱門,定價,租金,教學,玩家模式,遊戲簡介,店員推薦
花見小路,Hanamikoji,中,2,F5,7.5,2,15,1.74,https://example.com/hanamikoji,烏嘎嘎,雙人,手牌管理,,,v,450,50,https://youtube.com/example,動腦,兩人對戰遊戲,2人 新手
飛躍魔盜團,Magic Maze,中,1-8,K4,7.3,4,15,1.71,https://example.com/magic-maze,烏嘎嘎,策略,合作,競速,,v,1200,150,,輕鬆,即時合作遊戲,4人 新手
蓋亞計畫,Gaia Project,中,1-4,D3,8.7,3-4,60-150,4.3,https://example.com/gaia,烏嘎嘎,策略,重策,,,,3000,300,,超燒腦,太空策略遊戲,4人`

test('parseGamesCsv maps the published Sheet columns', () => {
  const games = parseGamesCsv(csv)
  assert.equal(games.length, 3)
  assert.equal(games[0].name, '花見小路')
  assert.equal(games[0].minPlayers, 2)
  assert.equal(games[0].maxPlayers, 2)
  assert.deepEqual(games[1].tags, ['合作', '競速'])
  assert.equal(games[1].isHot, true)
})

test('searchGames combines people, time and hot filters', () => {
  const games = parseGamesCsv(csv)
  const result = searchGames(games, {
    playerCount: 4,
    maxMinutes: 30,
    onlyHot: true,
  })

  assert.equal(result.total, 1)
  assert.equal(result.games[0].name, '飛躍魔盜團')
})

test('searchGames searches names and descriptive fields', () => {
  const games = parseGamesCsv(csv)
  const result = searchGames(games, { query: 'Hanamikoji' })
  assert.equal(result.total, 1)
  assert.equal(result.games[0].name, '花見小路')
})

test('toPublicGame does not expose internal owner data', () => {
  const game = toPublicGame(parseGamesCsv(csv)[0])
  assert.equal(game.name, '花見小路')
  assert.equal('owner' in game, false)
})

