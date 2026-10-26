(() => {
  'use strict';
  const game = window.NumberBluff;
  const timer = window.NumberBluffScheduler();
  const $ = id => document.getElementById(id);
  let state;
  function render() {
    const cards = state.result ? state.result.cards : state.hands;
    if ($('roundLabel')) $('roundLabel').textContent = 'ROUND ' + String(state.round).padStart(2, '0');
    $('botCard').textContent = cards[1];
    $('humanCard').textContent = state.phase === 'play' ? '?' : cards[0];
    $('humanCard').classList.toggle('hidden', state.phase === 'play');
    $('humanLife').textContent = '♥'.repeat(state.life[0]) + '♡'.repeat(3 - state.life[0]);
    $('botLife').textContent = '♥'.repeat(state.life[1]) + '♡'.repeat(3 - state.life[1]);
    $('humanLife').setAttribute('aria-label', 'あなたのライフ ' + state.life[0] + ' / 3');
    $('botLife').setAttribute('aria-label', 'BOTのライフ ' + state.life[1] + ' / 3');
    $('bid').textContent = state.bid ?? '—';
    $('status').textContent = state.phase !== 'play' ? '判定中' : state.turn === 0 ? 'あなたの番です' : 'BOTが考えています…';
    $('declare').disabled = state.phase !== 'play' || state.turn !== 0;
    $('number').disabled = $('declare').disabled;
    $('challenge').disabled = state.phase !== 'play' || state.turn !== 0 || state.bid === null;
    $('next').disabled = state.phase !== 'reveal';
    $('result').classList.toggle('open', state.phase === 'reveal');
    $('gamePanel').classList.toggle('hide', state.phase === 'reveal');
    if (state.phase === 'play' && state.turn === 0) $('number').value = state.bid === null ? '0' : String(state.bid + 1);
    if (state.result) {
      const { sum, loser, winner } = state.result;
      $('resultTitle').textContent = loser === 0 ? 'あなたの負け' : 'BOTの負け';
      $('resultCards').replaceChildren();
      for (const [i, value] of cards.entries()) {
        const card = document.createElement('div');
        card.className = 'smallcard';
        card.textContent = (i === 0 ? 'あなた ' : 'BOT ') + value;
        $('resultCards').append(card);
      }
      $('resultText').textContent = '合計 ' + sum + ' / 宣言 ' + state.bid + '。' +
        (winner !== null ? (winner === 1 ? 'BOTの優勝！' : 'あなたの優勝！') : 'ライフが1減りました。');
      $('next').textContent = winner !== null ? '再戦する' : '次のラウンドへ';
    } else {
      $('resultCards').replaceChildren();
      $('resultTitle').textContent = '';
      $('resultText').textContent = '';
    }
  }
  function apply(next) {
    if (next === state) return false;
    timer.cancel();
    const previous = state;
    state = next;
    if ($('inputError')) $('inputError').textContent = '';
    $('number').removeAttribute('aria-invalid');
    render();
    const panelOpen = !$('rules').classList.contains('hide') ||
      ($('restartConfirm') && !$('restartConfirm').classList.contains('hide'));
    if (!panelOpen && state.phase === 'reveal' && previous?.phase === 'play') $('resultTitle').focus();
    else if (!panelOpen && previous && state.phase === 'play' && state.turn === 0) $('number').focus();
    if (state.phase === 'play' && state.turn === 1) {
      const scheduledState = state;
      timer.schedule(() => {
        if (state !== scheduledState || state.phase !== 'play' || state.turn !== 1) return;
        const action = game.chooseBotAction(game.botView(state));
        apply(action.type === 'challenge' ? game.challenge(state, 1) : game.declare(state, 1, action.value));
      }, 550 + Math.random() * 550);
    }
    return true;
  }
  $('declare').onclick = () => {
    const value = game.parseBid($('number').value);
    if (value === null || !apply(game.declare(state, 0, value))) {
      const message = '直前の宣言より大きい0以上の整数（8桁以内）を入力してください。';
      if ($('inputError')) $('inputError').textContent = message;
      else alert(message);
      $('number').setAttribute('aria-invalid', 'true');
      $('number').focus();
    }
  };
  $('challenge').onclick = () => apply(game.challenge(state, 0));
  $('next').onclick = () => apply(game.nextRound(state));
  function closeRestart() {
    if ($('restartConfirm')) { $('restartConfirm').hidden = true; $('restartConfirm').classList.add('hide'); }
    $('restartBtn').setAttribute('aria-expanded', 'false');
    $('restartBtn').focus();
  }
  $('restartBtn').onclick = () => {
    if ($('restartConfirm')) {
      $('restartConfirm').hidden = false;
      $('restartConfirm').classList.remove('hide');
      $('restartBtn').setAttribute('aria-expanded', 'true');
      $('cancelRestart').focus();
    } else if (confirm('現在の対戦を終了して再戦しますか？')) apply(game.newMatch());
  };
  if ($('confirmRestart')) $('confirmRestart').onclick = () => { closeRestart(); apply(game.newMatch()); };
  if ($('cancelRestart')) $('cancelRestart').onclick = closeRestart;
  $('rulesBtn').onclick = () => {
    $('rules').classList.remove('hide');
    $('rulesBtn').setAttribute('aria-expanded', 'true');
    ($('rulesTitle') || $('closeRules')).focus();
  };
  function closeRules() {
    $('rules').classList.add('hide');
    $('rulesBtn').setAttribute('aria-expanded', 'false');
    $('rulesBtn').focus();
  }
  $('closeRules').onclick = closeRules;
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if ($('restartConfirm') && !$('restartConfirm').hidden && !$('restartConfirm').classList.contains('hide')) closeRestart();
    else if (!$('rules').classList.contains('hide')) closeRules();
  });
  $('number').addEventListener('keydown', event => {
    if (event.key === 'Enter' && !$('declare').disabled) { event.preventDefault(); $('declare').click(); }
  });
  window.addEventListener('pagehide', () => timer.cancel());
  // A page restored from back/forward cache needs a fresh BOT callback.
  window.addEventListener('pageshow', event => { if (event.persisted) apply({ ...state }); });
  apply(game.newMatch());
})();
