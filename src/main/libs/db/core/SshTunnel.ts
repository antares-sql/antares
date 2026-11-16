import SSH2Promise = require('@fabio286/ssh2-promise');
import SSHConfig from '@fabio286/ssh2-promise/lib/sshConfig';

export interface SshClient {
   addTunnel (options: { remoteAddr: string; remotePort: number }): Promise<{ localPort: number }>;
   closeTunnel (): unknown;
   close (): unknown;
}

export type SshClientFactory = (config: SSHConfig) => SshClient;

const defaultFactory: SshClientFactory = config => new SSH2Promise(config) as unknown as SshClient;

/**
 * One SSH tunnel per database connection.
 * `open()` is idempotent: every connection of the client (pool, query tabs, export/import workers)
 * goes through the same local port, and `close()` tears it down.
 */
export class SshTunnel {
   private readonly _config: SSHConfig;
   private readonly _factory: SshClientFactory;
   private _ssh?: SshClient;
   private _opening?: Promise<number>;

   constructor (config: SSHConfig, factory: SshClientFactory = defaultFactory) {
      // Empty credentials make the SSH library try (and fail) them: drop them instead
      const { password, passphrase, ...rest } = config;
      this._config = {
         ...rest,
         ...(password ? { password } : {}),
         ...(passphrase ? { passphrase } : {})
      };
      this._factory = factory;
   }

   get isOpen () {
      return !!this._ssh;
   }

   /** Opens the tunnel (once) and returns the local port forwarding to remoteAddr:remotePort */
   open (remoteAddr: string, remotePort: number): Promise<number> {
      if (!this._opening) {
         this._opening = this._open(remoteAddr, remotePort).catch(err => {
            this._opening = undefined;
            throw err;
         });
      }
      return this._opening;
   }

   private async _open (remoteAddr: string, remotePort: number) {
      try {
         this._ssh = this._factory({
            ...this._config,
            reconnect: true,
            reconnectTries: 3,
            debug: process.env.NODE_ENV !== 'production' ? (s: string) => console.log(s) : null
         });

         const tunnel = await this._ssh.addTunnel({ remoteAddr, remotePort });
         return tunnel.localPort;
      }
      catch (err) {
         this.close();
         throw err;
      }
   }

   close () {
      if (this._ssh) {
         this._ssh.closeTunnel();
         this._ssh.close();
      }
      this._ssh = undefined;
      this._opening = undefined;
   }
}
