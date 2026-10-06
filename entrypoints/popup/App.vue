<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { browser } from 'wxt/browser';
import { languageLabels, loadSettings, type Settings } from '../../utils/settings';
import type { TranslateMessage, TranslateResponse } from '../../utils/translation-messages';

const settings = ref<Settings>();
const error = ref('');
const text = ref('');
const translation = ref('');
const translating = ref(false);

async function translate() {
  if (!settings.value || translating.value || !text.value.trim()) return;
  translating.value = true;
  translation.value = '';
  error.value = '';
  try {
    // Read the latest key in case settings changed in another tab.
    const latestSettings = await loadSettings();
    settings.value.apiKey = latestSettings.apiKey;
    const message: TranslateMessage = {
      type: 'ai-translate:translate',
      text: text.value,
      targetLanguage: settings.value.targetLanguage,
    };
    const response: TranslateResponse = await browser.runtime.sendMessage(message);
    if (!response?.ok) throw new Error(response?.error ?? 'Не удалось получить ответ расширения.');
    translation.value = response.translation;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось перевести текст.';
  } finally {
    translating.value = false;
  }
}

onMounted(async () => {
  try {
    settings.value = await loadSettings();
  } catch {
    error.value = 'Не удалось загрузить настройки.';
  }
});

async function openOptions() {
  try {
    await browser.runtime.openOptionsPage();
  } catch {
    error.value = 'Не удалось открыть настройки.';
  }
}
</script>

<template>
  <main class="popup panel">
    <header>
      <h1>AI Translate</h1>
      <button type="button" class="settings-button" @click="openOptions">Настройки</button>
    </header>
    <form @submit.prevent="translate">
      <label for="source-text">Текст для перевода</label>
      <textarea id="source-text" v-model="text" rows="5" placeholder="Введите или вставьте текст…"
        :disabled="translating" maxlength="12000" required />
      <template v-if="settings">
        <label for="target-language">Перевести на</label>
        <select id="target-language" v-model="settings.targetLanguage" :disabled="translating">
          <option v-for="(label, value) in languageLabels" :key="value" :value="value">{{ label }}</option>
        </select>
        <p v-if="!settings.apiKey" class="detail">Для перевода добавьте ключ OpenRouter в настройках.</p>
      </template>
      <button type="submit" :disabled="!settings || !text.trim() || translating">
        {{ translating ? 'Переводим…' : 'Перевести' }}
      </button>
    </form>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <section v-if="translation" class="result" aria-live="polite">
      <label for="translation">Перевод</label>
      <textarea id="translation" :value="translation" readonly rows="5" />
    </section>
    <p role="status" class="detail">{{ translating ? 'Ожидаем ответ OpenRouter…' : 'Текст отправляется в OpenRouter при переводе.' }}</p>
  </main>
</template>

<style scoped>
.popup {
  width: 400px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

h1 {
  font-size: 22px;
}

.settings-button {
  background: #e0e7ff;
  color: #3730a3;
  font-size: 12px;
}

form,
.result {
  display: grid;
  gap: 10px;
}

.result {
  margin-top: 16px;
}

label {
  font-size: 13px;
  font-weight: 600;
}
</style>
