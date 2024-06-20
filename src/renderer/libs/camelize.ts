export const camelize = (text: string) => {
   const textArr = text.split('-');
   for (let i = 0; i < textArr.length; i++) {
      if (i === 0) continue;
      textArr[i] = textArr[i].charAt(0).toUpperCase() + textArr[i].slice(1);
   }

   return textArr.join('');
};
