<template>
   <div ref="root" class="toolbar-overflow">
      <div v-show="!collapsed" class="toolbar-overflow-items">
         <slot />
      </div>
      <div
         v-if="collapsed"
         class="dropdown toolbar-overflow-more"
         :class="{'dropdown-right': alignRight}"
      >
         <button
            class="btn btn-dark btn-sm dropdown-toggle"
            :title="t('general.moreActions')"
            :aria-label="t('general.moreActions')"
            tabindex="0"
            @focus="alignMenu"
         >
            <BaseIcon icon-name="dots" :size="24" />
         </button>
         <ul v-if="slots.menu" class="menu text-left toolbar-overflow-menu">
            <slot name="menu" />
         </ul>
         <div v-else class="menu toolbar-overflow-menu toolbar-overflow-buttons">
            <slot />
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, Ref, ref, useSlots } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';

/**
 * Group of secondary toolbar actions that collapses into a "more actions" (⋯) dropdown
 * when the toolbar (`.workspace-query-runner-footer`) is too narrow to show everything on one row.
 * The dropdown shows the default slot again as a menu (buttons restyled as menu items),
 * or the `menu` slot (`<li class="menu-item">` elements) when the actions need a custom menu.
 * Slot content is rendered twice while collapsed: don't put template refs in it.
 */
const { t } = useI18n();
const slots = useSlots();

const root: Ref<HTMLDivElement> = ref(null);
const collapsed = ref(false);
const alignRight = ref(false);

let toolbar: HTMLElement = null;
let observer: ResizeObserver = null;
let isChecking = false;

const outerWidth = (el: HTMLElement) => {
   const style = getComputedStyle(el);
   return el.scrollWidth + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
};

/** Expands the group, measures the width the whole toolbar needs and collapses again if it doesn't fit */
const check = async () => {
   if (isChecking || !toolbar?.clientWidth) return; // clientWidth is 0 in hidden tabs
   isChecking = true;

   collapsed.value = false;
   await nextTick();

   const style = getComputedStyle(toolbar);
   const available = toolbar.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
   const needed = [...toolbar.children].reduce((acc, el) => acc + outerWidth(el as HTMLElement), 0);
   collapsed.value = needed > available + 1;

   await nextTick();
   isChecking = false;
};

/** Opens the menu towards the left when it would overflow the window on the right */
const alignMenu = (e: FocusEvent) => {
   const toggle = e.target as HTMLElement;
   const menu = toggle.nextElementSibling as HTMLElement;
   const rect = toggle.getBoundingClientRect();
   const width = menu?.offsetWidth || 0;
   // `dropdown-right` aligns the menu to the end side of the toggle (mirrored in RTL)
   alignRight.value = document.documentElement.dir === 'rtl'
      ? rect.right - width < 0
      : rect.left + width > document.documentElement.clientWidth;
};

onMounted(() => {
   toolbar = root.value.closest<HTMLElement>('.workspace-query-runner-footer') ?? root.value.parentElement;
   observer = new ResizeObserver(() => check());
   observer.observe(toolbar);
   for (const child of toolbar.children)
      observer.observe(child);
   check();
});

onBeforeUnmount(() => {
   observer?.disconnect();
});
</script>

<style lang="scss">
.toolbar-overflow,
.toolbar-overflow-items {
  display: contents;
}

.toolbar-overflow-more {
  display: flex;
}

.toolbar-overflow-menu {
  min-width: 180px;

  .menu-item > a {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    white-space: nowrap;

    &.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  }

  // Toolbar buttons shown as menu items
  &.toolbar-overflow-buttons {
    padding: 0.2rem;

    .btn {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      height: auto;
      margin: 0 !important;
      padding: 0.2rem 0.4rem;
      border-color: transparent;
      background: transparent;
      color: inherit;
      white-space: nowrap;

      &:hover:not(:disabled) {
        background: var(--bg-hover-strong);
      }

      &:disabled {
        opacity: 0.5;
      }
    }

    .divider-vert {
      display: block;
      height: 0;
      margin: 0.2rem 0;
      padding: 0 !important;
      border-top: 1px solid var(--divider);

      &::before {
        display: none;
      }
    }
  }
}
</style>
