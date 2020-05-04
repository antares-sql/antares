<template>
   <div id="app">
      <img alt="Vue logo" src="logo.png">
      <HelloWorld :msg="$store.state.application.appName" />
   </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue';

export default {
   name: 'App',
   components: {
      HelloWorld
   }
};
</script>

<style>
body{
  background: #FFFFFF;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
