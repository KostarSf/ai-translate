<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { browser } from 'wxt/browser';
import type { PageSelection } from '../../utils/selection';
import type { TranslateMessage, TranslateResponse } from '../../utils/translation-messages';

const props = defineProps<{
  state: { selection: PageSelection | null; x: number; y: number; visible: boolean; pinned: boolean };
}>();
const open = ref(false);
const loading = ref(false);
const translation = ref('');
const wordNote = ref('');
const error = ref('');
let requestId = 0;

watch(() => props.state.selection, () => {
  requestId++;
  open.value = false;
  loading.value = false;
  translation.value = '';
  wordNote.value = '';
  error.value = '';
  translation.value = '';
  wordNote.value = '';
});

const cardStyle = computed(() => ({
  left: `${Math.max(8, Math.min(props.state.x, innerWidth - 328))}px`,
  ...(props.state.y > innerHeight / 2
    ? { bottom: `${Math.max(8, innerHeight - props.state.y + 8)}px` }
    : { top: `${props.state.y + 42}px` }),
}));

async function translate() {
  const selected = props.state.selection;
  if (!selected || loading.value) return;
  props.state.pinned = true;
  open.value = true;
  loading.value = true;
  error.value = '';
  const currentId = ++requestId;
  try {
    const message: TranslateMessage = {
      type: 'ai-translate:translate', text: selected.text, context: selected.context,
    };
    const response: TranslateResponse = await browser.runtime.sendMessage(message);
    if (currentId !== requestId) return;
    if (!response?.ok) throw new Error(response?.error ?? 'Не удалось получить ответ расширения.');
    translation.value = response.translation;
    wordNote.value = response.wordNote ?? '';
  } catch (cause) {
    if (currentId === requestId) error.value = cause instanceof Error ? cause.message : 'Не удалось перевести текст.';
  } finally {
    if (currentId === requestId) loading.value = false;
  }
}

function close() {
  requestId++;
  open.value = false;
  props.state.pinned = false;
  props.state.selection = null;
  props.state.visible = false;
}

async function settings() {
  try {
    await browser.runtime.sendMessage({ type: 'ai-translate:open-options' });
  } catch {
    error.value = 'Перезагрузите страницу и попробуйте ещё раз.';
  }
}

function keepSelection(event: PointerEvent) {
  if ((event.target as Element).closest('button')) event.preventDefault();
}
</script>

<template>
  <div v-if="state.selection && state.visible" class="translation-ui" @pointerdown.stop="keepSelection" @pointerup.stop @keydown.esc.stop="close">
    <button class="translate-icon" type="button" title="Перевести выделенный текст"
      aria-label="Перевести выделенный текст" :aria-expanded="open" :disabled="loading"
      :style="{ left: `${state.x}px`, top: `${state.y}px` }" @click="translate">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M3 5h12M9 2v3M5 5c1 5 4 8 8 10M13 5c-1 5-4 8-9 11M13 21l4-10 4 10M14.5 17h5" />
      </svg>
    </button>
    <section v-if="open" class="translation-card" :style="cardStyle" role="dialog" aria-label="Перевод выделения" :aria-busy="loading">
      <header><strong>Перевод</strong><button type="button" class="close" aria-label="Закрыть перевод" @click="close">×</button></header>
      <p v-if="loading" role="status">Переводим…</p>
      <p v-else-if="error" class="error" role="alert">{{ error }}</p>
      <template v-else>
        <p class="result" dir="auto" aria-live="polite">{{ translation }}</p>
        <section v-if="wordNote" class="word-note" aria-label="Справка о слове">
          <strong>О слове</strong>
          <p dir="auto">{{ wordNote }}</p>
        </section>
      </template>
      <footer>
        <button v-if="error" type="button" @click="translate">Повторить</button>
        <button type="button" @click="settings">Настройки</button>
      </footer>
    </section>
  </div>
</template>
