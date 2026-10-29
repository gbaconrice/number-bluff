(() => {
  'use strict';
  const G = window.NumberBluff, timer = window.NumberBluffScheduler(), $ = id => document.getElementById(id);
  const audio = window.NumberBluffAudio.create();
  function updateSoundButtons() {
    const muted = audio.isMuted();
    document.querySelectorAll('[data-sound-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(muted));
      button.setAttribute('aria-label', muted ? '音をオンにする' : '音をオフにする');
      button.title = muted ? '音をオンにする' : '音をオフにする';
      const icon = button.querySelector('b');
      if (icon) icon.textContent = '♪'; else button.textContent = '♪';
      button.classList.toggle('is-muted', muted);
    });
  }
  document.querySelectorAll('[data-sound-toggle]').forEach(button => {
    button.addEventListener('click', event => {
      audio.setMuted(!audio.isMuted(), event);
      updateSoundButtons();
      if (!audio.isMuted()) audio.play('tap');
    });
  });
  updateSoundButtons();
  const cardReveal = window.NumberBluffCardReveal.createController();
  const sceneMotion = window.NumberBluffSceneMotion.create();
  const gameplayFeedback = window.NumberBluffGameplayFeedback.create();
  const specialSVG = window.NumberBluffSpecialSVG.createManager();
  const specialRenderer = {ready:Promise.resolve(true),play(node,kind,{duration}){specialSVG.attach(node,kind,{faceUp:true,imageElement:node.querySelector('img.card-art')});return specialSVG.play(node,{duration});},stop(){specialSVG.stop();},destroy(){specialSVG.destroy();}};
  const specialEffects = window.NumberBluffSpecialEffects.create({renderer:specialRenderer,busy:()=>presenter.active});
  let detailEffectEpoch = 0;
  const motionCards = new Set();
  function syncCardMotion() {
    specialEffects.sync();
    for (const node of motionCards) if (!node.isConnected) { specialSVG.detach(node); motionCards.delete(node); }
    for (const node of document.querySelectorAll('.screen:not(.hide) .player-card:not(.hidden):not(.out), dialog[open] .player-card:not(.hidden):not(.out)')) {
      const kind = ['extra','double','max0','reset'].find(value => node.classList.contains('kind-' + value));
      if (kind) { motionCards.add(node); specialSVG.attach(node, kind, { faceUp: true, imageElement: node.querySelector('img.card-art') }); }
    }
    specialSVG.refresh();
  }
  // Countdown text and SVG-internal changes never alter the set of card hosts.
  // Avoid measuring every card on those frequent unrelated child mutations.
  const containsCard = node => node.nodeType === 1 && (node.matches('.player-card') || node.querySelector('.player-card'));
  const motionObserver = new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(containsCard))) syncCardMotion();
  });
  motionObserver.observe(document.querySelector('main'), {childList:true,subtree:true});
  let roomActions = {}, roomRequest = 0, listRequest = 0, roomBusy = false, roomAdapterExpected = false, cancelRoomOperation = null;
  const sessionFinishListeners = new Set();
  let connectionBlocked = false, connectionMessage = '';
  const screenListeners = new Set(), screenNames = { homeScreen: 'home', lobbyScreen: 'lobby', battleScreen: 'battle', guidePanel: 'guide', joinPanel: 'join' };
  const updateViewport = () => document.documentElement.style.setProperty('--nb-viewport-height', (window.visualViewport?.height || window.innerHeight) + 'px');
  window.addEventListener('resize', updateViewport); window.visualViewport?.addEventListener('resize', updateViewport); updateViewport();
  let human = 'p1', localProfile = { name: 'プレイヤー', avatarUrl: null };
  const safeAvatar = value => { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; } };
  const difficultyNames = { easy: 'やさしい', normal: '普通', hard: '強い' };
  const avatars = ['assets/star-sprite.webp', 'assets/moon-cat.webp', 'assets/cloud-bunny.webp', 'assets/blue-cloud.webp'];
  const avatarNames = ['ほしもち', 'ほしねこ', 'もふうさ', 'くもまる'];
  let state = null, view = null, screen = 'homeScreen', selectedBot = 'p2', nextDifficulty = 'normal';
  let avatarChoice = {}, suggested = true, overlayReturn = null;
  const localRoundClock = window.NumberBluffRoundAdvanceClock.create({expire(){if(!transport&&state?.phase==='reveal')apply(G.nextRound(state,Math.random));}});
  const localTurnClock = window.NumberBluffLocalTurnClock({ expire() {
    if (transport || state?.phase !== 'play' || state.turn !== human) return;
    const value = state.bid === null ? 1 : state.bid + 1;
    if (!Number.isSafeInteger(value)) {
      apply(G.returnToLobby(state));
      connectionMessage = '扱える数字の上限に達したため、勝敗をつけずロビーに戻りました。'; paintConnectionStatus();
      return;
    }
    apply(G.declare(state, human, value));
  } });
  let presentationFrame = null, presentationPrevious = null, presentationKey = null, roomEpoch = 0, nextReadyAt = 0;
  let transport = null, unsubscribe = null, turnDisplayTimer = null;
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; };
  const image = (src, cls = '') => { const node = el('img', cls); node.src = src; node.alt = ''; return node; };
  const avatarIndex = id => { const p = view?.players.find(p => p.id === id); const value = p?.botAvatar ?? avatarChoice[id]; return Number.isInteger(value) && value >= 0 && value < 4 ? value : (Math.max(0, Number(String(id).replace(/\D/g, '')) - 1) % 4); };
  function playerAvatar(id) {
    const p = view?.players.find(p => p.id === id);
    if (p?.kind !== 'human') return image(avatars[avatarIndex(id)], 'avatar');
    const url = safeAvatar(p.avatarUrl ?? (p.id === human ? localProfile.avatarUrl : null));
    const placeholder = () => { const n = el('span', 'avatar person-placeholder'); n.setAttribute('aria-hidden', 'true'); return n; };
    if (!url) return placeholder();
    const n = image(url, 'avatar profile-avatar'); n.referrerPolicy = 'no-referrer'; n.addEventListener('error', () => n.replaceWith(placeholder()), { once: true }); return n;
  }
  const name = id => {
    const player = view?.players.find(p => p.id === id);
    if (!player) return '';
    if (player.kind === 'human') return player.name || (player.id === human ? localProfile.name : 'プレイヤー');
    const duplicate = view.players.filter(p => p.kind === 'bot' && avatarIndex(p.id) === avatarIndex(id)).length > 1;
    return avatarNames[avatarIndex(id)] + (duplicate ? ' ' + id.slice(1) : '');
  };
  const presenter = window.NumberBluffPresentation.createPresenter({
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    onPhase: paintPresentationFrame
  });
  function cancelPresentation(settle = false) {
    if (presenter.active) audio.stop();
    specialEffects.stop(); cardReveal.settleAll(); sceneMotion.leave(); gameplayFeedback.stop();
    presenter.cancel(); presentationFrame = null; presentationPrevious = null;
    if (settle && view?.result && view.phase !== 'play' && view.phase !== 'lobby') { renderPlayers(); renderResult(); }
  }
  function paintPresentationFrame(frame, key) {
    if (key !== presentationKey || !view?.result || view.phase === 'play' || view.phase === 'lobby') return;
    specialEffects.stop();
    const hadOutcome = presentationFrame?.outcomeVisible;
    const phaseSound = { hold: 'challenge', reveal: 'reveal', extra: 'extra', max: 'max', sum: 'sum', multiply: 'multiply', reset: 'reset', compare: 'compare' };
    if (frame.outcomeVisible && !hadOutcome) audio.play(view.result.winner === human ? 'win' : view.result.loser === human ? 'loss' : 'outcome');
    else if (phaseSound[frame.phase]) audio.play(phaseSound[frame.phase]);
    presentationFrame = frame;
    if (frame.outcomeVisible && !hadOutcome) {
      renderPlayers();
      const loser = view.players.find(p => p.id === view.result.loser);
      const before = presentationPrevious?.find(p => p.id === loser?.id);
      if (loser && before?.life === loser.life + 1 && !frame.complete) {
        const block = [...$('playerGrid').children].find(n => n.dataset.player === loser.id);
        gameplayFeedback.play('life', block?.querySelectorAll('.life-heart')[loser.life], key + ':life:' + loser.id);
      }
    }
    for (const p of view.players) {
      const card = view.result.cards[p.id]; if (!card) continue;
      const block = [...$('playerGrid').children].find(n => n.dataset.player === p.id); if (!block) continue;
      let node = block.querySelector('.player-card');
      if (frame.revealedIds.includes(card.id) && node.classList.contains('hidden')) {
        const face = cardNode(card); face.classList.add('presentation-card'); face.dataset.cardId = card.id; face.dataset.revealed = 'true';
        if (p.id === human) face.id = 'humanCard'; face.setAttribute('aria-label', name(p.id) + 'のカード ' + card.label); cardReveal.reveal({ key: key + ':' + card.id, back: node, face, authorized: true }); node = face;
      }
      node.classList.toggle('is-adding', frame.phase === 'sum' && frame.cardId === card.id);
      node.classList.toggle('is-zeroed', frame.removedCardId === card.id);
      if (frame.removedCardId === card.id && !node.querySelector('.presentation-zero-stamp')) node.append(zeroEffectBadge());
    }
    renderResult();
    const specialKind = {extra:'extra',max:'max0',multiply:'double',reset:'reset'}[frame.phase];
    if (specialKind && !frame.complete) {
      const node = [...document.querySelectorAll('#battleScreen .player-card.kind-'+specialKind)].find(n=>!n.classList.contains('hidden'));
      specialEffects.play(node,{key:key+':special:'+frame.phase,duration:frame.phase==='reset'?350:400,priority:true});
    }
    if (frame.outcomeVisible && !hadOutcome) sceneMotion.celebrate({ key, confirmed: true, won: view.result.winner === human });
    if (frame.outcomeVisible && !hadOutcome) $('resultAnnouncement').textContent = '最終合計 ' + view.result.sum + '。' + $('resultText').textContent;
  }
  function show(id, focus = null) {
    if (screen === 'battleScreen' && id !== screen) { audio.stop(); cancelPresentation(true); }
    for (const node of document.querySelectorAll('.screen')) node.classList.toggle('hide', node.id !== id);
    stopDetailEffect(); screen = id; paintTurnDisplay(); cardReveal.settleAll(); syncCardMotion(); window.scrollTo(0, 0);
    for (const listener of screenListeners) { try { listener(screenNames[id]); } catch {} }
    if (focus) $(focus).focus({ preventScroll: true });
  }
  function cardLabel(card) { return card.kind === 'reset' ? 'リセット（0）' : card.label; }
  function cardNode(card, hidden = false, out = false) {
    const node = el('div', 'player-card');
    if (out) { node.classList.add('out'); node.textContent = '脱落'; return node; }
    if (hidden || !card) { node.classList.add('hidden'); node.textContent = '?'; return node; }
    node.classList.add('kind-' + card.kind);
    if (card.kind !== 'number') node.classList.add('special');
    if (card.value < 0) node.classList.add('negative');
    const content = window.NumberBluffCardArt.content(document, card);
    content.append(el('span', 'card-value', cardLabel(card)));
    if (card.kind === 'number') { node.classList.add('normal-card'); node.dataset.artValue = String(card.value); }
    content.append(window.NumberBluffCardArt.create(document, card));
    node.append(content);
    return node;
  }
  function clearError() { $('inputError').textContent = ''; $('number').removeAttribute('aria-invalid'); }
  function fail(message) { $('inputError').textContent = message; $('number').setAttribute('aria-invalid', 'true'); }
  function captureSessionFinish(reason = 'explicit-exit', game = view?.game) {
    if (!transport || !view || !Number.isSafeInteger(view.game) || view.game < 1) return null;
    const player = view.players.find(p => p.id === human && p.kind === 'human');
    if (!player || !Number.isSafeInteger(player.bestStreak) || player.bestStreak < 0) return null;
    return { reason, game, sessionId: roomEpoch, roomId: view.roomId,
      viewerId: human, player: { id: player.id, kind: player.kind, bestStreak: player.bestStreak } };
  }
  function publishSessionFinish(result) {
    if (result) for (const listener of sessionFinishListeners) { try { listener(result); } catch {} }
  }
  function detachTransport() {
    audio.stop(); stopTurnDisplay(); localTurnClock.cancel(); localRoundClock.cancel(); cancelPresentation(); presentationKey = null; roomEpoch++;
    if (typeof unsubscribe === 'function') unsubscribe();
    unsubscribe = null; const old = transport; transport = null; connectionBlocked = false; connectionMessage = '';
    if (typeof old?.close === 'function') old.close();
    paintConnectionStatus();
  }
  async function requestRoom(kind, roomId) {
    if (roomBusy) return;
    const status = $(kind === 'create' ? 'roomCreateStatus' : 'roomJoinStatus');
    const button = $(kind === 'create' ? 'startGame' : 'joinRoom');
    if (typeof roomActions[kind] !== 'function') { if (kind === 'create' && !roomAdapterExpected && !$('privateRoom').checked) { createLocalHostRoom(); return; } status.textContent = kind === 'create' && $('privateRoom').checked ? 'プライベートルームは準備中です。' : '接続待ち'; return; }
    const request = ++roomRequest; roomBusy = true; button.disabled = true; status.textContent = '接続中…';
    try {
      const adapter = await roomActions[kind](kind === 'join' ? roomId : ($('privateRoom').checked ? 1 : 0));
      if (request !== roomRequest) { adapter?.close?.(); return; }
      if (adapter) window.NumberBluffClient.connect(adapter, { roomPermission: kind === 'create' ? ($('privateRoom').checked ? 1 : 0) : null });
      status.textContent = view ? '' : connectionMessage || 'ホストからの情報を待っています…';
    } catch { if (request === roomRequest) status.textContent = '接続できませんでした。もう一度お試しください。'; }
    finally { roomBusy = false; if (request === roomRequest) button.disabled = false; }
  }
  function cancelRoomRequest() { ++roomRequest; ++listRequest; if (cancelRoomOperation) cancelRoomOperation(); $('startGame').disabled = false; $('joinRoom').disabled = false; $('roomCreateStatus').textContent = ''; $('roomJoinStatus').textContent = ''; }
  function createLocalHostRoom() {
    detachTransport(); human = 'p1'; timer.cancel(); state = G.createLobby({ name: localProfile.name, botCount: 0 }); state.players[0].avatarUrl = localProfile.avatarUrl; avatarChoice = {}; selectedBot = null;
    view = G.publicView(state, human); renderLobby(); show('lobbyScreen');
  }
  const canManageLobby = () => !connectionBlocked && (!transport || (typeof view?.hostId === 'string' && view.hostId === human));
  function lobbyAction(type, details = {}) {
    if (!transport || !canManageLobby()) return;
    $('lobbyError').textContent = '';
    Promise.resolve(transport.send({ type, player: human, revision: view.revision, ...details })).catch(() => { $('lobbyError').textContent = '接続を確認して、もう一度お試しください。'; });
  }
  function renderLobby() {
    $('playerCount').textContent = view.players.length + '/8';
    const roomId = typeof view.roomId === 'string' ? view.roomId : '';
    const idHeader = !!roomId;
    $('lobbyTitle').textContent = roomId;
    $('lobbyTitle').classList.toggle('is-room-id', idHeader);
    $('copyRoomId').classList.toggle('hide', !idHeader);
    $('lobbyHeaderSpacer').classList.toggle('hide', idHeader);
    $('roomCopyStatus').textContent = ''; $('roomCopyStatus').classList.add('hide');
    $('roomCopyFallback').classList.add('hide');
    const manage = canManageLobby(), hostId = transport ? view.hostId : 'p1';
    $('roomIdentity').classList.add('hide'); $('roomIdentity').textContent = '';
    $('lobbyError').textContent = '';
    const selected = view.players.find(p => p.id === selectedBot && p.kind === 'bot');
    if (!selected) selectedBot = view.players.find(p => p.kind === 'bot')?.id;
    const grid = $('lobbyPlayers'); grid.replaceChildren();
    for (let i = 0; i < 8; i++) {
      const p = view.players[i];
      if (!p) { const slot = el('button', 'lobby-seat empty'); slot.type = 'button'; slot.setAttribute('aria-label', 'BOTを追加'); slot.append(el('b', '', '+'), el('small', '', '参加待ち')); slot.onclick = addBot; slot.disabled = !manage; grid.append(slot); continue; }
      const slot = el(p.kind === 'bot' ? 'button' : 'div', 'lobby-seat' + (p.id === selectedBot ? ' selected' : ''));
      slot.dataset.seat = p.id;
      if (p.id === hostId) slot.append(el('span', 'crown', '♛'));
      slot.append(playerAvatar(p.id), el('strong', '', name(p.id)), el('small', '', p.kind === 'human' ? (p.id === hostId ? 'ホスト' : '参加中') + (p.wins ? ' · ' + p.wins + '勝' : '') : 'BOT · ' + difficultyNames[p.difficulty] + (p.wins > 0 ? ' · ' + p.wins + '勝' : '')));
      if (p.kind === 'bot') { slot.type = 'button'; slot.setAttribute('aria-pressed', String(p.id === selectedBot)); slot.onclick = () => { selectedBot = p.id; renderLobby(); }; }
      grid.append(slot);
    }
    const bot = view.players.find(p => p.id === selectedBot);
    $('selectedBotLabel').textContent = bot ? ' — ' + name(bot.id) : '';
    $('addBot').disabled = !manage || view.players.length >= 8; $('removeBot').disabled = !manage || !bot;
    $('beginGame').disabled = !manage || view.players.length < 2;
    document.querySelectorAll('[data-avatar]').forEach(button => { button.disabled = !manage || !bot; });
    document.querySelectorAll('[data-difficulty]').forEach(button => { button.disabled = !manage || !bot; button.setAttribute('aria-pressed', String(button.dataset.difficulty === (bot?.difficulty || nextDifficulty))); });
    document.querySelectorAll('[data-avatar]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.avatar) === avatarIndex(selectedBot || 'p2'))));
  }
  function addBot() { if (transport) { lobbyAction('addBot', { difficulty: nextDifficulty }); return; } if (!state) return; const next = G.addBot(state, nextDifficulty); if (next === state) return; selectedBot = next.players.find(p => !state.players.some(old => old.id === p.id)).id; state = next; view = G.publicView(state, human); renderLobby(); }
  function stopTurnDisplay() { if (turnDisplayTimer !== null) clearTimeout(turnDisplayTimer); turnDisplayTimer = null; }
  function paintTurnDisplay() {
    stopTurnDisplay();
    const badge = document.querySelector('.turn-countdown');
    paintRoundCountdown();
    if (!badge || connectionBlocked || view?.phase !== 'play' || !view.turnClock || screen !== 'battleScreen' || document.hidden) return;
    const seconds = Math.max(0, Math.ceil((view.turnClock.localDeadline - Date.now()) / 1000));
    badge.textContent = seconds > 0 ? '残り ' + seconds + '秒' : '確定待ち';
    badge.classList.toggle('is-urgent', seconds <= 10);
    badge.setAttribute('aria-label', seconds > 0 ? name(view.turn) + 'の手番、残り' + seconds + '秒' : 'ホストの宣言確定を待っています');
    if (seconds > 0) turnDisplayTimer = setTimeout(paintTurnDisplay, 200);
  }
  function paintRoundCountdown() {
    const clock=view?.roundClock;
    if(connectionBlocked||view?.phase!=='reveal'||!clock||presentationFrame&&!presentationFrame.complete||screen!=='battleScreen'||document.hidden)return;
    const remaining=Math.max(0,Math.ceil((clock.localDeadline-Date.now())/1000));
    const waiting=Date.now()<clock.localReadyAt;
    $('next').textContent=waiting?(canManageLobby()?'次のラウンドへ　›':'結果を確認中…'):canManageLobby()?`次のラウンドへ · ${remaining}秒`:`次のラウンドまで ${remaining}秒`;
    $('next').disabled=!canManageLobby();
    if(remaining>0)turnDisplayTimer=setTimeout(paintTurnDisplay,200);
  }
  function zeroEffectBadge() {
    const badge = el('span', 'presentation-zero-stamp');
    badge.setAttribute('role', 'img'); badge.setAttribute('aria-label', '黒猫の効果で0');
    badge.innerHTML = '<svg viewBox="0 0 64 68" aria-hidden="true" focusable="false"><g fill="#f7b9d3" stroke="#fff0c6" stroke-width="1.6"><ellipse cx="10" cy="23" rx="7" ry="10" transform="rotate(-28 10 23)"/><ellipse cx="24" cy="12" rx="7" ry="10" transform="rotate(-8 24 12)"/><ellipse cx="41" cy="12" rx="7" ry="10" transform="rotate(8 41 12)"/><ellipse cx="55" cy="23" rx="7" ry="10" transform="rotate(28 55 23)"/></g><path d="M32 27C24 27 21 34 14 41C6 49 11 62 21 62C26 62 28 59 32 59C36 59 39 62 44 62C55 62 59 49 51 41C44 34 40 27 32 27Z" fill="#29213d" stroke="#ffe7ba" stroke-width="2"/></svg>';
    badge.append(el('b', 'zero-effect-value', '0')); return badge;
  }
  function renderPlayers() {
    cardReveal.settleAll();
    const grid = $('playerGrid'), scrollTop = grid.scrollTop; grid.replaceChildren(); grid.classList.toggle('many', view.players.length > 4); grid.dataset.count = view.players.length;
    const held = presentationFrame && !presentationFrame.outcomeVisible;
    for (const player of view.players) {
      const p = held ? presentationPrevious?.find(old => old.id === player.id) || player : player;
      const block = el('div', 'battle-player' + (p.id === human ? ' self' : '') + (p.id === view.turn ? ' active' : '') + (p.eliminated ? ' eliminated' : ''));
      block.dataset.player = p.id;
      const info = el('div', 'player-info'); info.append(el('div', 'player-name', name(p.id)), playerAvatar(p.id));
      const hearts = el('div', 'hearts'); for (let i = 0; i < 3; i++) { const heart = el('span', 'life-heart', i < p.life ? '♥' : '♡'); heart.setAttribute('aria-hidden', 'true'); hearts.append(heart); } hearts.setAttribute('aria-label', name(p.id) + 'のライフ ' + p.life + ' / 3'); info.append(hearts);
      const card = view.hands[p.id], out = !Object.prototype.hasOwnProperty.call(view.hands, p.id) && p.eliminated;
      const hidden = !out && ((view.phase === 'play' && p.id === human) || (presentationFrame && !presentationFrame.revealedIds.includes(card?.id)));
      const node = cardNode(card, hidden, out);
      if (p.id === human) node.id = 'humanCard';
      node.setAttribute('aria-label', out ? name(p.id) + ' 脱落' : hidden ? name(p.id) + 'の非公開カード' : name(p.id) + 'のカード ' + (card?.label || '?'));
      if (view.phase !== 'play' && card) { node.classList.add('presentation-card'); node.dataset.cardId = card.id; node.dataset.revealed = hidden ? 'back' : 'true'; }
      block.append(info, node);
      if (p.wins > 0) info.append(el('span', 'wins-badge', p.wins + '勝'));
      grid.append(block);
    }
    grid.scrollTop = scrollTop; paintTurnDisplay();
  }
  function renderStagedResult() {
    const r = view.result, f = presentationFrame;
    $('result').dataset.presentationPhase = f.phase;
    $('battlePhase').textContent = f.outcomeVisible && r.winner ? '対戦結果' : 'ラウンド結果';
    $('resultTitle').textContent = $('battlePhase').textContent;
    $('calculationHeading').textContent = ({hold:'グラビティ！',reveal:'カードを公開',extra:'もう1枚、公開',max:'最大の1枚を0に',sum:'数字を足して…',multiply:'合計を2倍！',compare:'宣言と比べる',outcome:'判定結果'})[f.phase] || '計算の流れ';
    const line = (label, expression) => { const row = el('div', 'calc-line'); if (label) row.append(el('div', '', label)); row.append(el('div', 'calc-expression', expression)); $('calculationSteps').append(row); };
    if (f.extraVisible && r.extraCard) { const extra = el('div', 'extra-reveal'); const card = cardNode(r.extraCard); if (f.phase === 'extra') card.classList.add('presentation-extra'); if (f.removedCardId === r.extraCard.id) { card.classList.add('is-zeroed'); card.append(zeroEffectBadge()); } extra.append(el('span', '', '「?」で追加公開'), card); $('calculationSteps').append(extra); }
    if (f.removedCardId && r.removedCard) line('MAX→0', r.removedCard.label + ' → 0');
    if (f.terms.length) line('', f.terms.map(t => t.value < 0 ? '(' + t.value + ')' : String(t.value)).join(' + ') + ' = ' + (f.multiplierApplied ? r.baseSum : f.runningTotal));
    if (f.multiplierApplied) line('×2', r.baseSum + ' × 2 = ' + r.sum);
    if (f.compareVisible) line(name(r.bidder) + 'の宣言', r.bid + (r.bid > r.sum ? ' > ' : ' ≤ ') + r.sum);
    $('totalLabel').textContent = f.compareVisible ? '最終合計' : '計算中'; sceneMotion.setNumber($('finalTotal'), f.compareVisible ? r.sum : f.runningTotal ?? null);
    $('resultAvatar').replaceChildren(playerAvatar(f.outcomeVisible ? r.winner || r.loser : r.challenger));
    const loser = view.players.find(p => p.id === r.loser);
    $('resultText').textContent = f.outcomeVisible ? r.winner ? name(r.winner) + 'の優勝！ 通算 ' + view.players.find(p => p.id === r.winner).wins + '勝' : name(r.loser) + (loser.eliminated ? ' が脱落' : ' のライフ −1') : name(r.challenger) + '「グラビティ！」';
    $('next').textContent = '結果を見る'; $('next').disabled = connectionBlocked;
  }
  function renderResult() {
    const lobbyReturn = $('returnRoomLobby');
    lobbyReturn.classList.toggle('hide', view.phase !== 'finished' || !!(presentationFrame && !presentationFrame.complete));
    lobbyReturn.disabled = connectionBlocked || !canManageLobby();
    const r = view.result; $('calculationSteps').replaceChildren();
    if (!r) { $('resultText').textContent = ''; $('finalTotal').textContent = ''; return; }
    if (presentationFrame && !presentationFrame.complete) { renderStagedResult(); return; }
    $('result').dataset.presentationPhase = 'complete'; $('calculationHeading').textContent = '計算の流れ'; $('totalLabel').textContent = '最終合計';
    $('battlePhase').textContent = r.winner ? '対戦結果' : 'ラウンド結果';
    $('resultTitle').textContent = r.winner ? '対戦結果' : 'ラウンド結果';
    const numeric = [...Object.values(r.cards), ...(r.extraCard ? [r.extraCard] : [])].filter(c => c.kind === 'number');
    const line = (label, expression) => { const row = el('div', 'calc-line'); row.append(el('div', '', label), el('div', 'calc-expression', expression)); $('calculationSteps').append(row); };
    if (r.extraCard) {
      const extra = el('div', 'extra-reveal');
      extra.append(el('span', '', '「?」で追加公開'), cardNode(r.extraCard));
      $('calculationSteps').append(extra);
    }
    if (r.removedCard) line('MAX→0：最大の数字1枚を0に', r.removedCard.label + ' → 0');
    line('数字の合計', (numeric.map(c => c.id === r.removedCard?.id ? '0' : c.value < 0 ? '(' + c.value + ')' : String(c.value)).join(' + ') || '0') + ' = ' + r.baseSum);
    if (r.multiplier !== 1) line('×2 の効果', r.baseSum + ' × 2 = ' + r.sum);
    if (r.reset) $('calculationSteps').append(el('div', 'calc-line', 'リセット：この判定後、全36枚を混ぜ直します。'));
    sceneMotion.setNumber($('finalTotal'), r.sum, { instant: !presenter.active });
    const loser = view.players.find(p => p.id === r.loser);
    $('resultAvatar').replaceChildren(playerAvatar(r.winner || r.loser));
    $('resultText').textContent = r.winner ? name(r.winner) + 'の優勝！ 通算 ' + view.players.find(p => p.id === r.winner).wins + '勝' : name(r.loser) + (loser.eliminated ? ' が脱落' : ' のライフ −1') + '　' + r.bid + (r.bid > r.sum ? ' > ' : ' ≤ ') + r.sum;
    $('next').textContent = canManageLobby() ? (r.winner ? 'もう一度遊ぶ　›' : '次のラウンドへ　›') : 'ホストの操作を待っています';
    $('next').disabled = !canManageLobby(); paintTurnDisplay();
  }
  function renderBattle(previous = null) {
    const active = view.phase === 'play', yourTurn = active && view.turn === human && !connectionBlocked;
    gameplayFeedback.begin(roomEpoch + ':' + view.game + ':' + view.round);
    let startPresentation = false;
    if (active) { cancelPresentation(); presentationKey = null; $('resultAnnouncement').textContent = ''; }
    else if (view.result) {
      const key = roomEpoch + ':' + view.game + ':' + view.round;
      if (key !== presentationKey) {
        cancelPresentation(); presentationKey = key; sceneMotion.begin(key);
        if (previous?.phase === 'play' && screen === 'battleScreen') { presentationPrevious = previous.players; presentationFrame = window.NumberBluffPresentation.plan(view.result, view.players)[0]; startPresentation = true; }
      }
    }
    renderPlayers(); $('roundLabel').textContent = 'ラウンド ' + view.round; $('survivorCount').textContent = '生存者 ' + view.players.filter(p => !p.eliminated).length + '/' + view.players.length;
    document.querySelector('.turn-countdown')?.remove();
    if (active && view.turnClock) { const badge = el('span', 'turn-countdown'); badge.dataset.player = view.turn; $('survivorCount').before(badge); paintTurnDisplay(); }
    $('bid').textContent = view.bid ?? '—'; $('lastBidder').textContent = view.last ? name(view.last) + ' の宣言' : name(view.turn) + ' の番'; $('bidActor').replaceChildren(playerAvatar(view.last || view.turn));
    $('battleScreen').classList.toggle('is-result', !active); $('battlePhase').textContent = view.phase === 'finished' ? '対戦結果' : 'ラウンド結果'; $('battlePhase').classList.toggle('hide', active); $('battleTitle').querySelector('.battle-meta').classList.toggle('hide', !active);
    $('gamePanel').classList.toggle('hide', !active); $('result').classList.toggle('hide', active); $('result').classList.toggle('open', !active);
    const alive = !view.players.find(p => p.id === human)?.eliminated;
    $('status').textContent = active ? yourTurn ? 'あなたの手番です' : alive ? name(view.turn) + ' が考えています…' : 'あなたは脱落しました。残りの対戦を見届けよう。' : '';
    $('declare').disabled = !yourTurn || view.bid === Number.MAX_SAFE_INTEGER;
    $('challenge').disabled = !yourTurn || view.bid === null;
    document.querySelectorAll('#keypad button').forEach(button => { button.disabled = !yourTurn; });
    if (yourTurn) { $('number').textContent = view.bid === null ? '1' : view.bid === Number.MAX_SAFE_INTEGER ? '' : String(view.bid + 1); suggested = true; }
    $('next').disabled = active; renderResult();
    if (active && previous && (previous.phase !== 'play' || previous.round !== view.round || previous.game !== view.game)) {
      audio.play('deal');
      $('playerGrid').querySelectorAll('.player-card').forEach((node, i) => { node.classList.add('presentation-card', 'is-dealing'); node.style.animationDelay = (i * 30) + 'ms'; });
    } else if (active && previous && previous.bid !== view.bid) {
      audio.play('declare');
      const panel = document.querySelector('.bid-panel'); panel.classList.remove('presentation-bid-pulse'); void panel.offsetWidth; panel.classList.add('presentation-bid-pulse');
    }
    if (active && previous?.phase === 'play' && previous.game === view.game && previous.round === view.round && previous.turn !== view.turn && !connectionBlocked && screen === 'battleScreen' && $('restartConfirm').classList.contains('hide')) {
      const player = [...$('playerGrid').children].find(n => n.dataset.player === view.turn);
      gameplayFeedback.play('turn', player?.querySelector('.avatar'), view.bid + ':' + view.turn);
    }
    if (active) { const target = [...$('playerGrid').children].find(n => n.dataset.player === view.turn)?.querySelector('.player-card'); cardReveal.gold({key: roomEpoch + ':' + view.game + ':' + view.round + ':' + view.turn + ':' + view.bid, node: target?.classList.contains('hidden') ? null : target}); }
    if (startPresentation) { presenter.play(presentationKey, view.result, view.players); if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) presenter.skip(); }
    if (screen === 'battleScreen' && $('restartConfirm').classList.contains('hide')) {
      if (!active && previous?.phase === 'play') $('resultTitle').focus();
      else if (yourTurn && previous) $('status').focus({ preventScroll: true });
    }
  }
  function receive(next) {
    if (transport && view?.phase === 'reveal' && next.phase === 'reveal' && next.revision === view.revision && next.hostId === view.hostId && next.roundClock?.token === view.roundClock?.token && next.roundClock) { view = next; paintTurnDisplay(); return; }
    if (transport && view?.phase === 'play' && next.phase === 'play' && next.revision === view.revision && next.hostId === view.hostId && next.turnClock && next.turnClock.token === view.turnClock?.token) { view = next; paintTurnDisplay(); return; }
    const previous = view; view = next; clearError();
    if (connectionMessage === 'ホストからの情報を待っています…' || (previous?.phase === 'lobby' && view.phase === 'play' && ['参加者が退出したため、対戦を中止してロビーに戻りました。', '参加者との接続が切れました。', '扱える数字の上限に達したため、勝敗をつけずロビーに戻りました。'].includes(connectionMessage))) { connectionMessage = ''; paintConnectionStatus(); }
    if (view.phase === 'lobby') { cancelPresentation(); presentationKey = null; renderLobby(); } else renderBattle(previous);
    const checkpoint = view.scoreCheckpoint, me = view.players.find(p => p.id === human);
    if (checkpoint && checkpoint.userIds?.includes(me?.userId)) publishSessionFinish(captureSessionFinish(checkpoint.reason, checkpoint.game));
  }
  function apply(next) {
    if (next === state) return false;
    timer.cancel(); state = next;
    const nextView = G.publicView(state, human);
    nextView.turnClock = localTurnClock.sync(state, human);
    const roundClock=localRoundClock.sync(state);
    nextView.roundClock=roundClock?{...roundClock,localDeadline:roundClock.deadline,localReadyAt:roundClock.readyAt}:null;
    // sync can expire a preserved deadline on background restoration.
    if (state !== next) return true;
    receive(nextView);
    if (state.phase === 'play' && state.turn !== human) {
      const captured = state;
      timer.schedule(() => {
        if (transport || state !== captured || state.phase !== 'play') return;
        const action = G.chooseBotAction(G.botView(state, state.turn), Math.random);
        if (!action) return;
        const updated = action.type === 'challenge' ? G.challenge(state, state.turn, Math.random) : G.declare(state, state.turn, action.value);
        if (updated !== state) { apply(updated); }
      }, 650 + Math.random() * 450);
    }
    return true;
  }
  function action(type, value) {
    if (!view || connectionBlocked) return false;
    if (transport && ['nextRound', 'rematch', 'returnToLobby'].includes(type) && !canManageLobby()) return false;
    if (transport) { const sentView = view; if (type === 'declare') $('declare').disabled = true; Promise.resolve(transport.send({ type, player: human, value, revision: view.revision, turnToken: view.turnClock?.token })).then(accepted => { if (accepted === false && type === 'declare' && view === sentView && !connectionBlocked) { $('declare').disabled = view.turn !== human; fail('宣言できませんでした。現在の手番と数字を確認してください。'); } }).catch(() => { fail('接続を確認して、もう一度お試しください。'); if (type === 'declare' && view === sentView && !connectionBlocked) $('declare').disabled = view.turn !== human; }); return true; }
    if (localTurnClock.check() || localRoundClock.check()) return false;
    const next = G.dispatch(state, { type, player: human, value, revision: view.revision }, Math.random);
    return apply(next);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest?.('button');
    if (event.isTrusted && button && !button.disabled && !button.matches('[data-sound-toggle]') && !['declare', 'challenge', 'beginGame', 'next'].includes(button.id)) audio.play('tap');
  });
  $('copyRoomId').onclick = async () => {
    const id = typeof view?.roomId === 'string' ? view.roomId : '';
    if (!id) return;
    const epoch = roomEpoch;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(id);
      if (epoch !== roomEpoch || view?.roomId !== id || screen !== 'lobbyScreen') return;
      $('roomCopyStatus').textContent = 'ルームIDをコピーしました。';
    } catch {
      if (epoch !== roomEpoch || view?.roomId !== id || screen !== 'lobbyScreen') return;
      $('roomCopyFallback').value = id; $('roomCopyFallback').classList.remove('hide');
      $('roomCopyFallback').focus(); $('roomCopyFallback').select();
      $('roomCopyStatus').textContent = '自動コピーできませんでした。選択されたIDをコピーしてください。';
    }
    $('roomCopyStatus').classList.remove('hide');
  };
  let exiting = false;
  async function exitRoom() {
    if (exiting) return;
    exiting = true;
    try {
      if (transport && roomAdapterExpected) {
        if (typeof roomActions.exit !== 'function') throw new Error('Exit unavailable');
        await roomActions.exit();
      }
      const finished = captureSessionFinish();
      if (screen === 'battleScreen') closeConfirm();
      timer.cancel(); detachTransport(); state = null; view = null; show('homeScreen', 'startGame'); publishSessionFinish(finished);
    } catch {
      const status = $(screen === 'lobbyScreen' ? 'lobbyError' : 'onlineBattleStatus');
      status.textContent = '退出できませんでした。もう一度お試しください。'; status.classList.remove('hide');
    } finally { exiting = false; }
  }
  $('startGame').onclick = () => requestRoom('create'); $('lobbyBack').onclick = exitRoom;
  $('joinForm').onsubmit = event => { event.preventDefault(); const id = $('roomId').value.trim(); if (id) requestRoom('join', id); };
  $('refreshPublicRooms').onclick = async () => {
    const request = ++listRequest, list = $('publicRoomsList'), status = $('publicRoomsStatus');
    list.replaceChildren(); status.textContent = '取得中…';
    try {
      if (typeof roomActions.list !== 'function') throw new Error('unavailable');
      const rooms = await roomActions.list();
      if (request !== listRequest || screen !== 'joinPanel') return;
      if (!rooms.length) { status.textContent = '公開ルームはありません。'; return; }
      status.textContent = '';
      for (const room of rooms) {
        const button = document.createElement('button'); button.type = 'button';
        button.textContent = room.roomId + '  ' + room.gamerNum + '/' + room.maxPlayers;
        button.onclick = () => requestRoom('join', room.roomId);
        list.append(button);
      }
    } catch {
      if (request === listRequest && screen === 'joinPanel') status.textContent = '公開ルーム一覧を取得できませんでした。';
    }
  };
  $('privateRoom').onchange = () => { $('roomCreateStatus').textContent = ''; };
  $('joinGame').onclick = () => { cancelRoomRequest(); show('joinPanel', 'roomId'); void $('refreshPublicRooms').onclick(); }; $('closeJoin').onclick = () => { cancelRoomRequest(); show('homeScreen', 'joinGame'); };
  $('addBot').onclick = addBot;
  $('removeBot').onclick = () => { if (transport) { lobbyAction('removeBot', { target: selectedBot }); return; } state = G.removeBot(state, selectedBot); view = G.publicView(state, human); renderLobby(); };
  document.querySelectorAll('[data-avatar]').forEach(button => { button.onclick = () => { if (transport) { lobbyAction('setBotAvatar', { target: selectedBot, avatar: Number(button.dataset.avatar) }); return; } avatarChoice[selectedBot] = Number(button.dataset.avatar); renderLobby(); }; });
  document.querySelectorAll('[data-difficulty]').forEach(button => { button.onclick = () => { nextDifficulty = button.dataset.difficulty; if (transport) lobbyAction('setDifficulty', { target: selectedBot, difficulty: nextDifficulty }); if (!transport) { state = G.setDifficulty(state, selectedBot, nextDifficulty); view = G.publicView(state, human); renderLobby(); } }; });
  $('beginGame').onclick = () => { if (transport) { lobbyAction('startGame'); return; } show('battleScreen'); apply(G.startGame(state, Math.random)); window.scrollTo(0, 0); $('status').focus({ preventScroll: true }); };
  $('declare').onclick = event => {
    if ($('declare').disabled || event.detail > 1) return;
    const value = G.parseBid($('number').textContent);
    if (value === null || (view?.bid !== null && value <= view?.bid) || !action('declare', value)) { fail('前より大きな1以上の整数を入力してください（最大9007199254740991）。'); $('declare').focus(); }
  };
  $('challenge').onclick = () => action('challenge');
  $('returnRoomLobby').onclick = () => { if (view?.phase !== 'finished' || presenter.active || connectionBlocked || !canManageLobby()) return; if (action('returnToLobby') && !transport) show('lobbyScreen', 'beginGame'); };
  $('next').onclick = event => { if (connectionBlocked) return; if (presenter.active) { nextReadyAt = performance.now() + 400; audio.stop(); specialEffects.stop(); cardReveal.settleAll(); sceneMotion.skip(); presenter.skip(); return; } if (event.detail > 1 || performance.now() < nextReadyAt) return; action(view.phase === 'finished' ? 'rematch' : 'nextRound'); };
  document.querySelectorAll('[data-digit]').forEach(button => { button.onclick = () => {
    if ($('declare').disabled) return;
    const prior = suggested ? '' : $('number').textContent, next = prior === '0' ? button.dataset.digit : prior + button.dataset.digit;
    if (next.length > 16 || G.parseBid(next) === null) { fail('入力できる最大の整数は9007199254740991です。'); return; }
    $('number').textContent = next; suggested = false; clearError();
  }; });
  $('backspace').onclick = () => { if (!$('declare').disabled) { $('number').textContent = $('number').textContent.slice(0, -1); suggested = false; clearError(); } };
  function confirmExit() { gameplayFeedback.stop(); specialEffects.stop(); cardReveal.settleAll(); sceneMotion.leave(); $('restartTitle').textContent = '対戦を終了してホームへ？'; $('restartText').textContent = '現在の対戦は終了します。続ける場合はキャンセルしてください。'; $('confirmRestart').textContent = '終了して戻る'; $('restartConfirm').classList.remove('hide'); $('homeBtn').setAttribute('aria-expanded', 'true'); $('cancelRestart').focus(); specialSVG.refresh(); }
  function closeConfirm() { $('restartConfirm').classList.add('hide'); $('homeBtn').setAttribute('aria-expanded', 'false'); $('homeBtn').focus(); syncCardMotion(); }
  $('homeBtn').onclick = confirmExit; $('cancelRestart').onclick = closeConfirm;
  $('confirmRestart').onclick = exitRoom;
  function overlay(id, trigger) { if (screen === 'homeScreen' || screen === 'joinPanel') cancelRoomRequest(); overlayReturn = { screen, trigger }; show(id); }
  function closeOverlay() { const back = overlayReturn || { screen: 'homeScreen', trigger: $('startGame') }; show(back.screen); back.trigger?.focus(); overlayReturn = null; }
  $('homeRules').onclick = () => { overlay('guidePanel', $('homeRules')); guide('rules'); };
  $('rulesBtn').onclick = () => { overlay('guidePanel', $('rulesBtn')); guide('rules'); };
  $('closeGuide').onclick = closeOverlay;
  document.querySelectorAll('.guide-tabs button[data-tab]').forEach(button => { button.onclick = () => guide(button.dataset.tab); });
  function guide(tab) {
    const container = $('guideContent'); container.replaceChildren(); container.dataset.tab = tab; $('guideTitle').textContent = ({rules:'遊び方',cards:'カード図鑑',bots:'BOTについて',examples:'計算例'})[tab];
    document.querySelectorAll('.guide-tabs button[data-tab]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.tab === tab)));
    if (tab === 'rules') {

      const steps = [['カードを配る','自分のカードだけ見えません。他の人のカードを見て、全員の合計を予想しよう。'],['数字を宣言','最初は1以上の整数。次の人は、前の宣言より大きな数を宣言します。'],['グラビティ！','直前の宣言が合計を超えていると思ったら、グラビティ！で挑戦。'],['勝敗判定','全カードを公開し、特殊効果を含めて合計。宣言が合計より大きければ宣言者の負け。合計以下なら、疑った側の負け。'],['最後まで生き残ろう','負けるとライフが1減り、0で脱落。最後の1人が優勝！次のラウンドは負けた人から（脱落した場合は、その判定で勝った人から）。']];
      steps.forEach(([title, text], index) => {
        const section = el('section', 'guide-step');
        section.append(el('b', 'step-number', index + 1), el('h3', '', title), el('p', '', text));
        section.append(window.NumberBluffGuideDiagrams.create(document, index)); if (index === 1) section.append(el('p', 'turn-rule-note', '1手30秒。時間切れは前の宣言＋1（初手は1）を自動宣言します。入力途中の数字は送信しません。計算演出の後、10秒で次のラウンドに進みます。優勝結果では自動再戦しません。')); container.append(section);
      });

    } else if (tab === 'cards') {
      container.append(el('h3', 'catalogue-label', '数字カード 32枚 · 全36枚'));
      const grouped = new Map(); for (const c of G.FULL_DECK) { const key = c.kind + ':' + c.value; if (!grouped.has(key)) grouped.set(key, { card: c, count: 0 }); grouped.get(key).count++; }
      const catalogue = el('div', 'catalogue');
      [...grouped.values()].filter(x => x.card.kind === 'number').sort((a, b) => a.card.value - b.card.value).forEach(({ card, count }) => { const item = el('button', 'catalogue-item'); item.type = 'button'; item.setAttribute('aria-label', card.label + ' の効果・' + count + '枚'); item.onclick = () => cardDetail(card, count); item.append(cardNode(card), el('small', '', '×' + count)); catalogue.append(item); });
      container.append(catalogue, el('h3', '', '特殊カード 4枚（各1枚）'));
      const specials = el('div', 'catalogue special-catalogue');
      [...grouped.values()].filter(x => x.card.kind !== 'number').forEach(({ card, count }) => { const item = el('button', 'catalogue-item'); item.type = 'button'; item.setAttribute('aria-label', cardLabel(card) + ' の効果'); item.onclick = () => cardDetail(card, count); item.append(cardNode(card), el('small', '', '×1')); specials.append(item); }); container.append(specials);
    } else if (tab === 'bots') {

      const descriptions = ['判断にゆらぎが多め。','見えているカードと公開済みの情報からバランスよく判断。','公開情報から合計の可能性を比較し、慎重に挑戦します。'];
      ['easy','normal','hard'].forEach((d, i) => { const row = el('div', 'guide-bot'), copy = el('div'); copy.append(el('h3', '', difficultyNames[d]), el('p', '', descriptions[i])); row.append(image(avatars[i]), copy); container.append(row); });
      container.append(el('p', '', 'BOTも自分のカードや山札の中身は見ていません。難易度を変えても、見える情報は同じです。'));
    } else {

      const samples = [
        ['通常の合計','3、5、−5 の場合','3 + 5 − 5 = 3',[3,5,-5],3],
        ['MAX→0','10、5、3 なら、10を1枚だけ0に','0 + 5 + 3 = 8',[10,5,3,'max0'],8],
        ['「?」の追加公開','追加で10が出た場合','5 + 4 + 10 = 19',[5,4,'extra'],19,10],
      ];
      for (const [title, text, expression, values, total, extra] of samples) {
        const row = el('section', 'example'), visual = el('div', 'example-visual'), cards = el('div', 'example-cards');
        const find = value => G.FULL_DECK.find(card => typeof value === 'number' ? card.kind === 'number' && card.value === value : card.kind === value);
        for (const value of values) cards.append(cardNode(find(value)));
        if (extra !== undefined) { const additional = el('div', 'example-extra'); additional.append(el('small', '', '追加'), cardNode(find(extra))); cards.append(additional); }
        const result = el('div', 'example-total'); result.append(el('span', '', '最終合計'), el('strong', '', total));
        visual.append(cards, result); row.append(el('h3', '', title), visual, el('div', 'example-expression', expression)); container.append(row);
      }
    }
    container.focus({ preventScroll: true });
  }
  function stopDetailEffect() { detailEffectEpoch++; specialEffects.stop(); specialSVG.refresh(); }
  function cardDetail(card, count) {
    const detailEpoch = ++detailEffectEpoch;
    const descriptions = { double: '数字の合計を2倍にします。マイナスの合計にも適用。例：(3 + 5 − 5) × 2 = 6。', max0: '場の最大の正の数字カードを1枚だけ0にします。同じ最大値が複数あっても1枚だけ。', extra: '判定時に山札から1枚だけ追加公開。数字も特殊効果も合計に反映。連鎖して追加はしません。', reset: '数字としては0。このラウンドの判定後に全36枚を混ぜ直します。合計自体を0にはしません。' };
    const body = $('cardDetailContent'); body.replaceChildren(cardNode(card), el('h2', '', cardLabel(card) + '（' + count + '枚）'), el('p', '', descriptions[card.kind] || (card.value < 0 ? '合計から ' + Math.abs(card.value) + ' を引きます。' : '合計に ' + card.value + ' を足します。'))); specialEffects.stop(); $('cardDetail').showModal(); $('closeCardDetail').focus(); syncCardMotion(); const detailFace=body.querySelector('.player-card'); detailFace.querySelector('img.card-art').decode().then(()=>{if(detailEpoch===detailEffectEpoch&&$('cardDetail').open&&detailFace.isConnected&&!detailFace.classList.contains('normal-card'))specialEffects.play(detailFace,{priority:true});}).catch(()=>{});
  }
  $('closeCardDetail').onclick = () => { stopDetailEffect(); $('cardDetail').close(); specialSVG.refresh(); };
  $('cardDetail').addEventListener('cancel', stopDetailEffect);
  $('cardDetail').addEventListener('beforetoggle', event => { if(event.newState==='closed')stopDetailEffect(); });
  document.addEventListener('keydown', event => { if (event.key !== 'Escape') return; if ($('cardDetail').open) return; if (!$('restartConfirm').classList.contains('hide')) closeConfirm(); else if (screen === 'guidePanel') closeOverlay(); else if (screen === 'joinPanel') { cancelRoomRequest(); show('homeScreen', 'joinGame'); } });
  $('cardDetail').addEventListener('close', () => { stopDetailEffect(); syncCardMotion(); });
  window.addEventListener('pageshow', () => { syncCardMotion(); });
  window.addEventListener('pagehide', () => { stopTurnDisplay(); localTurnClock.pause(); localRoundClock.pause(); stopDetailEffect(); timer.cancel(); cancelPresentation(true); stopTurnDisplay(); });
  window.addEventListener('pageshow', event => { if (event.persisted && state && !transport) { const old = state; state = null; apply(old); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !transport) { localTurnClock.resume(); localRoundClock.resume(); } paintTurnDisplay(); if (!document.hidden && transport && !connectionBlocked) Promise.resolve(transport.resync?.()).catch(() => {}); });
  window.addEventListener('pageshow', () => { if (!transport) { localTurnClock.resume(); localRoundClock.resume(); } paintTurnDisplay(); if (transport && !connectionBlocked) Promise.resolve(transport.resync?.()).catch(() => {}); });
  // The SDK bridge provides the normalized stream; the UI never runs remote authority.
  function paintConnectionStatus() {
    for (const id of ['onlineLobbyStatus', 'onlineBattleStatus']) { $(id).textContent = connectionMessage; $(id).classList.toggle('hide', !connectionMessage); }
  }
  window.NumberBluffClient = Object.freeze({
    onSessionFinish(listener) {
      if (typeof listener !== 'function') throw new TypeError('Session finish listener must be a function.');
      sessionFinishListeners.add(listener); return () => sessionFinishListeners.delete(listener);
    },
    reportConnectionStatus(event) {
      if (event?.kind === 'send-recovered') { if (connectionMessage === '送信できませんでした。接続を確認してください。') { connectionMessage = ''; paintConnectionStatus(); } return; }
      const messages = { 'turn-number-limit': '扱える数字の上限に達したため、勝敗をつけずロビーに戻りました。', 'host-lost': 'ホストが退出しました。ホームに戻って参加し直してください。', 'host-timeout': 'ホストとの接続が切れました。ホームに戻って参加し直してください。', 'send-error': '送信できませんでした。接続を確認してください。', 'participant-timeout': '参加者との接続が切れました。', 'player-left-match-abandoned': '参加者が退出したため、対戦を中止してロビーに戻りました。', 'host-session-changed': 'ホストの接続が変わりました。ホームに戻って参加し直してください。', 'session-ended': '接続を終了しました。ホームに戻って参加し直してください。', 'join-waiting': 'ホストからの情報を待っています…', 'room-full': 'このルームは満員です。', 'profile-error': 'GRAVITYのプロフィールを取得できません。再読み込みしてください。' };
      if (!event || !messages[event.kind]) return;
      connectionMessage = messages[event.kind];
      if (['host-lost', 'host-timeout', 'host-session-changed', 'session-ended'].includes(event.kind)) connectionBlocked = true;
      paintConnectionStatus();
      if (screen === 'homeScreen' || screen === 'joinPanel' || !transport) { $('roomCreateStatus').textContent = connectionMessage; $('roomJoinStatus').textContent = connectionMessage; }
      if (view) { if (view.phase === 'lobby') renderLobby(); else renderBattle(); }
    },
    setViewportInsets(insets) {
      if (!insets || !['top', 'bottom'].every(key => typeof (insets[key] ?? 0) === 'number' && Number.isFinite(insets[key] ?? 0) && (insets[key] ?? 0) >= 0)) throw new TypeError('Insets require finite, nonnegative top/bottom pixel values.');
      for (const key of ['top', 'bottom']) document.documentElement.style.setProperty('--nb-host-' + key, (insets[key] ?? 0) + 'px');
      updateViewport();
    },
    onScreenChange(listener) {
      if (typeof listener !== 'function') throw new TypeError('Screen listener must be a function.');
      screenListeners.add(listener); listener(screenNames[screen]); return () => screenListeners.delete(listener);
    },
    setRoomRequestCanceler(cancel) { if (cancel !== null && typeof cancel !== 'function') throw new TypeError('Canceler must be a function.'); cancelRoomOperation = cancel; },
    setRoomAdapterExpected(required = true) { roomAdapterExpected = !!required; },
    configureRoomActions(actions) {
      if (!actions || typeof actions.create !== 'function' || typeof actions.join !== 'function') throw new TypeError('Room actions require create() and join(roomId).');
      roomAdapterExpected = true; roomActions = { create: actions.create, join: actions.join, list: actions.list, exit: actions.exit };
    },
    configureLocalProfile(profile) {
      if (!profile || typeof profile.name !== 'string' || !profile.name.trim()) throw new TypeError('Normalized profile requires name.');
      if (transport || (state && state.phase !== 'lobby')) throw new Error('Configure profile before starting a game.');
      localProfile = { name: profile.name.trim().slice(0, 24), avatarUrl: safeAvatar(profile.avatarUrl) };
      if (state) { state = { ...state, players: state.players.map(p => p.id === human ? { ...p, ...localProfile } : p) }; view = G.publicView(state, human); renderLobby(); }
    },
    connect(adapter, access = {}) {
      if (!adapter || typeof adapter.subscribe !== 'function' || typeof adapter.send !== 'function') throw new TypeError('Adapter requires subscribe(onPublicView) and send(action).');
      timer.cancel(); detachTransport(); transport = adapter; state = null; view = null;
      let first = true;
      unsubscribe = adapter.subscribe(publicState => {
        if (transport !== adapter) return;
        if (!publicState || typeof publicState.viewerId !== 'string' || !Array.isArray(publicState.players) || !publicState.players.some(player => player.id === publicState.viewerId && player.kind === 'human')) {
          throw new TypeError('Adapter public view must identify its authenticated human viewer.');
        }
        human = publicState.viewerId;
        $('roomCreateStatus').textContent = ''; $('roomJoinStatus').textContent = '';
        receive(publicState);
        if (first || screen === 'lobbyScreen' || (publicState.phase === 'lobby' && screen === 'battleScreen')) { show(publicState.phase === 'lobby' ? 'lobbyScreen' : 'battleScreen'); first = false; }
      });
      const connection = adapter.getStatus?.(); if (connection?.kind) window.NumberBluffClient.reportConnectionStatus(connection);
    },
    disconnect() { timer.cancel(); detachTransport(); state = null; view = null; show('homeScreen', 'startGame'); }
  });
})();
