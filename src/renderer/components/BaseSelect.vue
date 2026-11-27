<template>
   <!-- ARIA combobox pattern: the focused element (search input, or the root when not searchable) is the combobox -->
   <div
      ref="el"
      class="select"
      :class="{'select--open': isOpen, 'select--disabled': disabled}"
      :role="searchable ? null : 'combobox'"
      :tabindex="searchable || disabled ? -1 : tabindex"
      v-bind="searchable ? {} : comboboxAttrs"
      @focus="activate()"
      @blur="searchable ? false : handleBlurEvent()"
      @keydown.self="onKeydown"
   >
      <div class="select__item-text">
         <input
            v-if="searchable"
            ref="searchInput"
            class="select__search-input"
            :style="searchInputStyle"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            autocomplete="off"
            spellcheck="false"
            :tabindex="tabindex"
            :value="searchText"
            :aria-label="$attrs['aria-label']"
            v-bind="comboboxAttrs"
            @input="onInput"
            @focus.prevent="!isOpen ? activate() : false"
            @blur.prevent="handleBlurEvent()"
            @keydown="onKeydown"
         >
         <span v-if="searchable && !isOpen || !searchable" :id="valueId">{{ currentOptionLabel }}</span>
      </div>
      <Transition :name="animation">
         <div
            v-if="isOpen"
            ref="optionList"
            :class="`select__list-wrapper ${dropdownClass ? dropdownClass : '' }`"
            tabindex="-1"
            @mousedown="isMouseDown = true"
            @mouseup="handleMouseUpEvent()"
         >
            <ul
               :id="listId"
               class="select__list"
               role="listbox"
               :aria-label="$attrs['aria-label']"
               @mousedown.prevent
            >
               <li
                  v-for="(opt, index) of filteredOptions"
                  :id="`${listId}-${index}`"
                  :key="opt.id"
                  :ref="(el) => optionRefs[index] = el"
                  :role="opt.$type === 'group' ? 'presentation' : 'option'"
                  :aria-selected="opt.$type === 'group' ? null : isSelected(opt)"
                  :aria-disabled="opt.disabled || null"
                  :class="{
                     'select__item': true,
                     'select__group': opt.$type === 'group',
                     'select__option--highlight': opt.$type === 'option' && !opt.disabled && index === hightlightedIndex,
                     'select__option--selected': opt.$type === 'option' && isSelected(opt),
                     'select__option--disabled': opt.disabled
                  }"
                  @click.stop="select(opt)"
                  @mousemove.self="hightlightedIndex = index"
               >
                  <slot
                     name="option"
                     :option="opt"
                     :index="index"
                  >
                     {{ opt.label }}
                  </slot>
               </li>
            </ul>
         </div>
      </Transition>
   </div>
</template>

<script>
import { uidGen } from 'common/libs/uidGen';
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { isKeyboardModality } from '@/libs/a11y/inputModality';

