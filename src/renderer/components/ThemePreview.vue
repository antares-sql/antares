<template>
   <!-- A tiny Antares drawn with the theme tokens: the theme class gives the fallbacks of a partial theme -->
   <div
      class="theme-preview"
      :class="`theme-${theme.appearance}`"
      :style="variables"
   >
      <div class="tp-settingbar">
         <i /><i /><i />
      </div>
      <div class="tp-explorebar">
         <i class="w-70" /><i class="w-50" /><i class="w-60" /><i class="w-40" />
      </div>
      <div class="tp-main">
         <div class="tp-tabs">
            <span class="tp-tab active" /><span class="tp-tab" />
         </div>
         <div class="tp-editor">
            <div><b class="kw" /><b class="fg w-20" /><b class="str" /></div>
            <div><b class="kw" /><b class="fg w-30" /></div>
            <div><b class="fn" /><b class="num" /><b class="fg w-10" /></div>
         </div>
         <div class="tp-grid">
            <div v-for="row in 3" :key="row">
               <span class="t-number" /><span class="t-string" /><span class="t-date" />
            </div>
         </div>
      </div>
      <div class="tp-footer" />
   </div>
</template>

<script setup lang="ts">
import { AntaresTheme, themeCssVariables } from 'common/themes/theme';
import { computed, PropType } from 'vue';

import { useThemesStore } from '@/stores/themes';

const props = defineProps({
   theme: { type: Object as PropType<AntaresTheme>, required: true }
});

const themesStore = useThemesStore();

const variables = computed(() => {
   const editor = themesStore.editorThemeOf(props.theme);
   const syntax = (key: keyof typeof editor.tokens, fallback: string) => editor.tokens[key]?.color ?? fallback;
   return {
      ...themeCssVariables(props.theme),
      '--tp-editor-bg': editor.editor.background,
      '--tp-editor-fg': editor.editor.foreground,
      '--tp-keyword': syntax('keyword', editor.editor.foreground),
      '--tp-string': syntax('string', editor.editor.foreground),
      '--tp-number': syntax('number', editor.editor.foreground),
      '--tp-function': syntax('builtin', editor.editor.foreground)
   };
});
</script>

<style lang="scss" scoped>
.theme-preview {
  display: grid;
  grid-template: "settingbar explorebar main" 1fr "footer footer footer" 6px / 10% 22% 1fr;
  height: 96px;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--bg-app);

  i,
  b,
  span {
    display: block;
    border-radius: 2px;
  }

  .w-10 { width: 10%; }
  .w-20 { width: 20%; }
  .w-30 { width: 30%; }
  .w-40 { width: 40%; }
  .w-50 { width: 50%; }
  .w-60 { width: 60%; }
  .w-70 { width: 70%; }
}

.tp-settingbar {
  grid-area: settingbar;
  background: var(--bg-settingbar);
  padding: 4px 3px;

  i {
    height: 8px;
    margin-bottom: 4px;
    background: color-mix(in srgb, var(--settingbar-text) 35%, transparent);
  }

  i:first-child {
    background: var(--primary-color);
  }
}

.tp-explorebar {
  grid-area: explorebar;
  background: var(--bg-panel);
  padding: 6px 4px;

  i {
    height: 4px;
    margin-bottom: 5px;
    background: color-mix(in srgb, var(--text) 45%, transparent);
  }
}

.tp-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tp-tabs {
  display: flex;
  gap: 3px;
  padding: 3px 4px 0;
  background: var(--bg-tabbar);

  .tp-tab {
    width: 26px;
    height: 7px;
    background: color-mix(in srgb, var(--text) 30%, transparent);

    &.active {
      box-shadow: 0 2px 0 var(--primary-color);
      background: color-mix(in srgb, var(--text) 60%, transparent);
    }
  }
}

.tp-editor {
  flex: 1;
  padding: 4px 5px;
  background: var(--tp-editor-bg);

  div {
    display: flex;
    gap: 3px;
    margin-bottom: 4px;
  }

  b {
    height: 4px;
    width: 14%;
  }

  .kw { background: var(--tp-keyword); }
  .str { background: var(--tp-string); }
  .num { background: var(--tp-number); }
  .fn { background: var(--tp-function); }
  .fg { background: color-mix(in srgb, var(--tp-editor-fg) 70%, transparent); }
}

.tp-grid {
  padding: 3px 4px;
  background: var(--bg-app);

  div {
    display: flex;
    gap: var(--grid-border-width);
    margin-bottom: var(--grid-border-width);
    background: var(--grid-border);
  }

  span {
    flex: 1;
    height: 6px;
    border-radius: 0;
    background: var(--grid-row-bg);
    position: relative;

    &::after {
      content: "";
      position: absolute;
      left: 2px;
      top: 2px;
      width: 50%;
      height: 2px;
    }
  }

  .t-number::after { background: var(--type-number); }
  .t-string::after { background: var(--type-string); }
  .t-date::after { background: var(--type-date); }
}

.tp-footer {
  grid-area: footer;
  background: var(--primary-color);
}
</style>
