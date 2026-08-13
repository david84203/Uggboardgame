/**
 * 烏嘎嘎線上預約 — Google 日曆／LINE 通知中繼
 *
 * 用途：APP 確認預約時呼叫這支腳本，由它寫入 Google 日曆並推 LINE 訊息。
 * 金鑰只存在這裡（指令碼屬性），不會出現在前端網頁原始碼中。
 *
 * ── 安裝步驟 ──────────────────────────────────────────────────────────────
 * 1. 到 https://script.google.com 建立新專案，把整份檔案貼進去。
 * 2. 左側「專案設定」→ 指令碼屬性，新增：
 *      BOOKING_SECRET  = 自己想一組字串（跟 .env 的 VITE_GAS_BOOKING_SECRET 一致）
 *      LINE_TOKEN      = LINE Channel Access Token（沒有這列就不會發任何 LINE 訊息）
 *      OWNER_LINE_ID   = 店長自己的 userId，有新預約會推到你跟官方帳號的聊天室
 *                        （LINE Developers Console → Messaging API 分頁 → Your user ID）
 *      CALENDAR_ID     = 沒有這列＝寫入主日曆；要用其他日曆才加並填日曆 ID
 *      ADMIN_URL       = 通知訊息裡「點這裡確認」的網址；沒有這列就用正式站
 *                        （要測 preview 版時才填，測完刪掉）
 *    註：屬性值不能留空，用不到的那幾列直接按 ✕ 刪掉即可。
 * 3. 右上「部署」→ 新增部署作業 → 類型選「網頁應用程式」
 *      執行身分：我
 *      具有存取權的使用者：任何人
 * 4. 複製產生的網址，填進專案 .env 的 VITE_GAS_BOOKING_URL
 */

var MAX_DAYS_AHEAD = 62;

function prop(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || '';
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var secret = prop('BOOKING_SECRET');
    if (secret && body.secret !== secret) {
      return json({ ok: false, error: '驗證失敗' });
    }

    var b = body.booking;
    if (!b || !b.date || !b.start || !b.end) {
      return json({ ok: false, error: '缺少預約資料' });
    }

    // 只接受今天到兩個月內的預約，避免被亂灌行程
    var start = new Date(b.start);
    var now = new Date();
    var limit = new Date(now.getTime() + MAX_DAYS_AHEAD * 24 * 3600 * 1000);
    if (start < new Date(now.getTime() - 24 * 3600 * 1000) || start > limit) {
      return json({ ok: false, error: '日期超出可預約範圍' });
    }

    switch (body.action) {
      case 'confirm': return json(handleConfirm(b));
      case 'cancel':  return json(handleCancel(b));
      case 'decline': return json(handleDecline(b));
      case 'notify':  return json(handleNotifyOwner(b));
      default:        return json({ ok: false, error: '未知的動作：' + body.action });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/**
 * 部署後可用瀏覽器直接開，確認腳本活著。
 * 另支援 ?action=verify&secret=...&id=<預約id>&start=<ISO 時間>
 * ——POST 的回應偶爾會被 Google 換成 HTML（前端讀不到 JSON），
 *   前端讀不懂回執時改用這條 GET 來確認日曆事件到底建了沒。
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'verify') {
    var secret = prop('BOOKING_SECRET');
    if (secret && p.secret !== secret) return json({ ok: false, error: '驗證失敗' });
    if (!p.id || !p.start) return json({ ok: false, error: '缺少 id 或 start' });
    var found = findEvent(p.id, p.start);
    return json({ ok: !!found, eventId: found || null });
  }
  return json({ ok: true, service: '烏嘎嘎預約中繼', line: !!prop('LINE_TOKEN') });
}

// 用預約 id 在日曆上找回對應事件（描述裡的 #id 標記），找不到回空字串
function findEvent(bookingId, startIso) {
  if (!bookingId || !startIso) return '';
  var start = new Date(startIso);
  var events = getCalendar().getEvents(
    new Date(start.getTime() - 60 * 1000),
    new Date(start.getTime() + 60 * 1000)
  );
  for (var i = 0; i < events.length; i++) {
    if (events[i].getDescription().indexOf('#' + bookingId) !== -1) return events[i].getId();
  }
  return '';
}

function getCalendar() {
  var id = prop('CALENDAR_ID');
  return id ? CalendarApp.getCalendarById(id) : CalendarApp.getDefaultCalendar();
}

function handleConfirm(b) {
  var cal = getCalendar();
  var title = '🎲 預約 ' + b.people + '人 ' + (b.floor && b.floor !== '不指定' ? b.floor + ' ' : '') + b.name;
  var desc = [
    '姓名：' + b.name,
    '電話：' + b.phone,
    '人數：' + b.people + ' 位',
    '樓層：' + (b.floor || '不指定'),
    b.firstVisit ? '★ 第一次來' : '',
    b.note ? '備註：' + b.note : '',
    '',
    '（由烏嘎嘎 APP 線上預約自動建立）',
    '#' + b.id,
  ].filter(String).join('\n');

  // 已經建過就不重建、也不重發（前端讀不到回執而重按時，避免日曆兩筆、客人被通知兩次）
  var existing = findEvent(b.id, b.start);
  var eventId = existing || cal.createEvent(title, new Date(b.start), new Date(b.end), { description: desc }).getId();

  var lineResult = existing ? 'skipped:already_confirmed' : pushLine(b.lineUserId, [
    '您好 ' + b.name + '，預約已確認 ✅',
    '',
    '📅 ' + formatWhen(b),
    '👥 ' + b.people + ' 位',
    '🏠 ' + (b.floor || '不指定'),
    '',
    '座位幫您保留好囉，期待見到你 🎲',
    '如需更改或取消，請直接回覆本訊息。',
  ].join('\n'));

  return { ok: true, eventId: eventId, line: lineResult };
}

function handleCancel(b) {
  var removed = false;
  if (b.calendarEventId) {
    try {
      var ev = getCalendar().getEventById(b.calendarEventId);
      if (ev) { ev.deleteEvent(); removed = true; }
    } catch (err) { /* 行程可能已被手動刪除，忽略 */ }
  }
  var lineResult = pushLine(b.lineUserId, [
    b.name + ' 您好，以下預約已取消：',
    '📅 ' + formatWhen(b) + '　👥 ' + b.people + ' 位',
    '',
    '隨時歡迎再約，我們等你 🎲',
  ].join('\n'));
  return { ok: true, removed: removed, line: lineResult };
}

