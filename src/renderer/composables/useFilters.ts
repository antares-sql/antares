import * as moment from 'moment';

export function useFilters () {
   const cutText = (string: string, length: number, escape?: boolean) => {
      if (typeof string !== 'string') return string;
      if (escape) string = string.replace(/\s{2,}/g, ' ');
      return string.length > length ? `${string.substring(0, length)}...` : string;
   };

   const lastPart = (string: string, length: number) => {
      if (!string) return '';

      string = string.split(/[/\\]+/).pop();
      if (string.length >= length)
         string = `...${string.slice(-length)}`;
      return string;
   };

   const formatDate = (date: Date) => moment(date).isValid() ? moment(date).format('HH:mm:ss - YYYY/MM/DD') : date;

   const localeString = (number: number | null) => {
      if (number !== null)
         return number.toLocaleString();
   };

   const wrapNumber = (num: number) => {
      if (!num) return '';
      return `(${num})`;
   };

   const parseKeys = (keys: Record<number, string>[]) => {
      const isMacOS = process.platform === 'darwin';
      return (keys as string[]).map(k => (
         k.split('+')
            .map(sk => (
               `<code class="text-bold">${sk}</code>`
            )))
         .join('+')
         .replaceAll('CommandOrControl', isMacOS ? 'Command' : 'Control')
      ).join(', ');
   };

   return {
      cutText,
      formatDate,
      wrapNumber,
      lastPart,
      localeString,
      parseKeys
   };
}
