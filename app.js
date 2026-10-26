(() => {
  'use strict';
  const game = window.NumberBluff;
  const timer = window.NumberBluffScheduler();
  const $ = id => document.getElementById(id);
  let state;
  let playing = false;
  let replaceSuggested = true;
  let guideTrigger = null;
  let confirmationIntent = 'restart';
  const keypadButtons = [...$('keypad').querySelectorAll('button')];
  function clearInputError() {
    $('inputError').textContent = '';
    $('number').removeAttribute('aria-invalid');
  }
  function closeGuides(restoreFocus = true) {
    $('rules').classList.add('hide');
    $('cardGuide').classList.add('hide');
    for (const id of ['homeRules', 'homeCards', 'rulesBtn']) $(id).setAttribute('aria-expanded', 'false');
    if (restoreFocus && guideTrigger) guideTrigger.focus();
    guideTrigger = null;
  }
  function openGuide(id, trigger, title) {
    closeGuides(false);
    guideTrigger = trigger;
    $(id).classList.remove('hide');
    trigger.setAttribute('aria-expanded', 'true');
    $(title).focus();
  }
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
    keypadButtons.forEach(button => { button.disabled = $('declare').disabled; });
    $('challenge').disabled = state.phase !== 'play' || state.turn !== 0 || state.bid === null;
    $('next').disabled = state.phase !== 'reveal';
    $('result').classList.toggle('open', state.phase === 'reveal');
    $('gamePanel').classList.toggle('hide', state.phase === 'reveal');
    if (state.phase === 'play' && state.turn === 0) {
      $('number').value = state.bid === null ? '0' : String(state.bid + 1);
      replaceSuggested = true;
    }
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
    if (!playing || next === state) return false;
    timer.cancel();
    const previous = state;
    state = next;
    if ($('inputError')) $('inputError').textContent = '';
    $('number').removeAttribute('aria-invalid');
    render();
    const panelOpen = !$('rules').classList.contains('hide') || !$('cardGuide').classList.contains('hide') ||
      ($('restartConfirm') && !$('restartConfirm').classList.contains('hide'));
    if (!panelOpen && state.phase === 'reveal' && previous?.phase === 'play') $('resultTitle').focus();
    else if (!panelOpen && previous && state.phase === 'play' && state.turn === 0) $('number').focus();
    if (state.phase === 'play' && state.turn === 1) {
      const scheduledState = state;
      timer.schedule(() => {
        if (!playing || state !== scheduledState || state.phase !== 'play' || state.turn !== 1) return;
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
  function closeRestart(restoreFocus = true) {
    $('restartConfirm').hidden = true;
    $('restartConfirm').classList.add('hide');
    $('restartBtn').setAttribute('aria-expanded', 'false');
    $('homeBtn').setAttribute('aria-expanded', 'false');
    if (restoreFocus) $(confirmationIntent === 'home' ? 'homeBtn' : 'restartBtn').focus();
  }
  function openConfirmation(intent) {
    confirmationIntent = intent;
    $('homeBtn').setAttribute('aria-expanded', 'false');
    $('restartBtn').setAttribute('aria-expanded', 'false');
    const home = intent === 'home';
    $('restartTitle').textContent = home ? 'ホームへ戻りますか？' : '対戦をやり直しますか？';
    $('restartText').textContent = home ? '現在の対戦を終了します。次に遊ぶときは、新しい対戦になります。' : '現在のライフとラウンドをリセットします。';
    $('confirmRestart').textContent = home ? '終了して戻る' : 'やり直す';
    $('restartConfirm').hidden = false;
    $('restartConfirm').classList.remove('hide');
    $(home ? 'homeBtn' : 'restartBtn').setAttribute('aria-expanded', 'true');
    $('cancelRestart').focus();
  }
  $('restartBtn').onclick = () => openConfirmation('restart');
  $('confirmRestart').onclick = () => {
    const home = confirmationIntent === 'home';
    closeRestart(!home);
    if (home) showHome();
    else apply(game.newMatch());
  };
  $('cancelRestart').onclick = () => closeRestart();
  $('rulesBtn').onclick = () => openGuide('rules', $('rulesBtn'), 'rulesTitle');
  $('homeRules').onclick = () => openGuide('rules', $('homeRules'), 'rulesTitle');
  $('homeCards').onclick = () => openGuide('cardGuide', $('homeCards'), 'cardGuideTitle');
  $('closeRules').onclick = () => closeGuides();
  $('closeCardGuide').onclick = () => closeGuides();
  $('startGame').onclick = () => {
    timer.cancel();
    closeGuides(false);
    $('restartConfirm').classList.add('hide');
    $('restartConfirm').hidden = true;
    $('restartBtn').setAttribute('aria-expanded', 'false');
    $('homeScreen').classList.add('hide');
    $('battleScreen').classList.remove('hide');
    playing = true;
    state = undefined;
    apply(game.newMatch());
    window.scrollTo(0, 0);
    $('status').focus({ preventScroll: true });
  };
  function showHome() {
    timer.cancel();
    playing = false;
    closeGuides(false);
    $('restartConfirm').classList.add('hide');
    $('restartConfirm').hidden = true;
    $('restartBtn').setAttribute('aria-expanded', 'false');
    $('battleScreen').classList.add('hide');
    $('homeScreen').classList.remove('hide');
    window.scrollTo(0, 0);
    $('startGame').focus({ preventScroll: true });
  }
  $('homeBtn').onclick = () => openConfirmation('home');
  for (const button of $('keypad').querySelectorAll('[data-digit]')) {
    button.onclick = () => {
      if (!playing || $('number').disabled) return;
      const digit = button.dataset.digit;
      const prior = replaceSuggested ? '' : $('number').value;
      if (prior.length >= 8) {
        $('inputError').textContent = '宣言は8桁以内で入力してください。';
        return;
      }
      $('number').value = prior === '0' ? digit : prior + digit;
      replaceSuggested = false;
      clearInputError();
    };
  }
  $('backspace').onclick = () => {
    if (!playing || $('number').disabled) return;
    $('number').value = $('number').value.slice(0, -1);
    replaceSuggested = false;
    clearInputError();
  };
  $('number').addEventListener('input', () => { replaceSuggested = false; clearInputError(); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!$('restartConfirm').hidden && !$('restartConfirm').classList.contains('hide')) closeRestart();
    else if (!$('rules').classList.contains('hide') || !$('cardGuide').classList.contains('hide')) closeGuides();
  });
  $('number').addEventListener('keydown', event => {
    if (event.key === 'Enter' && !$('declare').disabled) { event.preventDefault(); $('declare').click(); }
  });
  window.addEventListener('pagehide', () => timer.cancel());
  // A page restored from back/forward cache needs a fresh BOT callback.
  window.addEventListener('pageshow', event => { if (event.persisted && playing && state) apply({ ...state }); });
})();

