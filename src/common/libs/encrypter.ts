import * as crypto from 'crypto';

const algorithm = 'aes-256-gcm';

function encrypt (text: string, password: string) {
   const iv = crypto.randomBytes(16);
   const key = crypto.scryptSync(password, 'antares', 32);
   const cipher = crypto.createCipheriv(algorithm, key, iv);
   const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
   const authTag = cipher.getAuthTag();

   return {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      content: encrypted.toString('hex')
   };
}

function decrypt (hash: { iv: string; content: string; authTag: string }, password: string) {
   const key = crypto.scryptSync(password, 'antares', 32);
   const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(hash.iv, 'hex'));
   decipher.setAuthTag(Buffer.from(hash.authTag, 'hex'));
   const decrpyted = decipher.update(hash.content, 'hex', 'utf8') + decipher.final('utf8');

   return decrpyted;
}

export { decrypt, encrypt };
