<template>
   <label :for="`id_${id}`" class="file-uploader">
      <span class="file-uploader-message">
         <i class="mdi mdi-folder-open mr-1" />{{ message }}
      </span>
      <span class="text-ellipsis file-uploader-value">
         {{ lastPart(modelValue) }}
      </span>
      <i
         v-if="modelValue.length"
         class="file-uploader-reset mdi mdi-close"
         @click.prevent="clear"
      />
      <form :ref="`form_${id}`">
         <input
            :id="`id_${id}`"
            class="file-uploader-input"
            type="file"
            @change="$emit('change', $event)"
         >
      </form>
   </label>
</template>

<script>
export default {
   name: 'BaseUploadInput',
   props: {
      message: {
         default: 'Browse',
         type: String
      },
      modelValue: {
         default: '',
         type: String
      }
   },
   emits: ['change', 'clear'],
   data () {
      return {
         id: null
      };
   },
   mounted () {
      this.id = this._uid;
   },
   methods: {
      clear () {
         this.$emit('clear');
      },
      lastPart (string) {
         if (!string) return '';

         string = string.split(/[/\\]+/).pop();
         if (string.length >= 19)
            string = `...${string.slice(-19)}`;
         return string;
      }
   }
};
</script>

<style lang="scss" scoped>
.file-uploader {
  border-radius: $border-radius;
  height: 1.8rem;
  line-height: 1.2rem;
  display: flex;
  cursor: pointer;
  transition: background 0.2s, border 0.2s, box-shadow 0.2s, color 0.2s;
  position: relative;
  flex: 1 1 auto;

  > span {
    padding: 0.25rem 0.4rem;
  }

  .file-uploader-message {
    display: flex;
    word-break: keep-all;
    border-radius: $border-radius 0 0 $border-radius;
  }

  .file-uploader-input {
    display: none;
  }

  .file-uploader-value {
    display: block;
    width: 100%;
    padding-right: 1rem;
  }

  .file-uploader-reset {
    z-index: 1;
    position: absolute;
    right: 5px;
    top: calc(50% - 8px);
  }
}

:disabled {
  .file-uploader {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>
