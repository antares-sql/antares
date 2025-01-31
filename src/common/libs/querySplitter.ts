import { ClientCode } from 'common/interfaces/antares';

export const querySplitter =(sql: string, dbType: ClientCode): string[] => {
   const queries: string[] = [];
   let currentQuery = '';
   let insideBlock = false;
   let insideString = false;
   let stringDelimiter: string | null = null;
   let insideDollarTag = false;
   let dollarTagDelimiter: string | null = null;

   // Regex patterns for BEGIN-END blocks, dollar tags in PostgreSQL, and semicolons
   const beginRegex = /\bBEGIN\b/i;
   const endRegex = /\bEND\b;/i;
   const dollarTagRegex = /\$(\w+)?\$/; // Matches $tag$ or $$

   // Split on semicolons, keeping semicolons attached to the lines
   const lines = sql.split(/(?<=;)/);

   for (let line of lines) {
      line = line.trim();

      if (!line) continue;

      for (let i = 0; i < line.length; i++) {
         const char = line[i];

         // Handle string boundaries
         if ((char === '\'' || char === '"') && (!insideString || char === stringDelimiter)) {
            if (!insideString) {
               insideString = true;
               stringDelimiter = char;
            }
            else {
               insideString = false;
               stringDelimiter = null;
            }
         }

         currentQuery += char;

         if (dbType === 'pg') {
         // Handle dollar-quoted blocks in PostgreSQL
            if (!insideString && line.slice(i).match(dollarTagRegex)) {
               const match = line.slice(i).match(dollarTagRegex);
               if (match) {
                  const tag = match[0];
                  if (!insideDollarTag) {
                     insideDollarTag = true;
                     dollarTagDelimiter = tag;
                     currentQuery += tag;
                     i += tag.length - 1;
                  }
                  else if (dollarTagDelimiter === tag) {
                     insideDollarTag = false;
                     dollarTagDelimiter = null;
                     currentQuery += tag;
                     i += tag.length - 1;
                  }
               }
            }
         }

         // Check BEGIN-END blocks
         if (!insideString && !insideDollarTag) {
            if (beginRegex.test(line))
               insideBlock = true;

            if (insideBlock && endRegex.test(line))
               insideBlock = false;
         }
      }

      // Append the query if we encounter a semicolon outside a BEGIN-END block, outside a string, and outside dollar tags
      if (!insideBlock && !insideString && !insideDollarTag && /;\s*$/.test(line)) {
         queries.push(currentQuery.trim());
         currentQuery = '';
      }
   }

   // Add any remaining query
   if (currentQuery.trim())
      queries.push(currentQuery.trim());

   return queries;
};
