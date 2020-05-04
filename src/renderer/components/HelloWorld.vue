<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <div>
      <i class="devicons devicons-mysql"></i>
      <i class="devicons devicons-msql_server"></i>
      <i class="devicons devicons-postgresql"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

.devicons{
  font-size: 4rem;
}
</style>
