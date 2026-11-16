/**
 * Pure parsers of PostgreSQL metadata.
 */

export interface FunctionDefinition {
   /** Dollar-quoted body, quotes included ($function$ ... $function$) */
   sql: string;
   security: 'DEFINER' | 'INVOKER';
   language: string;
   /** Return type (functions only; SETOF removed) */
   returns?: string;
}

/**
 * Parses pg_get_functiondef() output. Header clauses (LANGUAGE, SECURITY, RETURNS) are read
 * from the part before the body, so text inside the body can't be mistaken for them.
 */
export function parseFunctionDefinition (definition: string): FunctionDefinition {
   const body = definition.match(/(\$(.*)\$)(.*)(\$(.*)\$)/gs)?.[0] ?? '';
   const header = body ? definition.slice(0, definition.indexOf(body)) : definition;
   const returns = header.match(/(?<=RETURNS )(.*)(?<=[\S+\n\r\s])/m)?.[0];

   return {
      sql: body,
      security: /SECURITY DEFINER/.test(header) ? 'DEFINER' : 'INVOKER',
      language: header.match(/(?<=LANGUAGE )(.*)(?<=[\S+\n\r\s])/m)?.[0],
      ...(returns !== undefined ? { returns: returns.replace('SETOF ', '').toUpperCase() } : {})
   };
}
