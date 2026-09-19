import Papa from 'papaparse'

export const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBJylM7ousC0ift39FwzpIB7NrFgYZBfaKug_pBLXU_l0UZKTKKlcfO9663eetX13d5pbsWBLGinVE/pub?gid=540615026&single=true&output=csv'

const FIELD_MAP = {
  name: '中文名稱',
  englishName: '英文名稱',
  language: '語言版本',
  players: '遊戲人數',
  location: '放置櫃位',
  rating: 'BGG玩家評分',
  bestPlayers: 'BGG建議最佳人數',
  playTime: 'BGG遊戲時間(分鐘)',
  weight: 'BGG遊戲難度',
  bggLink: 'BGG連結',
  owner: '所有人',
  category: '分類',
  tag1: '標籤1',
  tag2: '標籤2',
  tag3: '標籤3',
  isHot: '店內熱門',
  price: '定價',
  rental: '租金',
  youtubeLink: '教學',
  playerMode: '玩家模式',
  description: '遊戲簡介',
  staffPick: '店員推薦',
}

const TRUE_MARKERS = new Set(['v', '1', 'ˇ', '✓', '√', '✔'])
const CACHE_TTL_MS = 5 * 60 * 1000

let cache = { expiresAt: 0, games: null }

function text(value) {
  return String(value ?? '').trim()
}

function number(value) {
  const parsed = Number.parseFloat(text(value))
  return Number.isFinite(parsed) ? parsed : null
}

function parseRange(value) {
  const normalized = text(value).replace(/[.]/g, '-').replace(/–/g, '-')
  const range = normalized.match(/^(\d+)\s*-\s*(\d+)$/)
  if (range) {
    return { min: Number.parseInt(range[1], 10), max: Number.parseInt(range[2], 10) }
  }

  const single = normalized.match(/^(\d+)$/)
  if (single) {
    const parsed = Number.parseInt(single[1], 10)
    return { min: parsed, max: parsed }
  }

  return { min: null, max: null }
}

function parseTags(...values) {
  return values
    .flatMap((value) => text(value).split(/[、,，/／;；]+/))
    .map((value) => value.trim())
    .filter(Boolean)
}

function isTrue(value) {
  return TRUE_MARKERS.has(text(value).toLowerCase())
}

export function parseGamesCsv(csvText) {
  const lines = String(csvText).split(/\r?\n/)
  const headerIndex = lines.findIndex((line) => line.includes(FIELD_MAP.name))
  const cleanedCsv = headerIndex >= 0 ? lines.slice(headerIndex).join('\n') : String(csvText)
  const parsed = Papa.parse(cleanedCsv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  })

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error(`Google Sheet CSV 解析失敗：${parsed.errors[0].message}`)
  }

  return parsed.data
    .filter((row) => text(row[FIELD_MAP.name]) && text(row[FIELD_MAP.players]))
    .map((row, index) => {
      const players = parseRange(row[FIELD_MAP.players])
      const playTime = parseRange(row[FIELD_MAP.playTime])

      return {
        id: headerIndex + index + 2,
        name: text(row[FIELD_MAP.name]),
        englishName: text(row[FIELD_MAP.englishName]),
        language: text(row[FIELD_MAP.language]),
        playersRaw: text(row[FIELD_MAP.players]),
        minPlayers: players.min,
        maxPlayers: players.max,
        location: text(row[FIELD_MAP.location]),
        rating: number(row[FIELD_MAP.rating]),
        bestPlayers: text(row[FIELD_MAP.bestPlayers]),
        playTimeRaw: text(row[FIELD_MAP.playTime]),
        minTime: playTime.min,
        maxTime: playTime.max,
        weight: number(row[FIELD_MAP.weight]),
        bggLink: text(row[FIELD_MAP.bggLink]),
        owner: text(row[FIELD_MAP.owner]),
        category: text(row[FIELD_MAP.category]),
        tags: parseTags(row[FIELD_MAP.tag1], row[FIELD_MAP.tag2], row[FIELD_MAP.tag3]),
        isHot: isTrue(row[FIELD_MAP.isHot]),
        price: text(row[FIELD_MAP.price]),
        rental: text(row[FIELD_MAP.rental]),
        youtubeLink: text(row[FIELD_MAP.youtubeLink]),
        playerMode: text(row[FIELD_MAP.playerMode]),
        description: text(row[FIELD_MAP.description]),
        staffPicks: parseTags(row[FIELD_MAP.staffPick]),
      }
    })
}