export default defineComponent({
   name: 'BaseSelect',
   props: {
      modelValue: {
         type: [String, Number, Object, Boolean]
      },
      value: {
         type: [String, Number, Object, Boolean]
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
         default: 'value'
      },
      optionLabel: {
         type: [String, Function],
         default: 'label'
      },
      optionDisabled: {
         type: Function
      },
      groupLabel: {
         type: String
      },
      groupValues: {
         type: String
      },
      closeOnSelect: {
         type: Boolean,
         default: true
      },
      animation: {
         type: String,
         default: 'fade-slide-down'
      },
      dropdownOffsets: {
         type: Object,
         default: () => ({ top: 10, left: 0 })
      },
      dropdownClass: {
         type: String
      },
      disabled: {
         type: Boolean,
         default: false
      },
      maxVisibleOptions: {
         type: Number,
         default: 100
      }
   },
   emits: ['select', 'open', 'close', 'update:modelValue', 'change', 'blur'],
   setup (props, { emit }) {
      const uid = uidGen();
      const listId = `select-list-${uid}`;
      const valueId = `select-value-${uid}`;
      const hightlightedIndex = ref(0);
      const isOpen = ref(false);
      const isMouseDown = ref(false);
      const internalValue = ref(props.modelValue !== false ? props.modelValue : props.value);
      const el = ref(null);
      const searchInput = ref(null);
      const optionList = ref(null);
      const optionRefs = [];
      const searchText = ref('');

      const getOptionValue = (opt) => _guess('optionTrackBy', opt);
      const getOptionLabel = (opt) => _guess('optionLabel', opt) + '';
      const getOptionDisabled = (opt) => _guess('optionDisabled', opt);
      const _guess = (name, item) => {
         const prop = props[name];
         if (typeof prop === 'function')
            return prop(item);

         return item[prop] !== undefined ? item[prop] : item;
      };

      const flattenOptions = computed(() => {
         return [...props.options].reduce((prev, curr) => {
            if (curr[props.groupValues] && curr[props.groupValues].length) {
               prev.push({
                  $type: 'group',
                  label: curr[props.groupLabel],
                  id: `group-${curr[props.groupLabel]}`,
                  count: curr[props.groupLabel].length
               });

               return prev.concat(curr[props.groupValues].map(el => {
                  const value = getOptionValue(el);
                  return {
                     $type: 'option',
                     label: getOptionLabel(el),
                     id: `option-${value}`,
                     disabled: getOptionDisabled(el) === true,
                     value,
                     $data: {
                        ...el
                     }
                  };
               }));
            }
            else {
               const value = getOptionValue(curr);
               prev.push({
                  $type: 'option',
                  label: getOptionLabel(curr),
                  id: `option-${value}`,
                  disabled: getOptionDisabled(curr) === true,
                  value,
                  $data: {
                     ...curr
                  }
               });
            }

            return prev;
         }, []);
      });

      const filteredOptions = computed(() => {
         const searchTerms = (searchText.value || '').toLowerCase().trim();

         let options = searchTerms
            ? flattenOptions.value.filter(opt => opt.$type === 'group' || opt.label.trim().toLowerCase().indexOf(searchTerms) !== -1)
            : flattenOptions.value;

         if (options.length > props.maxVisibleOptions) {
            let sliceStart = 0;
            let sliceEnd = sliceStart + props.maxVisibleOptions;

            // if no search active try to open the dropdown showing options around the selected one
            if (searchTerms === '') {
               const index = internalValue.value ? flattenOptions.value.findIndex(el => el.value === internalValue.value) : -1;

               if (index < options.length -1) {
                  sliceStart = Math.max(0, index - Math.floor(props.maxVisibleOptions / 2));
                  sliceEnd = Math.min(sliceStart + sliceEnd, options.length -1);
               }
            }

            options = options.slice(sliceStart, sliceEnd);
         }

         return options;
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

      watch(() => props.modelValue, (val) => {
         internalValue.value = val;
      });

      watch(() => props.value, (val) => {
         internalValue.value = val;
      });

      const currentOptionLabel = computed(() =>
         flattenOptions.value.find(d => d.value === internalValue.value)?.label
      );

      /** ARIA state of the combobox, on the element that has the focus */
      const comboboxAttrs = computed(() => ({
         'aria-haspopup': 'listbox',
         'aria-expanded': String(isOpen.value),
         'aria-controls': isOpen.value ? listId : null,
         'aria-activedescendant': isOpen.value && filteredOptions.value[hightlightedIndex.value] ? `${listId}-${hightlightedIndex.value}` : null,
         // The current value, read when the list is closed (the search input itself is empty)
         'aria-describedby': !isOpen.value && currentOptionLabel.value !== undefined ? valueId : null,
         'aria-disabled': props.disabled || null
      }));

      const select = (opt) => {
         if (opt.$type === 'group' || opt.disabled) return;

         internalValue.value = opt.value;
         emit('select', opt);
         emit('update:modelValue', opt.value);
         emit('change', opt);

         if (props.closeOnSelect)
            deactivate();
      };

      const isSelected = (opt) => {
         return internalValue.value === opt.value;
      };

      const activate = () => {
         if (isOpen.value || props.disabled) return;
         isOpen.value = true;
         hightlightedIndex.value = Math.max(0, filteredOptions.value.findIndex(el => el.value === internalValue.value));

         if (props.searchable)
            searchInput.value.focus();
         else
            el.value.focus();

         nextTick(() => {
            adjustListPosition();
            scrollTo(optionRefs[hightlightedIndex.value]);
         });

         emit('open');
      };

      const deactivate = () => {
         if (!isOpen.value) return;
         isOpen.value = false;

         // Keyboard users stay on the select, to go on with Tab from there
         if (!isKeyboardModality()) {
            if (props.searchable)
               searchInput.value?.blur();
            else
               el.value?.blur();
         }

         if (!props.preserveSearch) searchText.value = '';

         emit('close');
      };

      const adjustListPosition = () => {
         if (!optionList.value) return;

         const element = el.value;
         let { left, top } = element.getBoundingClientRect();
         const { left: offsetLeft = 0, top: offsetTop = 0 } = props.dropdownOffsets;
         top = top + element.clientHeight + offsetTop;
         const openBottom = top >= 0 && top + optionList.value.clientHeight <= window.innerHeight;

         if (!openBottom) {
            top -= (offsetTop * 2 + element.clientHeight);
            optionList.value.style.transform = 'translate(0, -100%)';
         }

         optionList.value.style.top = `${top}px`;
         optionList.value.style.minWidth = `${element.clientWidth}px`;

         // RTL: anchored to the select's right edge, so a list wider than the select grows to the left
         if (document.documentElement.dir === 'rtl') {
            const { right } = element.getBoundingClientRect();
            optionList.value.style.left = 'auto';
            optionList.value.style.right = `${document.documentElement.clientWidth - right - offsetLeft}px`;
         }
         else
            optionList.value.style.left = `${left + offsetLeft}px`;
      };

      const keyArrows = (direction) => {
         const sum = direction === 'down' ? +1 : -1;
         const options = filteredOptions.value;
         // Next option in that direction, skipping groups and disabled options
         let index = hightlightedIndex.value + sum;
         while (index >= 0 && index < options.length && (options[index].$type === 'group' || options[index].disabled))
            index += sum;
         if (index < 0 || index >= options.length) return;

         hightlightedIndex.value = index;

         const optEl = optionRefs[hightlightedIndex.value];
         if (!optEl)
            return;

         scrollTo(optEl);
      };

      const scrollTo = (optEl) => {
         if (!optEl) return;
         const visMin = optionList.value.scrollTop;
         const visMax = optionList.value.scrollTop + optionList.value.clientHeight - optEl.clientHeight;

         if (optEl.offsetTop < visMin)
            optionList.value.scrollTop = optEl.offsetTop;

         else if (optEl.offsetTop >= visMax)
            optionList.value.scrollTop = optEl.offsetTop - optionList.value.clientHeight + optEl.clientHeight;
      };

      const onKeydown = (e) => {
         switch (e.key) {
            case 'ArrowDown':
            case 'ArrowUp':
               e.preventDefault();
               if (!isOpen.value) activate();
               else keyArrows(e.key === 'ArrowDown' ? 'down' : 'up');
               break;
            case 'Enter':
               if (!isOpen.value) return;
               e.preventDefault();
               e.stopPropagation();
               if (filteredOptions.value[hightlightedIndex.value]) select(filteredOptions.value[hightlightedIndex.value]);
               break;
            case ' ':
               if (props.searchable || isOpen.value) return;
               e.preventDefault();
               activate();
               break;
            case 'Escape':
               // Closes the list, not the dialog around it
               if (!isOpen.value) return;
               e.preventDefault();
               e.stopPropagation();
               deactivate();
               break;
         }
      };

      const onInput = (e) => {
         searchText.value = e.target.value;
         if (!isOpen.value) activate();
      };

      const handleBlurEvent = () => {
         if (isMouseDown.value) return;
         deactivate();
         emit('blur');
      };

      const handleMouseUpEvent = () => {
         isMouseDown.value = false;
         searchInput.value.focus();
      };

      // scrolling outside the select (list included) closes it, as the list position is fixed
      const handleWheelEvent = (e) => {
         if (!(e.target instanceof Node) || !el.value?.contains(e.target))
            deactivate();
      };

      onMounted(() => {
         window.addEventListener('resize', adjustListPosition);
         window.addEventListener('wheel', handleWheelEvent);

         nextTick(() => {
            // fix position when the component is created and opened at the same time
            if (isOpen.value) {
               setTimeout(() => {
                  adjustListPosition();
               }, 50);
            }
         });
      });
      onUnmounted(() => {
         window.removeEventListener('resize', adjustListPosition);
         window.removeEventListener('wheel', handleWheelEvent);
      });

      return {
         el,
         listId,
         valueId,
         comboboxAttrs,
         onKeydown,
         onInput,
         searchInput,
         searchText,
         searchInputStyle,
         filteredOptions,
         currentOptionLabel,
         activate,
         deactivate,
         select,
         isSelected,
         keyArrows,
         isOpen,
         isMouseDown,
         hightlightedIndex,
         optionList,
         optionRefs,
         handleBlurEvent,
         handleMouseUpEvent,
         internalValue
      };
   }
});
</script>

<style lang="scss" scoped>
.select {
  display: block;

  &:focus,
  &--open {
    z-index: 10;
  }

  &__search-input {
    appearance: none;
    border: none;
    background: transparent;
    outline: none;
    color: currentColor;
    max-width: 100%;
    width: 100%;
  }

  &__item-text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__list-wrapper {
    cursor: pointer;
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

  &__option {
    &--disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
