<template>
   <div class="context" :class="[{ 'bottom': isBottom }, { 'right': isRight }]">
      <a
         class="context-overlay"
         aria-hidden="true"
         @click="close"
         @contextmenu="close"
      />
      <div
         ref="contextContent"
         class="context-container"
         role="menu"
         :style="position"
      >
         <slot />
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, Ref, ref } from 'vue';

const contextContent: Ref<HTMLDivElement> = ref(null);
const contextSize: Ref<{height: number; width: number; subHeight?: number; subWidth?: number}> = ref(null);
const isBottom: Ref<boolean> = ref(false);
const isRight: Ref<boolean> = ref(false);
const props = defineProps<{ contextEvent: MouseEvent }>();
const emit = defineEmits(['close-context']);
const isRtl = document.documentElement.dir === 'rtl';

/**
 * Where the menu opens: the pointer, or for a menu opened with the keyboard (context menu key, Shift+F10)
 * the bottom start corner of the focused element, since such events don't carry pointer coordinates
 */
const origin = (event: MouseEvent) => {
   const target = event.target as HTMLElement;
   const fromKeyboard = event.button !== 2 && !(event.clientX || event.clientY);
   if (fromKeyboard && target?.getBoundingClientRect) {
      const rect = target.getBoundingClientRect();
      const inset = Math.min(rect.width / 2, 40);
      return { clientX: isRtl ? rect.right - inset : rect.left + inset, clientY: rect.bottom };
   }
   return { clientX: event.clientX, clientY: event.clientY };
};

const position = computed(() => {
   let topCord = '0px';
   let leftCord = '0px';

   if (props.contextEvent) {
      const { clientY, clientX } = origin(props.contextEvent);
      topCord = `${clientY + 2}px`;
      leftCord = `${clientX + 5}px`;

      if (contextSize.value) {
         if (clientY + (contextSize.value.height < 200 ? 200 : contextSize.value.height) + 5 >= window.innerHeight) {
            topCord = `${clientY + 3 - contextSize.value.height}px`;
            isBottom.value = true;
         }

         if (clientY + contextSize.value.subHeight + contextSize.value.height >= window.innerHeight)
            isBottom.value = true;

         if (isRtl) {
            // Mirrored: the menu opens on the left of the pointer, submenus on its left side.
            // `right` (from the stylesheet mirrored for RTL) moves submenus to the other side
            leftCord = `${clientX - contextSize.value.width - 5}px`;

            if (clientX - contextSize.value.width - 5 <= 0) {
               leftCord = `${clientX}px`;
               isRight.value = true;
            }

            if (clientX - contextSize.value.subWidth - contextSize.value.width <= 0)
               isRight.value = true;
         }
         else {
            if (clientX + contextSize.value.width + 5 >= window.innerWidth) {
               leftCord = `${clientX - contextSize.value.width}px`;
               isRight.value = true;
            }

            if (clientX + contextSize.value.subWidth + contextSize.value.width >= window.innerWidth)
               isRight.value = true;
         }
      }
   }

   return {
      top: topCord,
      left: leftCord
   };
});

const close = () => {
   emit('close-context');
};

// Element focused before the menu opened: it gets the focus back on close
const previousFocus = document.activeElement as HTMLElement;

/** Items of the menu level that contains `item` (the main menu or a submenu) */
const levelItems = (level: Element) => [...level.querySelectorAll<HTMLElement>('.context-element')]
   .filter(el => el.parentElement.closest('.context-submenu, .context-container') === level && !el.classList.contains('disabled'));

const focusItem = (el: HTMLElement) => {
   if (!el) return;
   if (!el.hasAttribute('tabindex')) el.tabIndex = -1; // Items rendered after the menu opened
   el.focus();
};

const currentLevel = () => {
   const active = document.activeElement as HTMLElement;
   if (!contextContent.value?.contains(active) || !active.classList.contains('context-element')) return null;
   return active.parentElement.closest('.context-submenu, .context-container');
};

const moveFocus = (step: 1 | -1 | 'first' | 'last') => {
   const level = currentLevel() || contextContent.value;
   const items = levelItems(level);
   if (!items.length) return;
   const index = items.indexOf(document.activeElement as HTMLElement);
   let next: HTMLElement;
   if (step === 'first') next = items[0];
   else if (step === 'last') next = items[items.length - 1];
   else next = items[(index + step + items.length) % items.length] || items[0];
   focusItem(next);
};

