<template>
   <div id="settingbar" class="container">
      <div class="settingbar-top-elements">
         <ul class="settingbar-elements">
            <li
               class="settingbar-element btn btn-link tooltip tooltip-right"
               data-tooltip="Add connection"
               @click="showNewConnModal"
            >
               <i class="material-icons text-light">add</i>
            </li>
         </ul>
      </div>

      <div class="settingbar-bottom-elements">
         <ul class="settingbar-elements">
            <li class="settingbar-element btn btn-link tooltip tooltip-right" data-tooltip="Settings">
               <i class="material-icons text-light">settings</i>
            </li>
         </ul>
      </div>
   </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
   name: 'TheSettingBar',
   methods: {
      ...mapActions({
         showNewConnModal: 'connections/showNewConnModal'
      })
   }
};
</script>

<style lang="scss">
   #settingbar{
      width: $settingbar-width;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      background: $bg-color-light;
      padding: .5rem 0;
      margin-bottom: $footer-height;
      box-shadow: 0 0 1px 0px #000;
      z-index: 9;

      .settingbar-elements{
         list-style: none;
         padding: 0;
         margin: 0;
      }
   }
</style>
