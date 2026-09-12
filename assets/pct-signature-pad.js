/* Reusable PCT signature input. It intentionally uses only native browser APIs
   and returns evidence for a secure backend submission; it never writes to
   Firestore or Storage directly. */
(function () {
  'use strict';

  const instances = new WeakMap();
  const MAX_DRAWN_DATA_URL_LENGTH = 360000;

  function text(value) { return String(value || '').trim(); }
  function dispatch(host) {
    host.dispatchEvent(new CustomEvent('pct-signature-change', {
      bubbles: true,
      detail: api.getValue(host)
    }));
  }
  function resize(state) {
    const rect = state.canvas.getBoundingClientRect();
    const width = Math.max(280, Math.round(rect.width || state.host.clientWidth || 280));
    const height = 160;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const previous = state.hasInk ? state.canvas.toDataURL('image/png') : '';
    state.canvas.width = Math.round(width * ratio);
    state.canvas.height = Math.round(height * ratio);
    state.canvas.style.height = `${height}px`;
    state.context = state.canvas.getContext('2d');
    state.context.scale(ratio, ratio);
    state.context.lineCap = 'round';
    state.context.lineJoin = 'round';
    state.context.lineWidth = 2.2;
    state.context.strokeStyle = '#1c150d';
    state.context.fillStyle = '#ffffff';
    state.context.fillRect(0, 0, width, height);
    if (previous) {
      const image = new Image();
      image.onload = () => state.context.drawImage(image, 0, 0, width, height);
      image.src = previous;
    }
  }
  function point(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {x: event.clientX - rect.left, y: event.clientY - rect.top};
  }
  function clear(state) {
    state.hasInk = false;
    state.drawing = false;
    resize(state);
    dispatch(state.host);
  }
  function mounted(host) {
    return instances.get(host);
  }
  function mount(host) {
    if (!host || mounted(host)) return mounted(host);
    host.classList.add('pct-signature-pad');
    host.innerHTML = '<div class="pct-signature-pad__instructions small" id="' + host.id + '-instructions">Draw your signature below, or use the typed-name fallback. A typed name is recorded as a typed signature, not as a drawing.</div><canvas class="pct-signature-pad__canvas" tabindex="0" role="img" aria-label="Signature drawing area" aria-describedby="' + host.id + '-instructions" style="display:block;width:100%;margin-top:8px;border:1px solid #b9aa95;border-radius:10px;background:#fff;touch-action:none"></canvas><div class="pct-signature-pad__actions" style="margin-top:8px"><button type="button" class="btn btn-ghost grow0 pct-signature-pad__clear">Clear Signature</button></div><div class="field pct-signature-pad__typed" style="margin-top:12px"><label>Typed-name signature fallback<input type="text" class="pct-signature-pad__typed-input" autocomplete="name" placeholder="Type your full legal name"></label><div class="small">Use this only if you cannot draw your signature.</div></div>';
    const canvas = host.querySelector('canvas');
    const state = {host, canvas, context: null, hasInk: false, drawing: false, pointerId: null, typedInput: host.querySelector('.pct-signature-pad__typed-input')};
    instances.set(host, state);
    resize(state);
    canvas.addEventListener('pointerdown', event => {
      event.preventDefault();
      state.drawing = true;
      state.pointerId = event.pointerId;
      canvas.setPointerCapture?.(event.pointerId);
      const p = point(event, canvas);
      state.context.beginPath();
      state.context.moveTo(p.x, p.y);
      state.context.lineTo(p.x + 0.01, p.y + 0.01);
      state.context.stroke();
      state.hasInk = true;
      dispatch(host);
    });
    canvas.addEventListener('pointermove', event => {
      if (!state.drawing || event.pointerId !== state.pointerId) return;
      event.preventDefault();
      const p = point(event, canvas);
      state.context.lineTo(p.x, p.y);
      state.context.stroke();
      state.hasInk = true;
    });
    const finish = event => {
      if (!state.drawing || (event && event.pointerId !== state.pointerId)) return;
      state.drawing = false;
      state.pointerId = null;
      dispatch(host);
    };
    canvas.addEventListener('pointerup', finish);
    canvas.addEventListener('pointercancel', finish);
    canvas.addEventListener('keydown', event => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && state.hasInk) {
        event.preventDefault();
        clear(state);
      }
    });
    host.querySelector('.pct-signature-pad__clear').addEventListener('click', () => clear(state));
    state.typedInput.addEventListener('input', () => dispatch(host));
    return state;
  }
  const api = Object.freeze({
    mount,
    mountAll(root) {
      (root || document).querySelectorAll?.('[data-pct-signature-pad]').forEach(mount);
    },
    clear(target) {
      const host = typeof target === 'string' ? document.getElementById(target) : target;
      const state = mounted(host) || mount(host);
      if (state) clear(state);
    },
    getValue(target) {
      const host = typeof target === 'string' ? document.getElementById(target) : target;
      const state = mounted(host) || mount(host);
      if (!state) return {method: ''};
      if (state.hasInk) {
        const dataUrl = state.canvas.toDataURL('image/png');
        return dataUrl.length <= MAX_DRAWN_DATA_URL_LENGTH ? {method: 'DRAWN', dataUrl, signedAtClient: new Date().toISOString()} : {method: ''};
      }
      const typedName = text(state.typedInput.value);
      return typedName ? {method: 'TYPED_NAME', typedName, signedAtClient: new Date().toISOString()} : {method: ''};
    }
  });
  window.PCTSignaturePad = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => api.mountAll());
  else api.mountAll();
}());
