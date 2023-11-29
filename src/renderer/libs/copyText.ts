/**
 * Copy a string on clipboard
 * @param text
 */
export const copyText = (text: string) => {
   navigator.clipboard.writeText(text);
};
