<template>
   <label :for="`id_${id}`" class="file-uploader">
      <span class="file-uploader-message">
         <i class="mdi mdi-upload mr-1" />{{ message }}
      </span>
      <span class="text-ellipsis file-uploader-value">
         {{ value | lastPart }}
      </span>
      <i
         v-if="value.length"
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
   filters: {
      lastPart (string) {
         if (!string) return '';

         string = string.split(/[/\\]+/).pop();
         if (string.length >= 19)
            string = `...${string.slice(-19)}`;
         return string;
      }
   },
   props: {
      message: {
         default: 'Upload',
         type: String
      },
      value: {
         default: '',
         type: String
      }
   },
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
      }
   }
};
</script>

<style lang="scss" scoped>
.file-uploader {
  border: 0.05rem solid $bg-color-light;
  border-radius: 0.1rem;
  height: 1.8rem;
  line-height: 1.2rem;
  display: flex;
  cursor: pointer;
  background-color: $bg-color-gray;
  transition: background 0.2s, border 0.2s, box-shadow 0.2s, color 0.2s;
  position: relative;

  > span {
    padding: 0.25rem 0.4rem;
  }

  .file-uploader-message {
    display: flex;
    border-right: 0.05rem solid $bg-color-light;
    background-color: $bg-color;
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
    top: 25%;
  }
}

:disabled {
  .file-uploader {
    cursor: not-allowed;
    background-color: #151515;
    opacity: 0.5;
  }
}
</style>
