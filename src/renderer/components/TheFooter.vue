<template>
   <div id="footer" class="text-light">
      <div class="footer-left-elements">
         <ul class="footer-elements">
            <li class="footer-element">
               <i class="material-icons md-18">memory</i>
            </li>
         </ul>
      </div>

      <div class="footer-right-elements">
         <ul class="footer-elements">
            <li class="footer-element">
               <i class="material-icons md-18">favorite</i>
            </li>
            <li class="footer-element">
               <i class="material-icons md-18">info_outline</i>
            </li>
         </ul>
      </div>
   </div>
</template>

<script>

export default {

};
</script>

<style lang="scss">
   #footer{
      height: $footer-height;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: $primary-color;
      padding: 0 .2rem;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      box-shadow: 0 0 1px 0px #000;

      .footer-elements{
         list-style: none;
         margin: 0;
         display: flex;

         .footer-element{
            padding: 0 .4rem;
         }
      }
   }
</style>
