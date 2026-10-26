(() => {
  'use strict';
  const G = window.NumberBluff, timer = window.NumberBluffScheduler(), $ = id => document.getElementById(id);
  let human = 'p1';
  const difficultyNames = { easy: 'やさしい', normal: '普通', hard: '強い' };
  const avatars = ['assets/star-sprite.webp', 'assets/moon-cat.webp', 'assets/cloud-bunny.webp', 'assets/blue-cloud.webp'];
  const avatarNames = ['ほしもち', 'ほしねこ', 'もふうさ', 'くもまる'];
  let state = null, view = null, screen = 'homeScreen', selectedBot = 'p2', nextDifficulty = 'normal';
  let avatarChoice = {}, suggested = true, overlayReturn = null, confirmIntent = 'home';
  let transport = null, unsubscribe = null, settings = { sound: false, motion: false }, audioContext;
  try { settings = { ...settings, ...JSON.parse(localStorage.getItem('number-bluff-settings') || '{}') }; } catch {}
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; };
  const image = (src, cls = '') => { const node = el('img', cls); node.src = src; node.alt = ''; return node; };
  const avatarIndex = id => avatarChoice[id] ?? ((Number(id.slice(1)) - 1) % 4);
  const avatar = id => avatars[avatarIndex(id)];
  const name = id => { const p = view?.players.find(p => p.id === id); return !p ? '' : p.id === human ? 'あなた' : p.kind === 'human' ? p.name : avatarNames[avatarIndex(id)] + (Number(id.slice(1)) > 4 ? ' ' + id.slice(1) : ''); };
  function show(id, focus = null) {
    for (const node of document.querySelectorAll('.screen')) node.classList.toggle('hide', node.id !== id);
    screen = id; window.scrollTo(0, 0);
    if (focus) $(focus).focus({ preventScroll: true });
  }
  function saveSettings() {
    document.body.dataset.motion = settings.motion ? 'on' : 'off';
    $('soundToggle').checked = !!settings.sound; $('motionToggle').checked = !!settings.motion;
    try { localStorage.setItem('number-bluff-settings', JSON.stringify(settings)); } catch {}
  }
  function sound(reveal = false) {
    if (!settings.sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return;
      audioContext ||= new Audio(); void audioContext.resume();
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = reveal ? 660 : 440;
      gain.gain.setValueAtTime(.045, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .16);
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + .17);
    } catch { /* Sound is optional; gameplay never depends on an audio device. */ }
  }
  function cardNode(card, hidden = false, out = false) {
    const node = el('div', 'player-card');
    if (out) { node.classList.add('out'); node.textContent = '脱落'; return node; }
    if (hidden || !card) { node.classList.add('hidden'); node.textContent = '?'; return node; }
    node.classList.add('kind-' + card.kind);
    if (card.kind !== 'number') node.classList.add('special');
    if (card.value < 0) node.classList.add('negative');
    node.append(el('span', 'card-value', card.kind === 'reset' ? 'リセット' : card.label));
    const art = image(card.kind === 'max0' || card.value === 5 || card.value === 15 ? avatars[1] : card.value < 0 || card.value === 0 ? avatars[3] : card.value === 1 || card.value === 2 ? avatars[2] : avatars[0], 'card-art');
    node.append(art);
    if (card.kind === 'double') node.classList.add('orbit-card');
    return node;
  }
  function clearError() { $('inputError').textContent = ''; $('number').removeAttribute('aria-invalid'); }
  function fail(message) { $('inputError').textContent = message; $('number').setAttribute('aria-invalid', 'true'); }
  function detachTransport() {
    if (typeof unsubscribe === 'function') unsubscribe();
    unsubscribe = null; transport = null;
  }
  function newLobby() {
    detachTransport(); human = 'p1'; timer.cancel(); state = G.createLobby({ name: 'あなた', botCount: 3 }); avatarChoice = {}; selectedBot = 'p2';
    view = G.publicView(state, human); renderLobby(); show('lobbyScreen', 'beginGame');
  }
  function renderLobby() {
    $('playerCount').textContent = view.players.length + '/8';
    const selected = view.players.find(p => p.id === selectedBot && p.kind === 'bot');
    if (!selected) selectedBot = view.players.find(p => p.kind === 'bot')?.id;
    const grid = $('lobbyPlayers'); grid.replaceChildren();
    for (let i = 0; i < 8; i++) {
      const p = view.players[i];
      if (!p) { const slot = el('button', 'lobby-seat empty'); slot.type = 'button'; slot.setAttribute('aria-label', 'BOTを追加'); slot.append(el('b', '', '+'), el('small', '', 'BOTを追加')); slot.onclick = addBot; grid.append(slot); continue; }
      const slot = el(p.kind === 'bot' ? 'button' : 'div', 'lobby-seat' + (p.id === selectedBot ? ' selected' : ''));
      slot.dataset.seat = p.id;
      if (p.id === 'p1') slot.append(el('span', 'crown', '♛'));
      slot.append(image(avatar(p.id)), el('strong', '', name(p.id)), el('small', '', p.kind === 'human' ? 'ホスト · ' + p.wins + '勝' : 'BOT · ' + difficultyNames[p.difficulty]));
      if (p.kind === 'bot') { slot.type = 'button'; slot.setAttribute('aria-pressed', String(p.id === selectedBot)); slot.onclick = () => { selectedBot = p.id; renderLobby(); }; }
      grid.append(slot);
    }
    const bot = view.players.find(p => p.id === selectedBot);
    $('selectedBotLabel').textContent = bot ? ' — ' + name(bot.id) : '';
    $('addBot').disabled = view.players.length >= 8; $('removeBot').disabled = view.players.length <= 1;
    $('beginGame').disabled = view.players.length < 2;
    document.querySelectorAll('[data-avatar]').forEach(button => { button.disabled = !bot; });
    document.querySelectorAll('[data-difficulty]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.difficulty === (bot?.difficulty || nextDifficulty))));
    document.querySelectorAll('[data-avatar]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.avatar) === avatarIndex(selectedBot || 'p2'))));
  }
  function addBot() { if (transport || !state) return; const next = G.addBot(state, nextDifficulty); if (next === state) return; selectedBot = next.players.find(p => !state.players.some(old => old.id === p.id)).id; state = next; view = G.publicView(state, human); renderLobby(); }
  function renderPlayers() {
    const grid = $('playerGrid'); grid.replaceChildren(); grid.classList.toggle('many', view.players.length > 4);
    for (const p of view.players) {
      const block = el('div', 'battle-player' + (p.id === human ? ' self' : '') + (p.id === view.turn ? ' active' : '') + (p.eliminated ? ' eliminated' : ''));
      block.dataset.player = p.id;
      const info = el('div', 'player-info'); info.append(el('div', 'player-name', name(p.id)), image(avatar(p.id)));
      const hearts = el('div', 'hearts', '♥'.repeat(p.life) + '♡'.repeat(3 - p.life)); hearts.setAttribute('aria-label', name(p.id) + 'のライフ ' + p.life + ' / 3'); info.append(hearts);
      const card = view.hands[p.id];
      const out = !Object.prototype.hasOwnProperty.call(view.hands, p.id) && p.eliminated;
      const node = cardNode(card, view.phase === 'play' && p.id === human && !out, out);
      if (p.id === human) node.id = 'humanCard';
      node.setAttribute('aria-label', out ? name(p.id) + ' 脱落' : view.phase === 'play' && p.id === human ? 'あなたの非公開カード' : name(p.id) + 'のカード ' + (card?.label || '?'));
      block.append(info, node); grid.append(block);
    }
  }
  function renderResult() {
    const r = view.result; $('resultCards').replaceChildren(); $('calculationSteps').replaceChildren();
    if (!r) { $('resultText').textContent = ''; $('finalTotal').textContent = ''; return; }
    $('resultTitle').textContent = r.winner ? '対戦終了！' : '全カード公開！';
    const numeric = Object.values(r.cards).filter(c => c.kind === 'number');
    const line = (label, expression) => { const row = el('div', 'calc-line'); row.append(el('div', '', label), el('div', 'calc-expression', expression)); $('calculationSteps').append(row); };
    if (r.extraCard) {
      const extra = el('div', 'extra-reveal');
      extra.append(el('span', '', '「?」で追加公開'), cardNode(r.extraCard));
      $('calculationSteps').append(extra);
    }
    if (r.removedCard) line('MAX→0：最大の数字1枚を0に', r.removedCard.label + ' → 0');
    line('数字の合計', numeric.map(c => c.id === r.removedCard?.id ? '0' : c.value < 0 ? '(' + c.value + ')' : c.value).join(' + ') + (r.extraCard?.kind === 'number' ? ' + ' + (r.extraCard.id === r.removedCard?.id ? 0 : '(' + r.extraCard.value + ')') : '') + ' = ' + r.baseSum);
    if (r.multiplier !== 1) line('×2 の効果', r.baseSum + ' × 2 = ' + r.sum);
    if (r.reset) $('calculationSteps').append(el('div', 'calc-line', 'リセット：この判定後、全36枚を混ぜ直します。'));
    $('finalTotal').textContent = r.sum;
    const loser = view.players.find(p => p.id === r.loser);
    $('resultText').textContent = r.winner ? name(r.winner) + 'の優勝！ 通算 ' + view.players.find(p => p.id === r.winner).wins + '勝' : name(r.bidder) + 'の宣言 ' + r.bid + (r.bid > r.sum ? ' > ' : ' ≤ ') + r.sum + '。' + name(r.loser) + 'の負け！' + (loser.eliminated ? ' 脱落しました。' : ' ライフが1減りました。');
    $('next').textContent = r.winner ? 'もう一度遊ぶ　›' : '次のラウンドへ　›';
  }
  function renderBattle(previous = null) {
    renderPlayers(); $('roundLabel').textContent = 'ラウンド ' + view.round; $('survivorCount').textContent = '生存者 ' + view.players.filter(p => !p.eliminated).length + '/' + view.players.length;
    $('bid').textContent = view.bid ?? '—'; $('lastBidder').textContent = view.last ? name(view.last) + ' の宣言' : '最初の宣言をどうぞ';
    const active = view.phase === 'play', yourTurn = active && view.turn === human;
    $('gamePanel').classList.toggle('hide', !active); $('result').classList.toggle('hide', active); $('result').classList.toggle('open', !active);
    const alive = !view.players.find(p => p.id === human)?.eliminated;
    $('status').textContent = active ? yourTurn ? 'あなたの手番です' : alive ? name(view.turn) + ' が考えています…' : 'あなたは脱落しました。残りの対戦を見届けよう。' : '';
    $('declare').disabled = !yourTurn || view.bid === Number.MAX_SAFE_INTEGER;
    $('challenge').disabled = !yourTurn || view.bid === null;
    $('number').disabled = !yourTurn;
    document.querySelectorAll('#keypad button').forEach(button => { button.disabled = !yourTurn; });
    if (yourTurn) { $('number').value = view.bid === null ? '0' : view.bid === Number.MAX_SAFE_INTEGER ? '' : String(view.bid + 1); suggested = true; }
    $('next').disabled = active; renderResult();
    if (screen === 'battleScreen' && $('restartConfirm').classList.contains('hide')) {
      if (!active && previous?.phase === 'play') $('resultTitle').focus();
      else if (yourTurn && previous) $('status').focus({ preventScroll: true });
    }
  }
  function receive(next) {
    const previous = view; view = next; clearError();
    if (view.phase === 'lobby') renderLobby(); else renderBattle(previous);
  }
  function apply(next) {
    if (next === state) return false;
    timer.cancel(); state = next; receive(G.publicView(state, human));
    if (state.phase === 'play' && state.turn !== human) {
      const captured = state;
      timer.schedule(() => {
        if (transport || state !== captured || state.phase !== 'play') return;
        const action = G.chooseBotAction(G.botView(state, state.turn), Math.random);
        if (!action) return;
        const updated = action.type === 'challenge' ? G.challenge(state, state.turn, Math.random) : G.declare(state, state.turn, action.value);
        if (updated !== state) { sound(action.type === 'challenge'); apply(updated); }
      }, 650 + Math.random() * 450);
    }
    return true;
  }
  function action(type, value) {
    if (!view) return false;
    if (transport) { Promise.resolve(transport.send({ type, player: human, value, revision: view.revision })).catch(() => fail('接続を確認して、もう一度お試しください。')); return true; }
    const next = G.dispatch(state, { type, player: human, value, revision: view.revision }, Math.random);
    const changed = apply(next); if (changed) sound(type === 'challenge'); return changed;
  }
  $('startGame').onclick = newLobby; $('joinLocal').onclick = newLobby; $('lobbyBack').onclick = () => show('homeScreen', 'startGame');
  $('joinGame').onclick = () => show('joinPanel', 'closeJoin'); $('closeJoin').onclick = () => show('homeScreen', 'joinGame');
  $('addBot').onclick = addBot;
  $('removeBot').onclick = () => { if (transport) return; state = G.removeBot(state, selectedBot); view = G.publicView(state, human); renderLobby(); };
  document.querySelectorAll('[data-avatar]').forEach(button => { button.onclick = () => { avatarChoice[selectedBot] = Number(button.dataset.avatar); renderLobby(); }; });
  document.querySelectorAll('[data-difficulty]').forEach(button => { button.onclick = () => { nextDifficulty = button.dataset.difficulty; if (!transport) { state = G.setDifficulty(state, selectedBot, nextDifficulty); view = G.publicView(state, human); renderLobby(); } }; });
  $('beginGame').onclick = () => { if (transport) return; show('battleScreen'); apply(G.startGame(state, Math.random)); window.scrollTo(0, 0); $('status').focus({ preventScroll: true }); };
  $('declare').onclick = () => {
    const value = G.parseBid($('number').value);
    if (value === null || !action('declare', value)) { fail('前より大きな0以上の整数を入力してください（最大9007199254740991）。'); $('number').focus(); }
  };
  $('challenge').onclick = () => action('challenge');
  $('next').onclick = () => action(view.phase === 'finished' ? 'rematch' : 'nextRound');
  document.querySelectorAll('[data-digit]').forEach(button => { button.onclick = () => {
    if ($('number').disabled) return;
    const prior = suggested ? '' : $('number').value, next = prior === '0' ? button.dataset.digit : prior + button.dataset.digit;
    if (next.length > 16 || G.parseBid(next) === null) { fail('入力できる最大の整数は9007199254740991です。'); return; }
    $('number').value = next; suggested = false; clearError();
  }; });
  $('backspace').onclick = () => { if (!$('number').disabled) { $('number').value = $('number').value.slice(0, -1); suggested = false; clearError(); } };
  $('number').addEventListener('input', () => { suggested = false; clearError(); });
  $('number').addEventListener('keydown', event => { if (event.key === 'Enter' && !$('declare').disabled) { event.preventDefault(); $('declare').click(); } });
  function confirm(intent) { confirmIntent = intent; $('restartTitle').textContent = intent === 'home' ? '対戦を終了してホームへ？' : '対戦を終了してロビーへ？'; $('restartText').textContent = '現在の対戦は終了します。続ける場合はキャンセルしてください。'; $('confirmRestart').textContent = intent === 'home' ? '終了して戻る' : 'ロビーへ戻る'; $('restartConfirm').classList.remove('hide'); $('homeBtn').setAttribute('aria-expanded', 'true'); $('cancelRestart').focus(); }
  function closeConfirm() { $('restartConfirm').classList.add('hide'); $('homeBtn').setAttribute('aria-expanded', 'false'); (confirmIntent === 'home' ? $('homeBtn') : $('restartBtn')).focus(); }
  $('homeBtn').onclick = () => confirm('home'); $('restartBtn').onclick = () => confirm('lobby'); $('cancelRestart').onclick = closeConfirm;
  $('confirmRestart').onclick = () => { timer.cancel(); closeConfirm(); if (confirmIntent === 'home') { detachTransport(); state = null; view = null; show('homeScreen', 'startGame'); } else newLobby(); };
  function overlay(id, trigger) { overlayReturn = { screen, trigger }; show(id); }
  function closeOverlay() { const back = overlayReturn || { screen: 'homeScreen', trigger: $('startGame') }; show(back.screen); back.trigger?.focus(); overlayReturn = null; }
  $('homeRules').onclick = () => { overlay('guidePanel', $('homeRules')); guide('rules'); };
  $('homeCards').onclick = () => { overlay('guidePanel', $('homeCards')); guide('cards'); };
  $('rulesBtn').onclick = () => { overlay('guidePanel', $('rulesBtn')); guide('rules'); };
  $('closeGuide').onclick = closeOverlay;
  const openSettings = trigger => { overlay('settingsPanel', trigger); $('soundToggle').focus(); };
  $('homeSettings').onclick = () => openSettings($('homeSettings'));
  document.querySelectorAll('.settings-open').forEach(button => { button.onclick = () => openSettings(button); });
  $('closeSettings').onclick = closeOverlay;
  $('soundToggle').onchange = () => { settings.sound = $('soundToggle').checked; saveSettings(); sound(); };
  $('motionToggle').onchange = () => { settings.motion = $('motionToggle').checked; saveSettings(); };
  document.querySelectorAll('[data-tab]').forEach(button => { button.onclick = () => guide(button.dataset.tab); });
  function guide(tab) {
    const container = $('guideContent'); container.replaceChildren();
    document.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.tab === tab)));
    if (tab === 'rules') {
      container.append(el('h2', '', '遊び方'));
      const steps = [['カードを配る','自分のカードだけ見えません。他の人のカードを見て、全員の合計を予想しよう。'],['数字を宣言','最初は0以上の整数。次の人は、前の宣言より大きな数を宣言します。'],['グラビティ！','直前の宣言が合計を超えていると思ったら、グラビティ！で挑戦。'],['勝敗判定','全カードを公開し、特殊効果を含めて合計。宣言が合計より大きければ宣言者の負け。合計以下なら、疑った側の負け。'],['最後まで生き残ろう','負けるとライフが1減り、0で脱落。最後の1人が優勝！次のラウンドは負けた人から（脱落時は次の生存者）。']];
      steps.forEach(([title, text], index) => {
        const section = el('section', 'guide-step');
        section.append(el('b', 'step-number', index + 1), el('h3', '', title), el('p', '', text));
        const illustration = el('div', 'step-art'); illustration.setAttribute('aria-hidden', 'true');
        if (index === 0) illustration.append(cardNode(null, true));
        else {
          illustration.append(image(avatars[index === 3 ? 2 : 0]));
          if (index === 1 || index === 2) illustration.append(el('span', 'speech-bubble', index === 1 ? '12 !' : 'グラビティ！'));
          if (index === 4) illustration.append(el('span', 'step-crown', '♛'));
        }
        section.append(illustration); container.append(section);
      });
      container.append(el('p', '', '1人 + BOT 1〜7体、最大8人。ライフ3。再戦しても通算勝利数は引き継ぎます。'));
    } else if (tab === 'cards') {
      container.append(el('h2', '', 'カード図鑑（全36枚）'), el('h3', '', '数字カード 32枚'));
      const grouped = new Map(); for (const c of G.FULL_DECK) { const key = c.kind + ':' + c.value; if (!grouped.has(key)) grouped.set(key, { card: c, count: 0 }); grouped.get(key).count++; }
      const catalogue = el('div', 'catalogue');
      [...grouped.values()].filter(x => x.card.kind === 'number').sort((a, b) => a.card.value - b.card.value).forEach(({ card, count }) => { const item = el('div'); item.append(cardNode(card), el('small', '', '×' + count)); catalogue.append(item); });
      container.append(catalogue, el('h3', '', '特殊カード 4枚（各1枚）'));
      const descriptions = { double: '数字の合計を2倍にします。マイナスの合計にも適用。', max0: '場の最大の正の数字カードを1枚だけ0にします。同じ最大値が複数あっても1枚だけ。', extra: '判定時に山札から1枚だけ追加公開。数字も特殊効果も合計に反映。連鎖して追加はしません。', reset: '数字としては0。このラウンドの判定後に全36枚を混ぜ直します。合計自体を0にはしません。' };
      [...grouped.values()].filter(x => x.card.kind !== 'number').forEach(({ card }) => { const row = el('div', 'special-rule'), copy = el('p'); copy.append(el('strong', '', card.kind === 'reset' ? 'リセット' : card.label), el('br'), document.createTextNode(descriptions[card.kind])); row.append(cardNode(card), copy); container.append(row); });
    } else if (tab === 'bots') {
      container.append(el('h2', '', 'BOTについて'), el('p', '', '一緒に遊べる3段階のBOT。ロビーで1体ずつ難易度を選べます。'));
      const descriptions = ['判断にゆらぎが多め。まずはのんびり練習したい人に。','見えているカードと公開済みの情報からバランスよく判断。','公開情報から合計の可能性を比較し、慎重に挑戦します。'];
      ['easy','normal','hard'].forEach((d, i) => { const row = el('div', 'guide-bot'), copy = el('div'); copy.append(el('h3', '', difficultyNames[d]), el('p', '', descriptions[i])); row.append(image(avatars[i]), copy); container.append(row); });
      container.append(el('p', '', 'BOTも自分のカードや山札の中身は見ていません。難易度を変えても、見える情報は同じです。'));
    } else {
      container.append(el('h2', '', '計算例'));
      const samples = [
        ['通常の合計','3、5、−5 の場合','3 + 5 − 5 = 3',[3,5,-5],3],
        ['×2 の効果','数字を合計してから2倍','(3 + 5 − 5) × 2 = 6',[3,5,-5,'double'],6],
        ['MAX→0','10、5、3 なら、10を1枚だけ0に','0 + 5 + 3 = 8',[10,5,3,'max0'],8],
        ['「?」の追加公開','追加で10が出た場合','5 + 4 + 10 = 19',[5,4,'extra'],19,10],
        ['マイナスとリセット','判定後、全36枚を混ぜ直します。合計は0になりません。','−5 − 10 + 0 = −15',[-5,-10,'reset'],-15]
      ];
      for (const [title, text, expression, values, total, extra] of samples) {
        const row = el('section', 'example'), visual = el('div', 'example-visual'), cards = el('div', 'example-cards');
        const find = value => G.FULL_DECK.find(card => typeof value === 'number' ? card.kind === 'number' && card.value === value : card.kind === value);
        for (const value of values) cards.append(cardNode(find(value)));
        if (extra !== undefined) { const additional = el('div', 'example-extra'); additional.append(el('small', '', '追加'), cardNode(find(extra))); cards.append(additional); }
        const result = el('div', 'example-total'); result.append(el('span', '', '最終合計'), el('strong', '', total));
        visual.append(cards, result); row.append(el('h3', '', title), visual, el('p', '', text), el('div', 'example-expression', expression)); container.append(row);
      }
    }
    container.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', event => { if (event.key !== 'Escape') return; if (!$('restartConfirm').classList.contains('hide')) closeConfirm(); else if (screen === 'guidePanel' || screen === 'settingsPanel') closeOverlay(); else if (screen === 'joinPanel') show('homeScreen', 'joinGame'); });
  window.addEventListener('pagehide', () => timer.cancel());
  window.addEventListener('pageshow', event => { if (event.persisted && state && !transport) { const old = state; state = null; apply(old); } });
  // Transport-neutral seam. The caller must provide an authenticated, sanitized public
  // view stream; no network SDK, room backend, or pretend remote users are included.
  window.NumberBluffClient = Object.freeze({
    connect(adapter) {
      if (!adapter || typeof adapter.subscribe !== 'function' || typeof adapter.send !== 'function') throw new TypeError('Adapter requires subscribe(onPublicView) and send(action).');
      timer.cancel(); detachTransport(); transport = adapter; state = null;
      let first = true;
      unsubscribe = adapter.subscribe(publicState => {
        if (!publicState || typeof publicState.viewerId !== 'string' || !Array.isArray(publicState.players) || !publicState.players.some(player => player.id === publicState.viewerId && player.kind === 'human')) {
          throw new TypeError('Adapter public view must identify its authenticated human viewer.');
        }
        human = publicState.viewerId;
        receive(publicState);
        if (first || screen === 'lobbyScreen') { show(publicState.phase === 'lobby' ? 'lobbyScreen' : 'battleScreen'); first = false; }
      });
    },
    disconnect() { timer.cancel(); detachTransport(); state = null; view = null; show('homeScreen', 'startGame'); }
  });
  saveSettings();
})();
