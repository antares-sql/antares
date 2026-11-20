import { Extension } from '@codemirror/state';

/**
 * Language support for an editor mode. Loaded on demand, so the parsers of
 * modes never used don't weigh on the initial bundle.
 */
export const loadLanguage = async (mode: string): Promise<Extension> => {
   switch (mode) {
      case 'html': {
         const { html } = await import(/* webpackChunkName: "cm-lang-html" */'@codemirror/lang-html');
         return html();
      }
      case 'xml':
      case 'svg': {
         const { xml } = await import(/* webpackChunkName: "cm-lang-xml" */'@codemirror/lang-xml');
         return xml();
      }
      case 'json': {
         const { json } = await import(/* webpackChunkName: "cm-lang-json" */'@codemirror/lang-json');
         return json();
      }
      case 'markdown': {
         const { markdown } = await import(/* webpackChunkName: "cm-lang-markdown" */'@codemirror/lang-markdown');
         return markdown();
      }
      case 'yaml': {
         const { yaml } = await import(/* webpackChunkName: "cm-lang-yaml" */'@codemirror/lang-yaml');
         return yaml();
      }
      case 'ini': {
         const [{ StreamLanguage }, { properties }] = await Promise.all([
            import('@codemirror/language'),
            import(/* webpackChunkName: "cm-lang-ini" */'@codemirror/legacy-modes/mode/properties')
         ]);
         return StreamLanguage.define(properties);
      }
      case 'sql':
      case 'mysql':
      case 'mariadb':
      case 'postgresql':
      case 'sqlite':
      case 'firebird': {
         const { getSqlDialect } = await import('./sql/dialects');
         return getSqlDialect(mode).dialect;
      }
      default:
         return [];
   }
};