const onKey = (e: KeyboardEvent) => {
   e.stopPropagation();
   const active = document.activeElement as HTMLElement;
   const isItem = contextContent.value?.contains(active) && active.classList.contains('context-element');
   const isRtl = getComputedStyle(contextContent.value).direction === 'rtl';
   const forward = isRtl ? 'ArrowLeft' : 'ArrowRight';
   const backward = isRtl ? 'ArrowRight' : 'ArrowLeft';

   switch (e.key) {
      case 'Escape':
      case 'Tab':
         e.preventDefault();
         close();
         break;
      case 'ArrowDown':
         e.preventDefault();
         moveFocus(1);
         break;
      case 'ArrowUp':
         e.preventDefault();
         moveFocus(-1);
         break;
      case 'Home':
         e.preventDefault();
         moveFocus('first');
         break;
      case 'End':
         e.preventDefault();
         moveFocus('last');
         break;
      case forward: {
         const submenu = isItem && active.querySelector(':scope > .context-submenu');
         if (submenu) {
            e.preventDefault();
            focusItem(levelItems(submenu)[0]);
         }
         break;
      }
      case backward: {
         const parentItem = isItem && active.closest('.context-submenu')?.closest<HTMLElement>('.context-element');
         if (parentItem) {
            e.preventDefault();
            focusItem(parentItem);
         }
         break;
      }
      case 'Enter':
      case ' ':
         if (isItem) {
            e.preventDefault();
            const submenu = active.querySelector(':scope > .context-submenu');
            if (submenu) focusItem(levelItems(submenu)[0]);
            else active.click();
         }
         break;
   }
};

window.addEventListener('keydown', onKey);

onMounted(() => {
   if (contextContent.value) {
      contextSize.value = contextContent.value.getBoundingClientRect();

      const submenus = contextContent.value.querySelectorAll<HTMLDivElement>('.context-submenu');

      for (const submenu of submenus) {
         const submenuSize = submenu.getBoundingClientRect();

         if (!contextSize.value.subHeight || submenuSize.height > contextSize.value.subHeight)
            contextSize.value.subHeight = submenuSize.height;
         if (!contextSize.value.subWidth || submenuSize.width > contextSize.value.subWidth)
            contextSize.value.subWidth = submenuSize.width;
         submenu.setAttribute('role', 'menu');
      }

      for (const item of contextContent.value.querySelectorAll<HTMLElement>('.context-element')) {
         item.setAttribute('role', 'menuitem');
         item.tabIndex = -1;
         if (item.querySelector(':scope > .context-submenu')) item.setAttribute('aria-haspopup', 'menu');
         if (item.classList.contains('disabled')) item.setAttribute('aria-disabled', 'true');
      }

      moveFocus('first');
   }
});

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
   if (previousFocus?.isConnected && contextContent.value?.contains(document.activeElement))
      previousFocus.focus();
});
</script>

<style lang="scss">
.context {
   display: flex;
   font-size: 16px;
   z-index: 400;
   justify-content: center;
   align-items: center;
   overflow: hidden;
   position: fixed;
   height: 100vh;
   right: 0;
   top: 0;
   left: 0;
   bottom: 0;

   &:not(.bottom) .context-submenu {
      top: -0.2rem;
   }

   &.bottom .context-submenu {
      bottom: -0.2rem;
   }

   &:not(.right) .context-submenu {
      left: 100%;
   }

   &.right .context-submenu {
      right: 100%;
   }

   .context-container {
      min-width: 100px;
      z-index: 10;
      padding: 0;
      background: var(--context-bg);
      border-radius: $border-radius;
      border: var(--border-width) solid var(--context-border);
      display: flex;
      flex-direction: column;
      position: absolute;
      pointer-events: initial;

      .context-element {
         display: flex;
         align-items: center;
         margin: 0.2rem;
         padding: 0.1rem 0.3rem;
         border-radius: $border-radius;
         cursor: pointer;
         justify-content: space-between;
         position: relative;
         white-space: nowrap;

         .context-submenu {
            border-radius: $border-radius;
            border: var(--border-width) solid var(--context-border);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s;
            position: absolute;
            min-width: 100px;
            background: var(--context-bg);
         }

         &:hover,
         &:focus-within {
            .context-submenu {
               display: block;
               visibility: visible;
               opacity: 1;
            }
         }
      }
   }

   .context-overlay {
      background: transparent;
      bottom: 0;
      cursor: default;
      display: block;
      left: 0;
      position: absolute;
      right: 0;
      top: 0;
   }
}

.disabled {
   pointer-events: none;
   filter: grayscale(100%);
   opacity: 0.5;
}
</style>
