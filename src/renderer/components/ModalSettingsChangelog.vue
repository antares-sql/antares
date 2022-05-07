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

<script>
import { marked } from 'marked';
import BaseLoader from '@/components/BaseLoader';
import { useApplicationStore } from '@/stores/application';

export default {
   name: 'ModalSettingsChangelog',
   components: {
      BaseLoader
   },
   setup () {
      const { appVersion } = useApplicationStore();
      return { appVersion };
   },
   data () {
      return {
         changelog: '',
         isLoading: true,
         error: '',
         isError: false
      };
   },
   created () {
      this.getChangelog();
   },
   methods: {
      async getChangelog () {
         try {
            const apiRes = await fetch(`https://api.github.com/repos/antares-sql/antares/releases/tags/v${this.appVersion}`, {
               method: 'GET'
            });

            const { body } = await apiRes.json();
            const cutOffset = body.indexOf('### Download');
            const markdown = cutOffset >= 0
               ? body.substr(0, cutOffset)
               : body;

            const renderer = {
               link (href, title, text) {
                  return text;
               },
               listitem (text) {
                  return `<li>${text.replace(/ *\([^)]*\) */g, '')}</li>`;
               }
            };

            marked.use({ renderer });

            this.changelog = marked(markdown);
         }
         catch (err) {
            this.error = err.message;
            this.isError = true;
         }
         this.isLoading = false;
      }
   }
};
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
