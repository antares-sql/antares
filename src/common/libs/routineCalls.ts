import customizations from 'common/customizations';
import { FLOAT, NUMBER } from 'common/fieldTypes';
import { ClientCode } from 'common/interfaces/antares';

import { escapeAndQuote } from './sqlUtils';

/** Fills a call template ({name}, {params}) from customizations */
const fill = (template: string, name: string, params: string[]) => template
   // Replacer functions: names may contain "$" (valid in PostgreSQL), which string replacements interpret
   .replaceAll('{name}', () => name)
   .replaceAll('{params}', () => params.join(','));

/** SQL that runs a stored procedure, e.g. CALL p(1,'a') / EXECUTE PROCEDURE "p"(1,'a') */
export const buildProcedureCall = (client: ClientCode, name: string, params: string[] = []) =>
   fill(customizations[client].procedureCall, name, params);

/** SQL that calls a function, e.g. SELECT `f` (1) / SELECT f(1) */
export const buildFunctionCall = (client: ClientCode, name: string, params: string[] = []) =>
   fill(customizations[client].functionCall, name, params);

/** A routine argument typed by the user: numbers as they are, anything else as a quoted string literal */
export const formatRoutineArgument = (client: ClientCode, type: string, value: string) =>
   [...NUMBER, ...FLOAT].includes(type) ? value : escapeAndQuote(String(value), client);
