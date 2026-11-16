import { describe, expect, it, vi } from 'vitest';

import { createLease } from '../../../src/main/libs/db/core/ConnectionLease';
import { SshClient, SshTunnel } from '../../../src/main/libs/db/core/SshTunnel';

const fakeSsh = (localPort = 40000) => {
   const client: SshClient & { config?: unknown } = {
      addTunnel: vi.fn(async () => ({ localPort })),
      closeTunnel: vi.fn(),
      close: vi.fn()
   };
   const factory = vi.fn(config => {
      client.config = config;
      return client;
   });
   return { client, factory };
};

describe('SshTunnel', () => {
   it('opens one SSH connection and reuses its local port', async () => {
      const { client, factory } = fakeSsh(41000);
      const tunnel = new SshTunnel({ host: 'bastion', username: 'u', password: 'p' }, factory);

      const ports = await Promise.all([tunnel.open('db', 3306), tunnel.open('db', 3306), tunnel.open('db', 3306)]);

      expect(ports).toEqual([41000, 41000, 41000]);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(client.addTunnel).toHaveBeenCalledWith({ remoteAddr: 'db', remotePort: 3306 });
      expect(tunnel.isOpen).toBe(true);
   });

   it('drops empty credentials', async () => {
      const { client, factory } = fakeSsh();
      await new SshTunnel({ host: 'bastion', username: 'u', password: '', passphrase: '' }, factory).open('db', 1);

      expect(client.config).not.toHaveProperty('password');
      expect(client.config).not.toHaveProperty('passphrase');
      expect(client.config).toMatchObject({ host: 'bastion', username: 'u', reconnect: true });
   });

   it('closes the SSH connection and can be reopened', async () => {
      const { client, factory } = fakeSsh();
      const tunnel = new SshTunnel({ host: 'bastion' }, factory);
      await tunnel.open('db', 1);

      tunnel.close();
      expect(client.closeTunnel).toHaveBeenCalled();
      expect(client.close).toHaveBeenCalled();
      expect(tunnel.isOpen).toBe(false);

      await tunnel.open('db', 1);
      expect(factory).toHaveBeenCalledTimes(2);
   });

   it('cleans up and allows a retry when opening fails', async () => {
      const { client, factory } = fakeSsh();
      (client.addTunnel as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('auth failed'));
      const tunnel = new SshTunnel({ host: 'bastion' }, factory);

      await expect(tunnel.open('db', 1)).rejects.toThrow('auth failed');
      expect(client.close).toHaveBeenCalled();
      await expect(tunnel.open('db', 1)).resolves.toBe(40000);
   });
});

describe('createLease', () => {
   it('runs the release callback once', () => {
      const onRelease = vi.fn();
      const lease = createLease('conn', onRelease);

      lease.release();
      lease.release();

      expect(lease.connection).toBe('conn');
      expect(onRelease).toHaveBeenCalledTimes(1);
   });
});
