<template>
   <div id="map" class="map" />
</template>

<script setup lang="ts">
import { onMounted, PropType, Ref, ref } from 'vue';
import * as L from 'leaflet';
import {
   point,
   lineString,
   polygon
} from '@turf/helpers';
import { GeoJsonObject } from 'geojson';
import { getArrayDepth } from 'common/libs/getArrayDepth';

interface Coordinates { x: number; y: number }

const props = defineProps({
   points: [Object, Array] as PropType<Coordinates | Coordinates[]>,
   isMultiSpatial: Boolean
});
const map: Ref<L.Map> = ref(null);
const markers: Ref<GeoJsonObject | GeoJsonObject[]> = ref(null);
const center: Ref<[number, number]> = ref(null);

const getMarkers = (points: Coordinates) => {
   if (Array.isArray(points)) {
      if (getArrayDepth(points) === 1)
         return lineString(points.reduce((acc, curr) => [...acc, [curr.x, curr.y]], []));
      else
         return polygon(points.map(arr => arr.reduce((acc: Coordinates[], curr: Coordinates) => [...acc, [curr.x, curr.y]], [])));
   }
   else
      return point([points.x, points.y]);
};

onMounted(() => {
   if (props.isMultiSpatial) {
      for (const element of props.points as Coordinates[])
         (markers.value as GeoJsonObject[]).push(getMarkers(element));
   }
   else {
      markers.value = getMarkers(props.points as Coordinates);

      if (!Array.isArray(props.points))
         center.value = [props.points.y, props.points.x];
   }

   map.value = L.map('map', {
      center: center.value || [0, 0],
      zoom: 15,
      minZoom: 1,
      attributionControl: false
   });

   L.control.attribution({ prefix: '<b>Leaflet</b>' }).addTo(map.value);

   const geoJsonObj = L.geoJSON((markers.value as GeoJsonObject), {
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
   }).addTo(map.value);

   const southWest = L.latLng(-90, -180);
   const northEast = L.latLng(90, 180);
   const bounds = L.latLngBounds(southWest, northEast);
   map.value.setMaxBounds(bounds);

   if (!center.value) map.value.fitBounds(geoJsonObj.getBounds());

   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <b>OpenStreetMap</b>'
   }).addTo(map.value);
});
</script>

<style lang="scss">
.map {
  height: 400px;
}

.marker-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  background: $primary-color;
  border-radius: 50%;
  box-shadow: 0 0 5px 1px darken($body-font-color-dark, 40%);
}
</style>