export async function loadGames(fetchImpl = fetch) {
  if (cache.games && Date.now() < cache.expiresAt) return cache.games

  const response = await fetchImpl(SHEET_CSV_URL, {
    headers: { 'user-agent': 'UggBoardgame-MCP/1.0' },
  })
  if (!response.ok) {
    throw new Error(`Google Sheet 載入失敗（HTTP ${response.status}）`)
  }

  const games = parseGamesCsv(await response.text())
  cache = { games, expiresAt: Date.now() + CACHE_TTL_MS }
  return games
}

function normalized(value) {
  return text(value).toLocaleLowerCase('zh-Hant')
}

export function searchGames(games, filters = {}) {
  const {
    query = '',
    playerCount,
    maxMinutes,
    category = '',
    tags = [],
    playerMode = '',
    onlyHot = false,
    onlyTutorial = false,
    limit = 10,
  } = filters

  const normalizedQuery = normalized(query)
  const normalizedCategory = normalized(category)
  const normalizedTags = tags.map(normalized).filter(Boolean)
  const normalizedPlayerMode = normalized(playerMode)

  const results = games.filter((game) => {
    if (normalizedQuery) {
      const haystack = normalized([
        game.name,
        game.englishName,
        game.category,
        game.tags.join(' '),
        game.staffPicks.join(' '),
        game.description,
      ].join(' '))
      if (!haystack.includes(normalizedQuery)) return false
    }

    if (playerCount != null && game.minPlayers != null && game.maxPlayers != null) {
      if (playerCount < game.minPlayers || playerCount > game.maxPlayers) return false
    }

    if (maxMinutes != null) {
      if (game.maxTime == null || game.maxTime > maxMinutes) return false
    }

    if (normalizedCategory && normalized(game.category) !== normalizedCategory) return false

    if (normalizedTags.length > 0) {
      const gameTags = new Set([...game.tags, ...game.staffPicks].map(normalized))
      if (!normalizedTags.every((tag) => gameTags.has(tag))) return false
    }

    if (normalizedPlayerMode && normalized(game.playerMode) !== normalizedPlayerMode) return false
    if (onlyHot && !game.isHot) return false
    if (onlyTutorial && !game.youtubeLink) return false

    return true
  })

  results.sort((a, b) => {
    if (normalizedQuery) {
      const aExact = normalized(a.name) === normalizedQuery || normalized(a.englishName) === normalizedQuery
      const bExact = normalized(b.name) === normalizedQuery || normalized(b.englishName) === normalizedQuery
      if (aExact !== bExact) return Number(bExact) - Number(aExact)
    }
    if (a.isHot !== b.isHot) return Number(b.isHot) - Number(a.isHot)
    return (b.rating ?? 0) - (a.rating ?? 0)
  })

  return {
    total: results.length,
    games: results.slice(0, Math.max(1, Math.min(limit, 20))),
  }
}

export function toPublicGame(game) {
  return {
    name: game.name,
    englishName: game.englishName || undefined,
    language: game.language || undefined,
    players: game.playersRaw || undefined,
    bestPlayers: game.bestPlayers || undefined,
    playTimeMinutes: game.playTimeRaw || undefined,
    category: game.category || undefined,
    tags: game.tags,
    playerMode: game.playerMode || undefined,
    rating: game.rating,
    weight: game.weight,
    isHot: game.isHot,
    price: game.price || undefined,
    rental: game.rental || undefined,
    location: game.location || undefined,
    description: game.description ? game.description.slice(0, 500) : undefined,
    bggUrl: game.bggLink || undefined,
    tutorialUrl: game.youtubeLink || undefined,
    appUrl: 'https://uggboardgame.com/app?tab=gamelist',
  }
}

