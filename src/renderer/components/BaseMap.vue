<template>
   <div id="map" class="map" />
</template>
<script>
import L from 'leaflet';
import { point } from '@turf/helpers';
import centroid from '@turf/centroid';

export default {
   name: 'BaseMap',
   props: {
      points: [Object, Array]
   },
   data () {
      return {
         map: null
      };
   },
   mounted () {
      const marker = point([this.points.x, this.points.y]);
      const mapCenter = centroid(marker).geometry.coordinates.reverse();

      this.map = L.map('map', {
         center: mapCenter,
         zoom: 15,
         minZoom: 1
      });

      const geojsonMarkerOptions = {
         radius: 8,
         fillColor: '#ff7800',
         color: '#000',
         weight: 1,
         opacity: 0.6,
         fillOpacity: 0.8
      };

      L.geoJSON(marker, {
         pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions);
         }
      }).addTo(this.map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
         attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
   },
   methods: {
   }
};
</script>

<style lang="scss">
.map{
   height: 400px;
}

.marker-icon{
    display: flex;
    justify-content: center;
    align-items: center;
    background: $primary-color;
    border-radius: 50%;
    box-shadow: 0 0 5px 1px darken($body-font-color-dark, 40%);
}
</style>
