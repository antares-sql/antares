<template>
   <div
      ref="el"
      class="select"
      :class="{'select-open': isOpen}"
      role="combobox"
      :tabindex="searchable ? -1 : tabindex"
      @focus="activate()"
      @blur="searchable ? false : handleBlurEvent()"
      @keyup.esc="deactivate()"
      @keydown.self.down.prevent="moveDown()"
      @keydown.self.up.prevent="moveUp"
   >
      <div class="select__item-text">
         <input
            v-if="searchable"
            ref="searchInput"
            class="select__search-input"
            :style="searchInputStyle"
            type="text"
            autocomplete="off"
            spellcheck="false"
            :tabindex="tabindex"
            :value="searchText"
            @input="searchText = $event.target.value"
            @focus.prevent="!isOpen ? activate() : false"
            @blur.prevent="handleBlurEvent()"
            @keyup.esc="deactivate()"
            @keydown.down.prevent="keyArrows('down')"
            @keydown.up.prevent="keyArrows('up')"
            @keypress.enter.prevent.stop.self="select(filteredOptions[hightlightedIndex])"
         >
         <span v-if="searchable && !isOpen || !searchable">{{ currentOptionLabel }}</span>
      </div>
      <Teleport
         v-if="isOpen"
         ref="teleportEl"
         :to="dropdownContainer"
      >
         <div
            ref="optionList"
            :class="`select__list-wrapper ${dropdownClass ? dropdownClass : '' }`"
         >
            <ul class="select__list" @mousedown.prevent>
               <li
                  v-for="(opt, index) of filteredOptions"
                  :key="getOptionValue(opt)"
                  :ref="(el) => optionRefs[index] = el"
                  :class="{
                     'select__option--highlight': index === hightlightedIndex,
                     'select__option--selected': isSelected(opt)
                  }"
                  @click.stop="select(opt)"
                  @mouseenter.self="hightlightedIndex = index"
               >
                  <slot
                     name="option"
                     :option="opt"
                     :index="index"
                  >
                     {{ getOptionLabel(opt) }}
                  </slot>
               </li>
            </ul>
         </div>
      </Teleport>
   </div>
</template>