function handleDecline(b) {
  var lineResult = pushLine(b.lineUserId, [
    b.name + ' 您好，關於您預約的 ' + formatWhen(b) + '：',
    '',
    b.reason || '這個時段目前無法安排，方便改其他時間嗎？',
    '',
    '直接回覆本訊息就可以跟小編喬時間 🙏',
  ].join('\n'));
  return { ok: true, line: lineResult };
}

/**
 * 通知店長（推到店長與官方帳號的聊天室）
 * kind: 'new'＝客人剛送出　'cancelled'＝客人自己取消
 */
function handleNotifyOwner(b) {
  var owner = prop('OWNER_LINE_ID');
  if (!owner) return { ok: false, error: '尚未設定 OWNER_LINE_ID' };

  var isCancel = b.kind === 'cancelled';
  var lines = isCancel
    ? ['❌ 客人取消預約', '', '📅 ' + formatWhen(b), '👥 ' + b.people + ' 位　🏠 ' + (b.floor || '不指定'), '🙋 ' + b.name + '　' + b.phone]
    : [
        '🔔 有新預約要確認',
        '',
        '📅 ' + formatWhen(b),
        '👥 ' + b.people + ' 位　🏠 ' + (b.floor || '不指定'),
        '🙋 ' + b.name + '　' + b.phone,
        b.firstVisit ? '🆕 第一次來' : '',
        b.note ? '📝 ' + b.note : '',
        '',
        '👉 點這裡確認：' + (prop('ADMIN_URL') || 'https://uggboardgame.vercel.app/?tab=booking-admin'),
      ];

  var result = pushLine(owner, lines.filter(String).join('\n'));
  return { ok: result === 'sent', line: result };
}

function formatWhen(b) {
  var start = new Date(b.start);
  var tz = 'Asia/Taipei';
  return Utilities.formatDate(start, tz, 'M/d（E）HH:mm');
}

function pushLine(userId, text) {
  var token = prop('LINE_TOKEN');
  if (!token) return 'skipped:no_token';
  if (!userId) return 'skipped:no_user';
  try {
    var res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token },
      payload: JSON.stringify({ to: userId, messages: [{ type: 'text', text: text }] }),
      muteHttpExceptions: true,
    });
    return res.getResponseCode() === 200 ? 'sent' : 'failed:' + res.getContentText();
  } catch (err) {
    return 'error:' + String(err);
  }
}
