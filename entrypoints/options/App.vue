<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { languageLabels, loadSettings, saveSettings, type TargetLanguage } from '../../utils/settings';

const targetLanguage = ref<TargetLanguage>('ru');
const apiKey = ref('');
const loading = ref(true);
const saving = ref(false);
const status = ref('');
const error = ref('');

onMounted(async () => {
  try {
    const settings = await loadSettings();
    targetLanguage.value = settings.targetLanguage;
    apiKey.value = settings.apiKey;
    loading.value = false;
  } catch {
    error.value = 'Не удалось загрузить настройки. Перезагрузите страницу.';
  }
});

async function save() {
  saving.value = true;
  status.value = '';
  error.value = '';
  try {
    await saveSettings({ targetLanguage: targetLanguage.value, apiKey: apiKey.value.trim() });
    apiKey.value = apiKey.value.trim();
    status.value = 'Настройки сохранены.';
  } catch {
    error.value = 'Не удалось сохранить настройки. Попробуйте ещё раз.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <main class="options panel">
    <span class="badge">AI Translate</span>
    <h1>Настройки</h1>
    <p>Настройте доступ к OpenRouter и язык перевода.</p>
    <form @submit.prevent="save">
      <label for="api-key">API-ключ OpenRouter</label>
      <input id="api-key" v-model="apiKey" type="password" autocomplete="off" spellcheck="false"
        placeholder="sk-or-v1-…" :disabled="loading || saving" aria-describedby="key-help" @input="status = ''" />
      <p id="key-help" class="detail">
        Ключ хранится локально в этом браузере. Удалите его из поля и сохраните, чтобы отключить доступ.
        <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener noreferrer">Получить ключ</a>
      </p>
      <label for="target-language">Язык перевода</label>
      <select id="target-language" v-model="targetLanguage" :disabled="loading || saving" @change="status = ''">
        <option v-for="(label, value) in languageLabels" :key="value" :value="value">{{ label }}</option>
      </select>
      <p class="detail">При переводе введённый текст отправляется в OpenRouter и провайдеру модели.</p>
      <button type="submit" :disabled="loading || saving">
        {{ saving ? 'Сохранение…' : 'Сохранить' }}
      </button>
      <p role="status">{{ status }}</p>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
    </form>
  </main>
</template>

<style scoped>
.options {
  max-width: 560px;
  margin: 48px auto;
}

form {
  display: grid;
  gap: 12px;
  margin-top: 24px;
}
</style>
