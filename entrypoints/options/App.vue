<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { languageLabels, loadSettings, saveSettings, type TargetLanguage } from '../../utils/settings';

const targetLanguage = ref<TargetLanguage>('ru');
const loading = ref(true);
const saving = ref(false);
const status = ref('');
const error = ref('');

onMounted(async () => {
  try {
    targetLanguage.value = (await loadSettings()).targetLanguage;
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
    await saveSettings({ targetLanguage: targetLanguage.value });
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
    <p>Пример сохранения параметров в локальном хранилище расширения.</p>
    <form @submit.prevent="save">
      <label for="target-language">Язык перевода</label>
      <select id="target-language" v-model="targetLanguage" :disabled="loading || saving" @change="status = ''">
        <option v-for="(label, value) in languageLabels" :key="value" :value="value">{{ label }}</option>
      </select>
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
