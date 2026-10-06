import { createApp, shallowReactive } from 'vue';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { readPageSelection, type PageSelection } from '../../utils/selection';
import App from './App.vue';
import './style.css';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  allFrames: true,
  cssInjectionMode: 'ui',
  async main(ctx) {
    const state = shallowReactive({
      selection: null as PageSelection | null,
      x: 0, y: 0, visible: false, pinned: false,
    });
    const ui = await createShadowRootUi(ctx, {
      name: 'ai-translate-selection',
      position: 'inline',
      anchor: 'body',
      isolateEvents: true,
      onMount(container) {
        const app = createApp(App, { state });
        app.mount(container);
        return app;
      },
      onRemove(app) { app?.unmount(); },
    });
    ui.mount();
    ctx.onInvalidated(() => ui.remove());

    let dragging = false;
    let timer: number | undefined;
    const insideUi = (event: Event) => event.composedPath().includes(ui.shadowHost);
    const hide = () => {
      state.selection = null;
      state.visible = false;
      state.pinned = false;
    };
    const position = () => {
      const range = state.selection?.range;
      if (!range || !range.startContainer.isConnected || !range.endContainer.isConnected) {
        hide();
        return;
      }
      const rect = [...range.getClientRects()].filter((item) => item.width > 0 && item.height > 0).at(-1);
      if (!rect) { hide(); return; }
      state.visible = rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
      state.x = Math.max(8, Math.min(rect.right + 6, innerWidth - 44));
      state.y = Math.max(8, Math.min(rect.bottom + 6, innerHeight - 44));
    };
    const read = () => {
      if (state.pinned || dragging) return;
      let selected: PageSelection | null;
      try { selected = readPageSelection(document); }
      catch { hide(); return; }
      if (!selected) { hide(); return; }
      state.selection = selected;
      position();
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = ctx.setTimeout(read, 120);
    };
    ctx.addEventListener(document, 'pointerdown', (event) => {
      if (insideUi(event)) return;
      dragging = true;
      hide();
    });
    ctx.addEventListener(document, 'pointerup', (event) => {
      if (insideUi(event)) return;
      dragging = false;
      schedule();
    });
    ctx.addEventListener(document, 'pointercancel', () => { dragging = false; hide(); });
    ctx.addEventListener(document, 'selectionchange', schedule);
    ctx.addEventListener(document, 'keyup', (event) => {
      if (insideUi(event)) return;
      if (event.key === 'Escape') hide();
      else { state.pinned = false; schedule(); }
    });
    ctx.addEventListener(document, 'scroll', position, { capture: true, passive: true });
    ctx.addEventListener(window, 'resize', position);
    ctx.addEventListener(window, 'wxt:locationchange', hide);
  },
});
