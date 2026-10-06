<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { browser } from 'wxt/browser';
import { languageLabels, loadSettings, type Settings } from '../../utils/settings';

const settings = ref<Settings>();
const error = ref('');

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
    <span class="badge">Vue · {{ browser.runtime.getManifest().version }}</span>
    <h1>AI Translate</h1>
    <p>Расширение готово к разработке. Здесь будет интерфейс перевода.</p>
    <p v-if="settings" class="detail">
      Язык перевода: <strong>{{ languageLabels[settings.targetLanguage] }}</strong>
    </p>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <button type="button" @click="openOptions">Настройки</button>
  </main>
</template>

<style scoped>
.popup {
  width: 340px;
}
</style>
