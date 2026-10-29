/* GRAVITY platform shell, based on user-provided AI Studio specifications.
 * Real-device SDK behavior and the user_list host ordering remain unverified. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else {
    root.NumberBluffPlatform = factory();
    if (root.AgentSDK) void root.NumberBluffPlatform.start({ window: root }).catch(() => {});
  }
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const installations = new WeakMap();
  function exclusionHeight(height) { return Number.isFinite(height) && height >= 812 ? 98 : 74; }
  async function start(options = {}) {
    const win = options.window || globalThis.window, client = options.client || win?.NumberBluffClient;
    const sdk = options.sdk || win?.AgentSDK, adapter = options.adapter || win?.NumberBluffGravity;
    if (!win || !client) throw new TypeError('Window and NumberBluffClient are required.');
    if (!sdk) return null; // An ordinary browser keeps its existing layout and offline mode.
    if (installations.has(win)) return installations.get(win);
    client.setRoomAdapterExpected(true);
    const promise = setup(); installations.set(win, promise);
    try { return await promise; } catch (error) { installations.delete(win); client.reportConnectionStatus({ kind: 'profile-error' }); throw error; }
    async function setup() {
      if (!adapter?.install) throw new TypeError('GRAVITY adapter is required.');
      let bridge = null, closed = false, top = exclusionHeight(win.innerHeight), lastWidth = win.innerWidth;
      const sent = new Set();
      const update = () => {
        // Keep the native-header band stable while a software keyboard shrinks the viewport.
        const active = win.document?.activeElement;
        const widthChanged = win.innerWidth !== lastWidth; lastWidth = win.innerWidth;
        if (widthChanged || !active || !/^(INPUT|TEXTAREA)$/.test(active.tagName)) top = exclusionHeight(win.innerHeight);
        client.setViewportInsets({ top, bottom: 0 });
      };
      update();
      bridge = await adapter.install({ sdk, client, onStatus: event => client.reportConnectionStatus(event) });
      client.setRoomRequestCanceler?.(() => bridge.close());
      const unsubscribe = client.onSessionFinish(result => {
        // User-selected checkpoints: explicit exit, host rematch or return to lobby.
        // Native UI interruption/acknowledgment behavior is not documented; verify on device.
        if (closed || !result || !['explicit-exit','rematch-checkpoint','lobby-checkpoint'].includes(result.reason) ||
            typeof result.roomId !== 'string' || !result.roomId ||
            !Number.isSafeInteger(result.sessionId) || result.sessionId < 0 ||
            typeof result.viewerId !== 'string' || result.player?.id !== result.viewerId ||
            result.player?.kind !== 'human' || !Number.isSafeInteger(result.player.bestStreak) || result.player.bestStreak < 0) return;
        if (result.reason !== 'explicit-exit' && (!Number.isSafeInteger(result.game) || result.game < 1)) return;
        const key = JSON.stringify([result.roomId, result.sessionId, result.reason, result.game || 0]);
        if (sent.has(key)) return;
        sent.add(key);
        // Send the locally tracked best; native acceptance/high-score retention is unverified.
        // Send only their authoritative
        // best streak from this play session, even if their current streak is now 0.
        win.parent.postMessage({ type: 'gameOver', score: result.player.bestStreak }, '*');
      });
      const resume = () => { if (!closed && !win.document?.hidden) Promise.resolve(bridge.resync()).catch(() => {}); };
      win.addEventListener('resize', update); win.document?.addEventListener('focusout', update);
      win.document?.addEventListener('visibilitychange', resume);
      const pagehide = () => { bridge.close(); client.reportConnectionStatus({ kind: 'session-ended' }); };
      win.addEventListener('pagehide', pagehide);
      return Object.freeze({
        resync: resume,
        close() {
          if (closed) return; closed = true; unsubscribe(); bridge.close(); client.setRoomRequestCanceler?.(null);
          win.removeEventListener('resize', update); win.removeEventListener('pagehide', pagehide);
          win.document?.removeEventListener('focusout', update); win.document?.removeEventListener('visibilitychange', resume);
          installations.delete(win);
        }
      });
    }
  }
  return Object.freeze({ start, exclusionHeight });
});
