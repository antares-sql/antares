<template>
   <div class="p-relative">
      <BaseLoader v-if="isLoading" />
      <div
         id="changelog"
         class="container"
         v-html="changelog"
      />
      <div v-if="isError" class="empty">
         <div class="empty-icon">
            <i class="mdi mdi-48px mdi-alert-outline" />
         </div>
      </div>
   </div>
</template>
<script setup lang="ts">
import { marked } from 'marked';
import BaseLoader from '@/components/BaseLoader.vue';
import { useApplicationStore } from '@/stores/application';
import { ref } from 'vue';

const { appVersion } = useApplicationStore();

const changelog = ref('');
const isLoading = ref(true);
const error = ref('');
const isError = ref(false);

const getChangelog = async () => {
   try {
      const apiRes = await fetch(`https://api.github.com/repos/antares-sql/antares/releases/tags/v${appVersion}`, {
         method: 'GET'
      });

      const { body } = await apiRes.json();
      const cutOffset = body.indexOf('### Download');
      const markdown = cutOffset >= 0
         ? body.substr(0, cutOffset)
         : body;

      const renderer = {
         link (href: string, title: string, text: string) {
            return text;
         },
         listitem (text: string) {
            return `<li>${text.replace(/ *\([^)]*\) */g, '')}</li>`;
         }
      };

      marked.use({ renderer });

      changelog.value = marked(markdown);
   }
   catch (err) {
      error.value = err.message;
      isError.value = true;
   }

   isLoading.value = false;
};

getChangelog();
</script>
<style lang="scss">
#changelog {
  h3 {
    font-size: 1rem;
  }

  li {
    margin-top: 0;
  }
}
</style>
