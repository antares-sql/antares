/**
 * Idle time after which TCP keepalive probes start on database sockets. Firewalls and NATs drop idle
 * connections after a few minutes (the OS default is 2 hours): the probes keep them open and let a
 * dead peer be detected, so the connection is replaced instead of failing on the next query.
 */
export const TCP_KEEPALIVE_DELAY_MS = 30 * 1000;

/** The dedicated connection of a query tab (autocommit off) was closed while its transaction was open */
export class LostConnectionError extends Error {
   constructor () {
      super('The connection of this tab was lost and its open transaction was rolled back. Run the query again to start a new transaction.');
      this.name = 'LostConnectionError';
   }
}
