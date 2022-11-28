export const getContrast = (hexcolor: string) => {
   if (!hexcolor) return '';
   return (parseInt(hexcolor.replace('#', ''), 16) > 0xffffff / 2) ? 'dark' : 'light';
};
