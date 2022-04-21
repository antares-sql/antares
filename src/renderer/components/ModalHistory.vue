<template>
   <div class="modal active">
      <a class="modal-overlay" @click.stop="closeModal" />
      <div class="modal-container p-0 pb-4">
         <div class="modal-header pl-2">
            <div class="modal-title h6">
               <div class="d-flex">
                  <i class="mdi mdi-24px mdi-history mr-1" />
                  <span class="cut-text">{{ $t('word.history') }}: {{ connectionName }}</span>
               </div>
            </div>
            <a class="btn btn-clear c-hand" @click.stop="closeModal" />
         </div>
         <div class="modal-body p-0 workspace-query-results">
            <div
               v-if="history.length"
               ref="searchForm"
               class="form-group has-icon-right p-2 m-0"
            >
               <input
                  v-model="searchTerm"
                  class="form-input"
                  type="text"
                  :placeholder="$t('message.searchForQueries')"
               >
               <i v-if="!searchTerm" class="form-icon mdi mdi-magnify mdi-18px pr-4" />
               <i
                  v-else
                  class="form-icon c-hand mdi mdi-backspace mdi-18px pr-4"
                  @click="searchTerm = ''"
               />
            </div>
            <div
               v-if="history.length"
               ref="tableWrapper"
               class="vscroll px-1 "
               :style="{'height': resultsSize+'px'}"
            >
               <div ref="table">
                  <BaseVirtualScroll
                     ref="resultTable"
                     :items="filteredHistory"
                     :item-height="66"
                     :visible-height="resultsSize"
                     :scroll-element="scrollElement"
                  >
                     <template #default="{ items }">
                        <div
                           v-for="query in items"
                           :key="query.uid"
                           class="tile my-2"
                           tabindex="0"
                        >
                           <div class="tile-icon">
                              <i class="mdi mdi-code-tags pr-1" />
                           </div>
                           <div class="tile-content">
                              <div class="tile-title">
                                 <code
                                    class="cut-text"
                                    :title="query.sql"
                                    v-html="highlightWord(query.sql)"
                                 />
                              </div>
                              <div class="tile-bottom-content">
                                 <small class="tile-subtitle">{{ query.schema }} · {{ formatDate(query.date) }}</small>
                                 <div class="tile-history-buttons">
                                    <button class="btn btn-link pl-1" @click.stop="$emit('select-query', query.sql)">
                                       <i class="mdi mdi-open-in-app pr-1" /> {{ $t('word.select') }}
                                    </button>
                                    <button class="btn btn-link pl-1" @click="copyQuery(query.sql)">
                                       <i class="mdi mdi-content-copy pr-1" /> {{ $t('word.copy') }}
                                    </button>
                                    <button class="btn btn-link pl-1" @click="deleteQuery(query)">
                                       <i class="mdi mdi-delete-forever pr-1" /> {{ $t('word.delete') }}
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </template>
                  </BaseVirtualScroll>
               </div>
            </div>
            <div v-else class="empty">
               <div class="empty-icon">
                  <i class="mdi mdi-history mdi-48px" />
               </div>
               <p class="empty-title h5">
                  {{ $t('message.thereIsNoQueriesYet') }}
               </p>
            </div>
         </div>
      </div>
   </div>
</template>

<script>
import moment from 'moment';
import { mapGetters, mapActions } from 'vuex';
import BaseVirtualScroll from '@/components/BaseVirtualScroll';

export default {
   name: 'ModalHistory',
   components: {
      BaseVirtualScroll
   },
   props: {
      connection: Object
   },
   data () {
      return {
         resultsSize: 1000,
         isQuering: false,
         scrollElement: null,
         searchTermInterval: null,
         searchTerm: '',
         localSearchTerm: ''
      };
   },
   computed: {
      ...mapGetters({
         getConnectionName: 'connections/getConnectionName',
         getHistoryByWorkspace: 'history/getHistoryByWorkspace'
      }),
      connectionName () {
         return this.getConnectionName(this.connection.uid);
      },
      history () {
         return this.getHistoryByWorkspace(this.connection.uid) || [];
      },
      filteredHistory () {
         return this.history.filter(q => q.sql.toLowerCase().search(this.searchTerm.toLowerCase()) >= 0);
      }
   },
   watch: {
      searchTerm () {
         clearTimeout(this.searchTermInterval);

         this.searchTermInterval = setTimeout(() => {
            this.localSearchTerm = this.searchTerm;
         }, 200);
      }
   },
   created () {
      window.addEventListener('keydown', this.onKey, { capture: true });
   },
   updated () {
      if (this.$refs.table)
         this.refreshScroller();

      if (this.$refs.tableWrapper)
         this.scrollElement = this.$refs.tableWrapper;
   },
   mounted () {
      this.resizeResults();
      window.addEventListener('resize', this.resizeResults);
   },
   beforeUnmount () {
      window.removeEventListener('keydown', this.onKey, { capture: true });
      window.removeEventListener('resize', this.resizeResults);
      clearInterval(this.refreshInterval);
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         deleteQueryFromHistory: 'history/deleteQueryFromHistory'
      }),
      copyQuery (sql) {
         navigator.clipboard.writeText(sql);
      },
      deleteQuery (query) {
         this.deleteQueryFromHistory({
            workspace: this.connection.uid,
            ...query
         });
      },
      resizeResults () {
         if (this.$refs.resultTable) {
            const el = this.$refs.tableWrapper.parentElement;

            if (el)
               this.resultsSize = el.offsetHeight - this.$refs.searchForm.offsetHeight;

            this.$refs.resultTable.updateWindow();
         }
      },
      formatDate (date) {
         return moment(date).isValid() ? moment(date).format('HH:mm:ss - YYYY/MM/DD') : date;
      },
      refreshScroller () {
         this.resizeResults();
      },
      closeModal () {
         this.$emit('close');
      },
      highlightWord (string) {
         string = string.replaceAll('<', '&lt;').replaceAll('>', '&gt;');

         if (this.searchTerm) {
            const regexp = new RegExp(`(${this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return string.replace(regexp, '<span class="text-primary text-bold">$1</span>');
         }
         else
            return string;
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'Escape')
            this.closeModal();
      }
   }
};
</script>

<style lang="scss" scoped>
.vscroll {
  height: 1000px;
  overflow: auto;
  overflow-anchor: none;
}

.tile {
  border-radius: $border-radius;
  display: flex;
  align-items: center;

  &:hover,
  &:focus {
    .tile-content {
      .tile-bottom-content {
        .tile-history-buttons {
          opacity: 1;
        }
      }
    }
  }

  .tile-icon {
    font-size: 1.2rem;
    margin-left: 0.3rem;
    width: 28px;
  }

  .tile-content {
    padding: 0.3rem;
    padding-left: 0.1rem;
    max-width: calc(100% - 30px);

    code {
      max-width: 100%;
      display: inline-block;
      font-size: 100%;
      // color: $primary-color;
      opacity: 0.8;
      font-weight: 600;
    }

    .tile-subtitle {
      opacity: 0.8;
    }

    .tile-bottom-content {
      display: flex;
      justify-content: space-between;

      .tile-history-buttons {
        opacity: 0;
        transition: opacity 0.2s;

        button {
          font-size: 0.7rem;
          height: 1rem;
          line-height: 1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }
}
</style>
