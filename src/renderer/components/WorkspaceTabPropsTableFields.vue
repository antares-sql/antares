<template>
   <div
      ref="tableWrapper"
      class="vscroll"
      :style="{'height': resultsSize+'px'}"
   >
      <TableContext
         v-if="isContext"
         :context-event="contextEvent"
         :selected-field="selectedField"
         :index-types="indexTypes"
         :indexes="indexes"
         @delete-selected="removeField"
         @duplicate-selected="duplicateField"
         @close-context="isContext = false"
         @add-new-index="$emit('add-new-index', $event)"
         @add-to-index="$emit('add-to-index', $event)"
      />
      <div ref="propTable" class="table table-hover">
         <div class="thead">
            <div class="tr">
               <div class="th">
                  <div class="text-right">
                     {{ $t('word.order') }}
                  </div>
               </div>
               <div class="th">
                  <div class="table-column-title">
                     {{ $tc('word.key', 2) }}
                  </div>
               </div>
               <div class="th">
                  <div class="column-resizable min-100">
                     <div class="table-column-title">
                        {{ $t('word.name') }}
                     </div>
                  </div>
               </div>
               <div class="th">
                  <div class="column-resizable min-100">
                     <div class="table-column-title">
                        {{ $t('word.type') }}
                     </div>
                  </div>
               </div>
               <div v-if="customizations.tableArray" class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('word.array') }}
                     </div>
                  </div>
               </div>
               <div class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('word.length') }}
                     </div>
                  </div>
               </div>
               <div v-if="customizations.unsigned" class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('word.unsigned') }}
                     </div>
                  </div>
               </div>
               <div v-if="customizations.nullable" class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('message.allowNull') }}
                     </div>
                  </div>
               </div>
               <div v-if="customizations.zerofill" class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('message.zeroFill') }}
                     </div>
                  </div>
               </div>
               <div class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('word.default') }}
                     </div>
                  </div>
               </div>
               <div v-if="customizations.comment" class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('word.comment') }}
                     </div>
                  </div>
               </div>
               <div v-if="customizations.collation" class="th">
                  <div class="column-resizable min-100">
                     <div class="table-column-title">
                        {{ $t('word.collation') }}
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <Draggable
            ref="resultTable"
            :list="fields"
            class="tbody"
            item-key="_antares_id"
            handle=".row-draggable"
         >
            <template #item="{element}">
               <TableRow
                  :row="element"
                  :indexes="getIndexes(element.name)"
                  :foreigns="getForeigns(element.name)"
                  :data-types="dataTypes"
                  :customizations="customizations"
                  @contextmenu="contextMenu"
                  @rename-field="$emit('rename-field', $event)"
               />
            </template>
         </Draggable>
      </div>
   </div>
</template>

<script>// TODO: expose tableWrapper
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import Draggable from 'vuedraggable';
import TableRow from '@/components/WorkspaceTabPropsTableRow';
import TableContext from '@/components/WorkspaceTabPropsTableContext';

export default {
   name: 'WorkspaceTabPropsTableFields',
   components: {
      TableRow,
      TableContext,
      Draggable
   },
   props: {
      fields: Array,
      indexes: Array,
      foreigns: Array,
      indexTypes: Array,
      tabUid: [String, Number],
      connUid: String,
      table: String,
      schema: String,
      mode: String
   },
   emits: ['add-new-index', 'add-to-index', 'rename-field', 'duplicate-field', 'remove-field'],
   setup () {
      const { addNotification } = useNotificationsStore();
      const workspacesStore = useWorkspacesStore();

      const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

      const { getWorkspace } = workspacesStore;

      return {
         addNotification,
         selectedWorkspace,
         getWorkspace
      };
   },
   data () {
      return {
         resultsSize: 1000,
         isContext: false,
         contextEvent: null,
         selectedField: null,
         scrollElement: null
      };
   },
   computed: {
      workspaceSchema () {
         return this.getWorkspace(this.connUid).breadcrumbs.schema;
      },
      customizations () {
         return this.getWorkspace(this.connUid).customizations;
      },
      dataTypes () {
         return this.getWorkspace(this.connUid).dataTypes;
      },
      primaryField () {
         return this.fields.filter(field => ['pri', 'uni'].includes(field.key))[0] || false;
      },
      tabProperties () {
         return this.getWorkspaceTab(this.tabUid);
      },
      fieldsLength () {
         return this.fields.length;
      }
   },
   watch: {
      fieldsLength () {
         this.refreshScroller();
      }
   },
   updated () {
      if (this.$refs.propTable)
         this.refreshScroller();

      if (this.$refs.tableWrapper)
         this.scrollElement = this.$refs.tableWrapper;
   },
   mounted () {
      window.addEventListener('resize', this.resizeResults);
   },
   unmounted () {
      window.removeEventListener('resize', this.resizeResults);
   },
   methods: {
      resizeResults () {
         if (this.$refs.resultTable) {
            const el = this.$refs.tableWrapper;

            if (el) {
               const footer = document.getElementById('footer');
               const size = window.innerHeight - el.getBoundingClientRect().top - footer.offsetHeight;
               this.resultsSize = size;
            }
         }
      },
      refreshScroller () {
         this.resizeResults();
      },
      contextMenu (event, uid) {
         this.selectedField = this.fields.find(field => field._antares_id === uid);
         this.contextEvent = event;
         this.isContext = true;
      },
      duplicateField () {
         this.$emit('duplicate-field', this.selectedField._antares_id);
      },
      removeField () {
         this.$emit('remove-field', this.selectedField._antares_id);
      },
      getIndexes (field) {
         return this.indexes.reduce((acc, curr) => {
            acc.push(...curr.fields.map(f => ({ name: f, type: curr.type })));
            return acc;
         }, []).filter(f => f.name === field);
      },
      getForeigns (field) {
         return this.foreigns.reduce((acc, curr) => {
            if (curr.field === field)
               acc.push(`${curr.refTable}.${curr.refField}`);
            return acc;
         }, []);
      }
   }
};
</script>

<style lang="scss" scoped>
.column-resizable {
  &:hover,
  &:active {
    resize: horizontal;
    overflow: hidden;
  }
}

.vscroll {
  overflow: auto;
}

.min-100 {
  min-width: 100px !important;
}
</style>
