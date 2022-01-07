<template>
   <div id="map" class="map" />
</template>
<script>
import L from 'leaflet';
import { point, lineString, polygon } from '@turf/helpers';
import { getArrayDepth } from 'common/libs/getArrayDepth';

export default {
   name: 'BaseMap',
   props: {
      points: [Object, Array]
   },
   data () {
      return {
         map: null,
         markers: null,
         center: null
      };
   },
   mounted () {
      if (Array.isArray(this.points)) {
         if (getArrayDepth(this.points) === 1)
            this.markers = lineString(this.points.reduce((acc, curr) => [...acc, [curr.x, curr.y]], []));
         else
            this.markers = polygon(this.points.map(arr => arr.reduce((acc, curr) => [...acc, [curr.x, curr.y]], [])));
      }
      else {
         this.center = [this.points.y, this.points.x];
         this.markers = point([this.points.x, this.points.y]);
      }

      this.map = L.map('map', {
         center: this.center || [0, 0],
         zoom: 15,
         minZoom: 1,
         attributionControl: false
      });

      L.control.attribution({ prefix: '<b>Leaflet</b>' }).addTo(this.map);

      const geoJsonObj = L.geoJSON(this.markers, {
         style: function () {
            return {
               weight: 2,
               fillColor: '#ff7800',
               color: '#ff7800',
               opacity: 0.8,
               fillOpacity: 0.4
            };
         },
         pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
               radius: 7,
               weight: 2,
               fillColor: '#ff7800',
               color: '#ff7800',
               opacity: 0.8,
               fillOpacity: 0.4
            });
         }
      }).addTo(this.map);

      const southWest = L.latLng(-90, -180);
      const northEast = L.latLng(90, 180);
      const bounds = L.latLngBounds(southWest, northEast);
      this.map.setMaxBounds(bounds);

      if (!this.center) this.map.fitBounds(geoJsonObj.getBounds());

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
         attribution: '&copy; <b>OpenStreetMap</b>'
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