<script>
import { defineComponent, computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue';

export default defineComponent({
   name: 'BaseSelect',
   props: {
      modelValue: {
         type: [String, Number, Object]
      },
      value: {
         type: [String, Number, Object]
      },
      searchable: {
         type: Boolean,
         default: true
      },
      preserveSearch: {
         type: Boolean,
         default: false
      },
      tabindex: {
         type: Number,
         default: 0
      },
      options: {
         type: Array,
         default: () => []
      },
      optionTrackBy: {
         type: [String, Function],
         default: () => (opt) => {
            for (const guess of ['id', 'value']) if (opt[guess]) return guess;
         }
      },
      optionLabel: {
         type: [String, Function],
         default: () => (opt) => opt.label ? 'label' : undefined
      },
      closeOnSelect: {
         type: Boolean,
         default: true
      },
      dropdownContainer: {
         type: String,
         default: '#main-content'
      },
      dropdownOffsets: {
         type: Object,
         default: () => ({ top: 10, left: 0 })
      },
      dropdownClass: {
         type: String
      }
   },
   emits: ['select', 'open', 'close', 'update:modelValue', 'change', 'blur'],
   setup (props, { emit }) {
      const hightlightedIndex = ref(0);
      const isOpen = ref(false);
      const internalValue = ref(props.modelValue || props.value);
      const el = ref(null);
      const searchInput = ref(null);
      const optionList = ref(null);
      const optionRefs = [];
      const searchText = ref('');
      const filteredOptions = computed(() => {
         const normalizedSearch = (searchText.value || '').toLowerCase().trim();
         const options = [...props.options];

         return normalizedSearch
            ? options.filter(opt => getOptionLabel(opt).trim().toLowerCase().indexOf(normalizedSearch) !== -1)
            : options;
      });

      const searchInputStyle = computed(() => {
         if (props.searchable)
            // just hide the input and give the ability to receive focus
            return isOpen.value ? { with: '100%' } : { width: 0, position: 'absolute', padding: 0, margin: 0 };

         return '';
      });

      watch(filteredOptions, (options) => {
         if (hightlightedIndex.value >= options.length -1)
            hightlightedIndex.value = options.length ? options.length -1 : 0;
         else
            hightlightedIndex.value = 0;
      });

      const getOptionValue = (opt) => {
         const key = typeof props.optionTrackBy === 'function' ? props.optionTrackBy(opt) : props.optionTrackBy;
         return key ? opt[key] : opt;
      };

      const getOptionLabel = (opt) => {
         const key = typeof props.optionLabel === 'function' ? props.optionLabel(opt) : props.optionLabel;
         return key ? opt[key] : opt;
      };

      const currentOptionLabel = computed(() => {
         if (props.modelValue) {
            const opt = props.options.find(d => getOptionValue(d) === props.modelValue);
            return getOptionLabel(opt);
         }

         return undefined;
      });

      const select = (opt) => {
         internalValue.value = opt;
         emit('select', opt);
         emit('update:modelValue', getOptionValue(opt));
         emit('change', opt);

         if (props.closeOnSelect)
            deactivate();
      };

      const isSelected = (opt) => {
         return internalValue.value === getOptionValue(opt);
      };

      const activate = () => {
         if (isOpen.value) return;
         isOpen.value = true;

         if (props.searchable)
            searchInput.value.focus();

         else
            el.value.focus();

         nextTick(() => adjustListPosition());

         emit('open');
      };

      const deactivate = () => {
         if (!isOpen.value) return;
         isOpen.value = false;

         if (props.searchable)
            searchInput.value.blur();

         else
            el.value.blur();

         if (!props.preserveSearch) searchText.value = '';

         emit('close');
      };

      const adjustListPosition = () => {
         const element = el.value;
         const { left, top } = element.getBoundingClientRect();
         const { left: offsetLeft = 0, top: offsetTop = 0 } = props.dropdownOffsets;

         optionList.value.style.left = `${left + offsetLeft}px`;
         optionList.value.style.top = `${top + element.clientHeight + offsetTop}px`;
         optionList.value.style.minWidth = `${element.clientWidth}px`;
      };

      const keyArrows = (direction) => {
         const sum = direction === 'down' ? +1 : -1;
         const index = hightlightedIndex.value + sum;
         hightlightedIndex.value = Math.max(0, index > filteredOptions.value.length - 1 ? filteredOptions.value.length - 1 : index);

         const optEl = optionRefs[hightlightedIndex.value];

         const visMin = optionList.value.scrollTop;
         const visMax = optionList.value.scrollTop + optionList.value.clientHeight - optEl.clientHeight;

         if (optEl.offsetTop < visMin)
            optionList.value.scrollTop = optEl.offsetTop;

         else if (optEl.offsetTop >= visMax)
            optionList.value.scrollTop = optEl.offsetTop - optionList.value.clientHeight + optEl.clientHeight;
      };

      const handleBlurEvent = () => {
         deactivate();
         emit('blur');
      };

      onMounted(() => {
         window.addEventListener('resize', adjustListPosition);
      });
      onUnmounted(() => {
         window.removeEventListener('resize', adjustListPosition);
      });

      return {
         el,
         searchInput,
         searchText,
         searchInputStyle,
         filteredOptions,
         getOptionValue,
         getOptionLabel,
         currentOptionLabel,
         activate,
         deactivate,
         select,
         isSelected,
         keyArrows,
         isOpen,
         hightlightedIndex,
         optionList,
         optionRefs,
         handleBlurEvent
      };
   }
});
</script>

<style lang="scss" scoped>
.select {

  display: block;

  &__search-input {
    appearance: none;
    border: none;
    background: transparent;
    outline: none;
    color: currentColor;
  }

  &__list-wrapper {
    position: fixed;
    display: block;
    z-index: 5;
    -webkit-overflow-scrolling: touch;
    max-height: 240px;
    overflow: auto;
    left: 0;
    top: 40px;
  }

  &__list {
    list-style: none;
  }
}
</style>
