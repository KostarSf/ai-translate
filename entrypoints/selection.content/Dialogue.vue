<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue';
import { browser } from 'wxt/browser';
import type { TranslationContext } from '../../utils/translation-context';
import type { DialogueEntry, FollowupMessage, FollowupResponse, TranslationResult } from '../../utils/translation-messages';

const props = defineProps<{ text: string; context: TranslationContext; result: TranslationResult }>();
const draft = ref('');
const messages = ref<DialogueEntry[]>([]);
const pendingQuestion = ref('');
const sending = ref(false);
const error = ref('');
const thread = ref<HTMLElement>();
let active = true;
onUnmounted(() => { active = false; });

async function scrollToLast() {
  await nextTick();
  if (thread.value) thread.value.scrollTop = thread.value.scrollHeight;
}

async function send() {
  const question = draft.value.trim();
  if (!question || sending.value || messages.value.length >= 38) return;
  sending.value = true;
  error.value = '';
  pendingQuestion.value = question;
  draft.value = '';
  void scrollToLast();
  try {
    const message: FollowupMessage = {
      type: 'ai-translate:followup', text: props.text, context: props.context,
      result: props.result,
      messages: [...messages.value.map((entry) => ({ ...entry })), { role: 'user', content: question }],
    };
    const response: FollowupResponse = await browser.runtime.sendMessage(message);
    if (!active) return;
    if (!response?.ok) throw new Error(response?.error ?? 'Не удалось получить ответ расширения.');
    messages.value.push({ role: 'user', content: question }, { role: 'assistant', content: response.answer });
    pendingQuestion.value = '';
  } catch (cause) {
    if (!active) return;
    error.value = cause instanceof Error ? cause.message : 'Не удалось получить ответ.';
    draft.value = question;
  } finally {
    if (active) {
      sending.value = false;
      void scrollToLast();
    }
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    event.stopPropagation();
    void send();
  }
}
</script>

<template>
  <section class="dialogue" aria-label="Уточнения о переводе">
    <form class="dialogue-form" @submit.prevent="send">
      <textarea v-model="draft" rows="1" maxlength="2000" placeholder="Уточнить о переводе…"
        aria-label="Вопрос о переводе" :readonly="sending" :disabled="messages.length >= 38"
        @keydown="onKeydown" @keyup.stop />
      <button type="submit" class="send-icon" title="Отправить вопрос" aria-label="Отправить вопрос"
        :disabled="sending || !draft.trim() || messages.length >= 38">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="m4 4 17 8-17 8 3-8-3-8Z M7 12h14" />
        </svg>
      </button>
    </form>
    <div v-if="messages.length || pendingQuestion" class="dialogue-history">
      <strong class="dialogue-title">Уточнение перевода</strong>
      <div ref="thread" class="dialogue-thread" role="log" aria-label="История уточнений" aria-live="polite" :aria-busy="sending">
        <div v-for="(entry, index) in messages" :key="index" class="dialogue-message" :class="entry.role">
          <span v-if="entry.role === 'assistant'">AI Translate</span>
          <p dir="auto">{{ entry.content }}</p>
        </div>
        <div v-if="pendingQuestion" class="dialogue-message user">
          <p dir="auto">{{ pendingQuestion }}</p>
        </div>
        <p v-if="sending" class="dialogue-status" role="status">Отвечаем…</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </div>
    </div>
    <p v-if="messages.length >= 38" class="dialogue-status">Чтобы продолжить, выделите текст заново.</p>
  </section>
</template>
