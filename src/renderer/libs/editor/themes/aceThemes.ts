/* eslint-disable */
// Editor themes converted from the Ace editor themes (ace-builds 1.34) once, when Antares moved
// to CodeMirror: the conversion script is in the git history (scripts/convertAceThemes.js).
import { EditorThemeDefinition } from '../themeTypes';

export const aceThemes: EditorThemeDefinition[] = [
   {
      code: 'chrome',
      name: 'Chrome',
      dark: false,
      editor: {
         background: '#FFFFFF',
         foreground: 'black',
         cursor: 'black',
         selection: 'rgb(181, 213, 255)',
         gutterBackground: '#ebebeb',
         gutterForeground: '#333',
         gutterActiveLine: '#dcdcdc',
         activeLine: 'rgba(0, 0, 0, 0.07)',
         matchingBracket: 'rgb(192, 192, 192)',
         selectionMatch: 'rgb(200, 200, 250)',
         invisible: 'rgb(191, 191, 191)'
      },
      tokens: {
         keyword: {
            color: 'rgb(147, 15, 128)'
         },
         operator: {
            color: 'rgb(104, 118, 135)'
         },
         type: {
            color: 'rgb(147, 15, 128)'
         },
         builtin: {
            color: 'rgb(60, 76, 114)'
         },
         number: {
            color: 'rgb(0, 0, 205)'
         },
         atom: {
            color: 'rgb(88, 92, 246)'
         },
         string: {
            color: '#1A1AA6'
         },
         regexp: {
            color: '#1A1AA6'
         },
         comment: {
            color: '#236e24'
         },
         variable: {
            color: 'rgb(49, 132, 149)'
         },
         property: {
            color: 'rgb(49, 132, 149)'
         },
         tag: {
            color: 'rgb(147, 15, 128)'
         },
         attribute: {
            color: '#994409'
         },
         attributeValue: {
            color: '#1A1AA6'
         },
         tagPunctuation: {
            color: 'rgb(147, 15, 128)'
         },
         heading: {
            color: 'rgb(12, 7, 255)'
         },
         emphasis: {
            color: '#1A1AA6'
         },
         strong: {
            color: '#1A1AA6'
         },
         list: {
            color: 'rgb(185, 6, 144)'
         },
         quote: {
            color: '#1A1AA6'
         },
         monospace: {
            color: 'rgb(60, 76, 114)'
         },
         meta: {
            color: 'rgb(104, 104, 91)'
         },
         invalid: {
            color: 'white',
            backgroundColor: 'rgb(153, 0, 0)'
         }
      }
   },
   {
      code: 'clouds',
      name: 'Clouds',
      dark: false,
      editor: {
         background: '#FFFFFF',
         foreground: '#000000',
         cursor: '#000000',
         selection: '#BDD5FC',
         gutterBackground: '#ebebeb',
         gutterForeground: '#333',
         gutterActiveLine: '#dcdcdc',
         activeLine: 'rgba(255, 234, 13, 0.19)',
         matchingBracket: '#BFBFBF',
         selectionMatch: '#BDD5FC',
         invisible: '#BFBFBF'
      },
      tokens: {
         keyword: {
            color: '#AF956F'
         },
         operator: {
            color: '#484848'
         },
         type: {
            color: '#C52727'
         },
         builtin: {
            color: '#C52727'
         },
         number: {
            color: '#46A609'
         },
         atom: {
            color: '#39946A'
         },
         string: {
            color: '#5D90CD'
         },
         regexp: {
            color: '#5D90CD'
         },
         comment: {
            color: '#BCC8BA'
         },
         tag: {
            color: '#AF956F'
         },
         attribute: {
            color: '#606060'
         },
         attributeValue: {
            color: '#5D90CD'
         },
         tagPunctuation: {
            color: '#AF956F'
         },
         emphasis: {
            color: '#5D90CD'
         },
         strong: {
            color: '#5D90CD'
         },
         quote: {
            color: '#5D90CD'
         },
         monospace: {
            color: '#C52727'
         },
         invalid: {
            backgroundColor: '#FF002A'
         }
      }
   },
   {
      code: 'crimson_editor',
      name: 'Crimson Editor',
      dark: false,
      editor: {
         background: '#FFFFFF',
         foreground: 'rgb(64, 64, 64)',
         cursor: 'black',
         selection: 'rgb(181, 213, 255)',
         gutterBackground: '#ebebeb',
         gutterForeground: '#333',
         gutterActiveLine: '#dcdcdc',
         activeLine: 'rgba(25, 125, 245, 0.10)',
         matchingBracket: 'rgb(192, 192, 192)',
         selectionMatch: 'rgb(200, 200, 250)',
         invisible: 'rgb(191, 191, 191)'
      },
      tokens: {
         keyword: {
            color: 'blue'
         },
         operator: {
            color: 'rgb(49, 132, 149)'
         },
         builtin: {
            color: 'rgb(192, 0, 0)'
         },
         number: {
            color: 'rgb(0, 0, 64)'
         },
         atom: {
            color: 'rgb(255, 156, 0)'
         },
         string: {
            color: 'rgb(128, 0, 128)'
         },
         regexp: {
            color: 'rgb(128, 0, 128)'
         },
         comment: {
            color: 'rgb(76, 136, 107)'
         },
         variable: {
            color: 'rgb(0, 64, 128)'
         },
         property: {
            color: 'rgb(0, 64, 128)'
         },
         tag: {
            color: 'rgb(28, 2, 255)'
         },
         attributeValue: {
            color: 'rgb(128, 0, 128)'
         },
         tagPunctuation: {
            color: 'rgb(28, 2, 255)'
         },
         emphasis: {
            color: 'rgb(128, 0, 128)'
         },
         strong: {
            color: 'rgb(128, 0, 128)'
         },
         quote: {
            color: 'rgb(128, 0, 128)'
         },
         monospace: {
            color: 'rgb(192, 0, 0)'
         },
         meta: {
            color: 'rgb(104, 104, 91)'
         },
         invalid: {
            color: 'rgb(224, 0, 0)',
            textDecoration: 'line-through'
         }
      }
   },
   {
      code: 'dawn',
      name: 'Dawn',
      dark: false,
      editor: {
         background: '#F9F9F9',
         foreground: '#080808',
         cursor: '#000000',
         selection: 'rgba(39, 95, 255, 0.30)',
         gutterBackground: '#ebebeb',
         gutterForeground: '#333',
         gutterActiveLine: '#dcdcdc',
         activeLine: 'rgba(36, 99, 180, 0.12)',
         matchingBracket: 'rgba(75, 75, 126, 0.50)',
         selectionMatch: 'rgba(39, 95, 255, 0.30)',
         invisible: 'rgba(75, 75, 126, 0.50)'
      },
      tokens: {
         keyword: {
            color: '#794938'
         },
         operator: {
            color: '#794938'
         },
         type: {
            color: '#A71D5D',
            fontStyle: 'italic'
         },
         builtin: {
            color: '#693A17'
         },
         number: {
            color: '#811F24'
         },
         atom: {
            color: '#811F24'
         },
         string: {
            color: '#0B6125'
         },
         regexp: {
            color: '#CF5628'
         },
         comment: {
            color: '#5A525F',
            fontStyle: 'italic'
         },
         variable: {
            color: '#234A97'
         },
         property: {
            color: '#234A97'
         },
         tag: {
            color: '#794938'
         },
         attributeValue: {
            color: '#0B6125'
         },
         tagPunctuation: {
            color: '#794938'
         },
         heading: {
            color: '#19356D'
         },
         emphasis: {
            color: '#0B6125'
         },
         strong: {
            color: '#0B6125'
         },
         list: {
            color: '#693A17'
         },
         quote: {
            color: '#0B6125'
         },
         monospace: {
            color: '#693A17'
         }
      }
   },
   {
      code: 'dreamweaver',
      name: 'Dreamweaver',
      dark: false,
      editor: {
         background: '#FFFFFF',
         foreground: 'black',
         cursor: 'black',
         selection: 'rgb(181, 213, 255)',
         gutterBackground: '#e8e8e8',
         gutterForeground: '#333',
         gutterActiveLine: '#DCDCDC',
         activeLine: 'rgba(0, 0, 0, 0.07)',
         matchingBracket: 'rgb(192, 192, 192)',
         selectionMatch: 'rgb(200, 200, 250)',
         invisible: 'rgb(191, 191, 191)'
      },
      tokens: {
         keyword: {
            color: 'blue'
         },
         operator: {
            color: 'rgb(104, 118, 135)'
         },
         type: {
            color: 'blue'
         },
         builtin: {
            color: 'rgb(60, 76, 114)'
         },
         number: {
            color: 'rgb(0, 0, 205)'
         },
         atom: {
            color: 'rgb(88, 92, 246)'
         },
         string: {
            color: '#00F'
         },
         regexp: {
            color: '#00F'
         },
         comment: {
            color: 'rgb(76, 136, 107)'
         },
         variable: {
            color: '#06F'
         },
         property: {
            color: '#06F'
         },
         tag: {
            color: '#009'
         },
         attributeValue: {
            color: '#00F'
         },
         tagPunctuation: {
            color: '#009'
         },
         heading: {
            color: 'rgb(12, 7, 255)'
         },
         emphasis: {
            color: '#00F'
         },
         strong: {
            color: '#00F'
         },
         list: {
            color: 'rgb(185, 6, 144)'
         },
         quote: {
            color: '#00F'
         },
         monospace: {
            color: 'rgb(60, 76, 114)'
         },
         meta: {
            color: 'rgb(104, 104, 91)'
         },
         invalid: {
            color: 'white',
            backgroundColor: 'rgb(153, 0, 0)'
         }
      }
   },
   {
      code: 'eclipse',
      name: 'Eclipse',
      dark: false,
      editor: {
         background: '#FFFFFF',
         foreground: 'black',
         cursor: 'black',
         selection: 'rgb(181, 213, 255)',
         gutterBackground: '#ebebeb',
         gutterForeground: 'rgb(136, 136, 136)',
         gutterActiveLine: '#DADADA',
         activeLine: 'rgba(25, 125, 245, 0.10)',
         matchingBracket: 'rgb(192, 192, 192)',
         selectionMatch: 'rgb(181, 213, 255)',
         invisible: '#ddd'
      },
      tokens: {
         keyword: {
            color: 'rgb(127, 0, 85)'
         },
         operator: {
            color: 'rgb(127, 0, 85)'
         },
         type: {
            color: 'rgb(127, 0, 127)'
         },
         builtin: {
            color: 'rgb(60, 76, 114)'
         },
         number: {
            color: 'darkblue'
         },
         string: {
            color: 'rgb(42, 0, 255)'
         },
         regexp: {
            color: 'rgb(42, 0, 255)'
         },
         comment: {
            color: 'rgb(113, 150, 130)'
         },
         variable: {
            color: 'rgb(127, 0, 85)'
         },
         property: {
            color: 'rgb(127, 0, 85)'
         },
         tag: {
            color: 'rgb(25, 118, 116)'
         },
         attribute: {
            color: 'rgb(127, 0, 127)'
         },
         attributeValue: {
            color: 'rgb(42, 0, 255)'
         },
         tagPunctuation: {
            color: 'rgb(25, 118, 116)'
         },
         emphasis: {
            color: 'rgb(42, 0, 255)'
         },
         strong: {
            color: 'rgb(42, 0, 255)'
         },
         quote: {
            color: 'rgb(42, 0, 255)'
         },
         monospace: {
            color: 'rgb(60, 76, 114)'
         },
         meta: {
            color: 'rgb(104, 104, 91)'
         }
      }
   },
   {
      code: 'github',
      name: 'GitHub',
      dark: false,
      editor: {
         background: '#fff',
         foreground: '#000',
         cursor: 'black',
         selection: 'rgb(181, 213, 255)',
         gutterBackground: '#e8e8e8',
         gutterForeground: '#AAA',
         gutterActiveLine: 'rgba(0, 0, 0, 0.07)',
         activeLine: 'rgba(5, 5, 5, 0.04)',
         matchingBracket: 'rgb(192, 192, 192)',
         selectionMatch: 'rgb(200, 200, 250)',
         invisible: '#BFBFBF'
      },
      tokens: {
         keyword: {
            fontWeight: 'bold'
         },
         operator: {
            fontWeight: 'bold'
         },
         builtin: {
            color: '#0086B3'
         },
         number: {
            color: '#099'
         },
         atom: {
            fontWeight: 'bold'
         },
         string: {
            color: '#D14'
         },
         regexp: {
            color: '#009926',
            fontWeight: 'normal'
         },
         comment: {
            color: '#998',
            fontStyle: 'italic'
         },
         punctuation: {
            fontWeight: 'bold'
         },
         attributeValue: {
            color: '#D14'
         },
         emphasis: {
            color: '#D14'
         },
         strong: {
            color: '#D14'
         },
         quote: {
            color: '#D14'
         },
         monospace: {
            color: '#0086B3'
         }
      }
   },
   {
      code: 'iplastic',
      name: 'IPlastic',
      dark: false,
      editor: {
         background: '#eeeeee',
         foreground: '#333333',
         cursor: '#333',
         selection: '#BAD6FD',
         gutterBackground: '#dddddd',
         gutterForeground: '#666666',
         gutterActiveLine: '#eeeeee',
         activeLine: 'rgba(13, 13, 13, 0.04)',
         matchingBracket: '#49483E',
         selectionMatch: '#555555',
         invisible: '#999999'
      },
      tokens: {
         keyword: {
            color: '#0000FF'
         },
         operator: {
            color: '#0000FF'
         },
         type: {
            color: '#3333fc',
            fontWeight: '700'
         },
         builtin: {
            color: '#333333',
            fontWeight: '700'
         },
         number: {
            color: '#0066FF',
            fontWeight: '100'
         },
         atom: {
            color: '#0066FF',
            fontWeight: '700'
         },
         string: {
            color: '#a55f03'
         },
         regexp: {
            color: '#a55f03'
         },
         comment: {
            color: '#777777',
            fontStyle: 'italic'
         },
         variable: {
            color: '#3366cc',
            fontStyle: 'italic'
         },
         property: {
            color: '#3366cc',
            fontStyle: 'italic'
         },
         tag: {
            color: '#0000FF'
         },
         attribute: {
            color: '#3366cc',
            fontStyle: 'italic'
         },
         attributeValue: {
            color: '#a55f03'
         },
         tagPunctuation: {
            color: '#000'
         },
         emphasis: {
            color: '#a55f03'
         },
         strong: {
            color: '#a55f03'
         },
         quote: {
            color: '#a55f03'
         },
         monospace: {
            color: '#333333',
            fontWeight: '700'
         },
         invalid: {
            color: '#F8F8F0',
            backgroundColor: '#F92672'
         }
      }
   },
   {
      code: 'solarized_light',
      name: 'Solarized Light',
      dark: false,
      editor: {
         background: '#FDF6E3',
         foreground: '#586E75',
         cursor: '#000000',
         selection: 'rgba(7, 54, 67, 0.09)',
         gutterBackground: '#fbf1d3',
         gutterForeground: '#333',
         gutterActiveLine: '#EDE5C1',
         activeLine: 'rgba(39, 46, 27, 0.07)',
         matchingBracket: 'rgba(147, 161, 161, 0.50)',
         selectionMatch: '#7f9390',
         invisible: 'rgba(147, 161, 161, 0.50)'
      },
      tokens: {
         keyword: {
            color: '#859900'
         },
         operator: {
            color: '#859900'
         },
         type: {
            color: '#073642'
         },
         builtin: {
            color: '#268BD2'
         },
         number: {
            color: '#D33682'
         },
         atom: {
            color: '#B58900'
         },
         string: {
            color: '#2AA198'
         },
         regexp: {
            color: '#D30102'
         },
         comment: {
            color: '#93A1A1'
         },
         variable: {
            color: '#268BD2'
         },
         property: {
            color: '#268BD2'
         },
         tag: {
            color: '#859900'
         },
         attribute: {
            color: '#93A1A1'
         },
         attributeValue: {
            color: '#2AA198'
         },
         tagPunctuation: {
            color: '#859900'
         },
         emphasis: {
            color: '#2AA198'
         },
         strong: {
            color: '#2AA198'
         },
         quote: {
            color: '#2AA198'
         },
         monospace: {
            color: '#268BD2'
         }
      }
   },
   {
      code: 'textmate',
      name: 'TextMate',
      dark: false,
      editor: {
         background: '#FFFFFF',
         foreground: 'black',
         cursor: 'black',
         selection: 'rgb(181, 213, 255)',
         gutterBackground: '#f0f0f0',
         gutterForeground: '#333',
         gutterActiveLine: '#dcdcdc',
         activeLine: 'rgba(0, 0, 0, 0.07)',
         matchingBracket: 'rgb(192, 192, 192)',
         selectionMatch: 'rgb(200, 200, 250)',
         invisible: 'rgb(191, 191, 191)'
      },
      tokens: {
         keyword: {
            color: 'blue'
         },
         operator: {
            color: 'rgb(104, 118, 135)'
         },
         type: {
            color: 'blue'
         },
         builtin: {
            color: 'rgb(60, 76, 114)'
         },
         number: {
            color: 'rgb(0, 0, 205)'
         },
         atom: {
            color: 'rgb(88, 92, 246)'
         },
         string: {
            color: 'rgb(3, 106, 7)'
         },
         regexp: {
            color: 'rgb(3, 106, 7)'
         },
         comment: {
            color: 'rgb(76, 136, 107)'
         },
         variable: {
            color: 'rgb(49, 132, 149)'
         },
         property: {
            color: 'rgb(49, 132, 149)'
         },
         tag: {
            color: 'rgb(0, 22, 142)'
         },
         attributeValue: {
            color: 'rgb(3, 106, 7)'
         },
         tagPunctuation: {
            color: 'rgb(0, 22, 142)'
         },
         heading: {
            color: 'rgb(12, 7, 255)'
         },
         emphasis: {
            color: 'rgb(3, 106, 7)'
         },
         strong: {
            color: 'rgb(3, 106, 7)'
         },
         list: {
            color: 'rgb(185, 6, 144)'
         },
         quote: {
            color: 'rgb(3, 106, 7)'
         },
         monospace: {
            color: 'rgb(60, 76, 114)'
         },
         meta: {
            color: 'rgb(104, 104, 91)'
         },
         invalid: {
            color: 'red',
            backgroundColor: 'rgba(255, 0, 0, 0.1)'
         }
      }
   },
   {
      code: 'tomorrow',
      name: 'Tomorrow',
      dark: false,
      editor: {
         background: '#FFFFFF',
         foreground: '#4D4D4C',
         cursor: '#AEAFAD',
         selection: '#D6D6D6',
         gutterBackground: '#f6f6f6',
         gutterForeground: '#4D4D4C',
         gutterActiveLine: '#dcdcdc',
         activeLine: 'rgba(26, 26, 26, 0.07)',
         matchingBracket: '#D1D1D1',
         selectionMatch: '#D6D6D6',
         invisible: '#D1D1D1'
      },
      tokens: {
         keyword: {
            color: '#8959A8'
         },
         operator: {
            color: '#3E999F'
         },
         type: {
            color: '#8959A8'
         },
         builtin: {
            color: '#4271AE'
         },
         number: {
            color: '#F5871F'
         },
         atom: {
            color: '#F5871F'
         },
         string: {
            color: '#718C00'
         },
         regexp: {
            color: '#C82829'
         },
         comment: {
            color: '#8E908C'
         },
         variable: {
            color: '#C82829'
         },
         property: {
            color: '#C82829'
         },
         tag: {
            color: '#C82829'
         },
         attribute: {
            color: '#C82829'
         },
         attributeValue: {
            color: '#718C00'
         },
         tagPunctuation: {
            color: '#C82829'
         },
         heading: {
            color: '#718C00'
         },
         emphasis: {
            color: '#718C00'
         },
         strong: {
            color: '#718C00'
         },
         quote: {
            color: '#718C00'
         },
         monospace: {
            color: '#4271AE'
         },
         invalid: {
            color: '#FFFFFF',
            backgroundColor: '#C82829'
         }
      }
   },
   {
      code: 'xcode',
      name: 'Xcode',
      dark: false,
      editor: {
         background: '#FFFFFF',
         foreground: '#000000',
         cursor: '#000000',
         selection: '#B5D5FF',
         gutterBackground: '#e8e8e8',
         gutterForeground: '#333',
         gutterActiveLine: 'rgba(0, 0, 0, 0.071)',
         activeLine: 'rgba(0, 0, 0, 0.071)',
         matchingBracket: '#BFBFBF',
         selectionMatch: '#B5D5FF',
         invisible: '#BFBFBF'
      },
      tokens: {
         keyword: {
            color: '#C800A4'
         },
         operator: {
            color: '#C800A4'
         },
         type: {
            color: '#C900A4'
         },
         builtin: {
            color: '#450084'
         },
         number: {
            color: '#3A00DC'
         },
         atom: {
            color: '#C800A4'
         },
         string: {
            color: '#DF0002'
         },
         regexp: {
            color: '#DF0002'
         },
         comment: {
            color: '#008E00'
         },
         tag: {
            color: '#C800A4'
         },
         attribute: {
            color: '#450084'
         },
         attributeValue: {
            color: '#DF0002'
         },
         tagPunctuation: {
            color: '#C800A4'
         },
         emphasis: {
            color: '#DF0002'
         },
         strong: {
            color: '#DF0002'
         },
         quote: {
            color: '#DF0002'
         },
         monospace: {
            color: '#450084'
         }
      }
   },
   {
      code: 'kuroir',
      name: 'Kuroir',
      dark: false,
      editor: {
         background: '#E8E9E8',
         foreground: '#363636',
         cursor: '#202020',
         selection: 'rgba(245, 170, 0, 0.57)',
         gutterBackground: '#e8e8e8',
         gutterForeground: '#333',
         gutterActiveLine: 'rgba(203, 220, 47, 0.22)',
         activeLine: 'rgba(203, 220, 47, 0.22)',
         matchingBracket: 'rgba(0, 0, 0, 0.29)',
         selectionMatch: 'rgba(245, 170, 0, 0.57)',
         invisible: '#BFBFBF'
      },
      tokens: {
         type: {
            color: '#A52A2A'
         },
         builtin: {
            color: '#005273'
         },
         number: {
            color: '#9A5925'
         },
         atom: {
            color: '#CD6839'
         },
         string: {
            color: '#639300'
         },
         regexp: {
            color: '#417E00',
            backgroundColor: '#C9D4BE'
         },
         comment: {
            color: 'rgba(148, 148, 148, 0.91)',
            backgroundColor: 'rgba(220, 220, 220, 0.56)'
         },
         variable: {
            color: '#009ACD'
         },
         property: {
            color: '#009ACD'
         },
         tag: {
            color: '#005273'
         },
         attributeValue: {
            color: '#639300'
         },
         tagPunctuation: {
            color: '#005273'
         },
         heading: {
            color: '#B8012D',
            backgroundColor: 'rgba(191, 97, 51, 0.051)'
         },
         emphasis: {
            color: '#639300'
         },
         strong: {
            color: '#639300'
         },
         list: {
            color: '#8F5B26'
         },
         quote: {
            color: '#639300'
         },
         monospace: {
            color: '#005273'
         }
      }
   },
   {
      code: 'katzenmilch',
      name: 'KatzenMilch',
      dark: false,
      editor: {
         background: '#f3f2f3',
         foreground: 'rgba(15, 0, 9, 1.0)',
         cursor: '#100011',
         selection: 'rgba(100, 5, 208, 0.27)',
         gutterBackground: '#e8e8e8',
         gutterForeground: '#333',
         gutterActiveLine: 'rgb(232, 242, 254)',
         activeLine: 'rgba(231, 242, 255, 0.88)',
         matchingBracket: 'rgba(0, 0, 0, 0.33)',
         selectionMatch: 'rgba(100, 5, 208, 0.27)',
         invisible: '#BFBFBF'
      },
      tokens: {
         keyword: {
            color: '#674Aa8'
         },
         operator: {
            color: '#674Aa8'
         },
         type: {
            color: 'rgba(123, 92, 191, 1.0)'
         },
         builtin: {
            color: '#9D7e62'
         },
         number: {
            color: 'rgba(79, 130, 123, 0.93)'
         },
         atom: {
            color: '#7D7e52'
         },
         string: {
            color: '#5a5f9b'
         },
         regexp: {
            color: '#5a5f9b'
         },
         comment: {
            color: 'rgba(64, 79, 80, 0.67)',
            fontStyle: 'italic'
         },
         variable: {
            color: 'rgba(2, 95, 73, 0.97)'
         },
         property: {
            color: 'rgba(2, 95, 73, 0.97)'
         },
         attribute: {
            color: 'rgba(73, 70, 194, 0.93)'
         },
         attributeValue: {
            color: '#5a5f9b'
         },
         emphasis: {
            color: '#5a5f9b'
         },
         strong: {
            color: '#5a5f9b'
         },
         quote: {
            color: '#5a5f9b'
         },
         monospace: {
            color: '#9D7e62'
         },
         invalid: {
            color: '#DFDFD5'
         }
      }
   },
   {
      code: 'sqlserver',
      name: 'SQL Server',
      dark: false,
      editor: {
         background: '#FFFFFF',
         foreground: 'black',
         cursor: 'black',
         selection: 'rgb(181, 213, 255)',
         gutterBackground: '#ebebeb',
         gutterForeground: '#333',
         gutterActiveLine: '#dcdcdc',
         activeLine: 'rgba(0, 0, 0, 0.07)',
         matchingBracket: 'rgb(192, 192, 192)',
         selectionMatch: 'rgb(200, 200, 250)',
         invisible: 'rgb(191, 191, 191)'
      },
      tokens: {
         keyword: {
            color: '#0000FF'
         },
         operator: {
            color: '#808080'
         },
         type: {
            color: '#11B7BE'
         },
         builtin: {
            color: '#FF00FF'
         },
         number: {
            color: 'black'
         },
         atom: {
            color: '#979797'
         },
         string: {
            color: '#FF0000'
         },
         regexp: {
            color: '#FF0000'
         },
         comment: {
            color: '#008000'
         },
         variable: {
            color: 'rgb(49, 132, 149)'
         },
         property: {
            color: 'rgb(49, 132, 149)'
         },
         tag: {
            color: '#0000FF'
         },
         attribute: {
            color: '#994409'
         },
         attributeValue: {
            color: '#FF0000'
         },
         tagPunctuation: {
            color: '#0000FF'
         },
         heading: {
            color: 'rgb(12, 7, 255)'
         },
         emphasis: {
            color: '#FF0000'
         },
         strong: {
            color: '#FF0000'
         },
         list: {
            color: 'rgb(185, 6, 144)'
         },
         quote: {
            color: '#FF0000'
         },
         monospace: {
            color: '#FF00FF'
         },
         meta: {
            color: 'rgb(104, 104, 91)'
         },
         invalid: {
            color: 'white',
            backgroundColor: 'rgb(153, 0, 0)'
         }
      }
   },
   {
      code: 'ambiance',
      name: 'Ambiance',
      dark: true,
      editor: {
         background: '#202020',
         foreground: '#E6E1DC',
         cursor: '#7991E8',
         selection: 'rgba(221, 240, 255, 0.20)',
         gutterBackground: '#3d3d3d',
         gutterForeground: '#222',
         gutterActiveLine: '#3F3F3F',
         activeLine: 'rgba(255, 255, 255, 0.031)',
         matchingBracket: 'rgba(255, 255, 255, 0.25)',
         selectionMatch: '#3f475d',
         invisible: '#333'
      },
      tokens: {
         keyword: {
            color: '#cda869'
         },
         operator: {
            color: '#fa8d6a'
         },
         type: {
            color: '#aac6e3'
         },
         builtin: {
            color: '#DAD085'
         },
         number: {
            color: '#78CF8A'
         },
         atom: {
            color: '#CF7EA9'
         },
         string: {
            color: '#8f9d6a'
         },
         regexp: {
            color: '#DAD085'
         },
         comment: {
            color: '#555',
            fontStyle: 'italic'
         },
         variable: {
            color: '#9999cc'
         },
         property: {
            color: '#9999cc'
         },
         punctuation: {
            color: '#24C2C7'
         },
         attributeValue: {
            color: '#8f9d6a'
         },
         emphasis: {
            color: '#8f9d6a'
         },
         strong: {
            color: '#8f9d6a'
         },
         quote: {
            color: '#8f9d6a'
         },
         monospace: {
            color: '#DAD085'
         },
         meta: {
            color: '#494949'
         },
         invalid: {
            textDecoration: 'underline',
            color: '#D2A8A1',
            fontStyle: 'italic'
         }
      }
   },
   {
      code: 'chaos',
      name: 'Chaos',
      dark: true,
      editor: {
         background: '#161616',
         foreground: '#E6E1DC',
         cursor: '#FFFFFF',
         selection: '#494836',
         gutterBackground: '#141414',
         gutterForeground: '#595959',
         gutterActiveLine: '#222',
         activeLine: 'rgba(245, 245, 245, 0.13)',
         matchingBracket: '#FCE94F',
         invisible: '#404040'
      },
      tokens: {
         keyword: {
            color: '#00698F'
         },
         operator: {
            color: '#FF308F'
         },
         builtin: {
            color: '#00AEEF'
         },
         number: {
            color: '#58C554'
         },
         atom: {
            color: '#FDC251'
         },
         string: {
            color: '#58C554'
         },
         regexp: {
            color: '#58C554'
         },
         comment: {
            color: '#555',
            fontStyle: 'italic'
         },
         variable: {
            color: '#997744'
         },
         property: {
            color: '#997744'
         },
         tag: {
            color: '#BE53E6'
         },
         attribute: {
            color: '#FFFF89'
         },
         attributeValue: {
            color: '#58C554'
         },
         tagPunctuation: {
            color: '#BE53E6'
         },
         emphasis: {
            color: '#58C554'
         },
         strong: {
            color: '#58C554'
         },
         link: {
            textDecoration: 'underline'
         },
         quote: {
            color: '#58C554'
         },
         monospace: {
            color: '#00AEEF'
         },
         invalid: {
            color: '#FFFFFF',
            backgroundColor: '#990000'
         }
      }
   },
   {
      code: 'clouds_midnight',
      name: 'Clouds Midnight',
      dark: true,
      editor: {
         background: '#191919',
         foreground: '#929292',
         cursor: '#7DA5DC',
         selection: '#000000',
         gutterBackground: '#232323',
         gutterForeground: '#929292',
         gutterActiveLine: 'rgba(215, 215, 215, 0.031)',
         activeLine: 'rgba(215, 215, 215, 0.031)',
         matchingBracket: '#BFBFBF',
         selectionMatch: '#000000',
         invisible: '#666'
      },
      tokens: {
         keyword: {
            color: '#927C5D'
         },
         operator: {
            color: '#4B4B4B'
         },
         type: {
            color: '#E92E2E'
         },
         builtin: {
            color: '#E92E2E'
         },
         number: {
            color: '#46A609'
         },
         atom: {
            color: '#39946A'
         },
         string: {
            color: '#5D90CD'
         },
         regexp: {
            color: '#5D90CD'
         },
         comment: {
            color: '#3C403B'
         },
         tag: {
            color: '#927C5D'
         },
         attribute: {
            color: '#606060'
         },
         attributeValue: {
            color: '#5D90CD'
         },
         tagPunctuation: {
            color: '#927C5D'
         },
         emphasis: {
            color: '#5D90CD'
         },
         strong: {
            color: '#5D90CD'
         },
         quote: {
            color: '#5D90CD'
         },
         monospace: {
            color: '#E92E2E'
         },
         invalid: {
            color: '#FFFFFF',
            backgroundColor: '#E92E2E'
         }
      }
   },
   {
      code: 'dracula',
      name: 'Dracula',
      dark: true,
      editor: {
         background: '#282a36',
         foreground: '#f8f8f2',
         cursor: '#f8f8f0',
         selection: '#44475a',
         gutterBackground: '#282a36',
         gutterForeground: 'rgb(144,145,148)',
         gutterActiveLine: '#44475a',
         activeLine: 'rgba(196, 203, 254, 0.18)',
         matchingBracket: '#a29709',
         invisible: '#626680'
      },
      tokens: {
         keyword: {
            color: '#ff79c6'
         },
         operator: {
            color: '#ff79c6'
         },
         type: {
            color: '#8be9fd',
            fontStyle: 'italic'
         },
         builtin: {
            color: '#8be9fd'
         },
         number: {
            color: '#bd93f9'
         },
         atom: {
            color: '#bd93f9'
         },
         string: {
            color: '#f1fa8c'
         },
         regexp: {
            color: '#f1fa8c'
         },
         comment: {
            color: '#6272a4'
         },
         variable: {
            color: '#50fa7b'
         },
         property: {
            color: '#50fa7b'
         },
         attribute: {
            color: '#50fa7b'
         },
         attributeValue: {
            color: '#f1fa8c'
         },
         emphasis: {
            color: '#f1fa8c'
         },
         strong: {
            color: '#f1fa8c'
         },
         quote: {
            color: '#f1fa8c'
         },
         monospace: {
            color: '#8be9fd'
         },
         invalid: {
            color: '#F8F8F0',
            backgroundColor: '#ff79c6'
         }
      }
   },
   {
      code: 'cobalt',
      name: 'Cobalt',
      dark: true,
      editor: {
         background: '#002240',
         foreground: '#FFFFFF',
         cursor: '#FFFFFF',
         selection: 'rgba(179, 101, 57, 0.75)',
         gutterBackground: '#011e3a',
         gutterForeground: 'rgb(128,145,160)',
         gutterActiveLine: 'rgba(0, 0, 0, 0.35)',
         activeLine: 'rgba(0, 0, 0, 0.35)',
         matchingBracket: 'rgba(255, 255, 255, 0.15)',
         selectionMatch: 'rgba(179, 101, 57, 0.75)',
         invisible: 'rgba(255, 255, 255, 0.15)'
      },
      tokens: {
         keyword: {
            color: '#FF9D00'
         },
         operator: {
            color: '#FF9D00'
         },
         type: {
            color: '#FFEE80'
         },
         builtin: {
            color: '#FFB054'
         },
         number: {
            color: '#FF628C'
         },
         atom: {
            color: '#FF628C'
         },
         string: {
            color: '#3AD900'
         },
         regexp: {
            color: '#80FFC2'
         },
         comment: {
            color: '#0088FF',
            fontStyle: 'italic'
         },
         variable: {
            color: '#CCCCCC'
         },
         property: {
            color: '#CCCCCC'
         },
         tag: {
            color: '#9EFFFF'
         },
         attribute: {
            color: '#FFDD00'
         },
         attributeValue: {
            color: '#3AD900'
         },
         tagPunctuation: {
            color: '#9EFFFF'
         },
         heading: {
            color: '#C8E4FD',
            backgroundColor: '#001221'
         },
         emphasis: {
            color: '#3AD900'
         },
         strong: {
            color: '#3AD900'
         },
         list: {
            backgroundColor: '#130D26'
         },
         quote: {
            color: '#3AD900'
         },
         monospace: {
            color: '#FFB054'
         },
         invalid: {
            color: '#F8F8F8',
            backgroundColor: '#800F00'
         }
      }
   },
   {
      code: 'gruvbox',
      name: 'Gruvbox',
      dark: true,
      editor: {
         background: '#1D2021',
         foreground: '#EBDAB4',
         cursor: '#EBDAB4',
         selection: 'rgba(179, 101, 57, 0.75)',
         gutterBackground: '#1D2021',
         gutterForeground: '#EBDAB4',
         gutterActiveLine: '#3C3836',
         activeLine: 'rgba(250, 203, 183, 0.14)',
         selectionMatch: '#3f475d',
         invisible: '#504945'
      },
      tokens: {
         keyword: {
            color: '#8ec07c'
         },
         operator: {
            color: '#EBDAB4'
         },
         type: {
            color: '#8FBF7F'
         },
         builtin: {
            color: '#F84B3C'
         },
         number: {
            color: '#C2859A'
         },
         atom: {
            color: '#C2859A'
         },
         string: {
            color: '#B8BA37'
         },
         regexp: {
            color: '#B8BA37'
         },
         comment: {
            color: '#928375',
            fontStyle: 'italic'
         },
         variable: {
            color: '#84A598'
         },
         property: {
            color: '#84A598'
         },
         attributeValue: {
            color: '#B8BA37'
         },
         emphasis: {
            color: '#B8BA37'
         },
         strong: {
            color: '#B8BA37'
         },
         quote: {
            color: '#B8BA37'
         },
         monospace: {
            color: '#F84B3C'
         }
      }
   },
   {
      code: 'gob',
      name: 'Green on Black',
      dark: true,
      editor: {
         background: '#0B0B0B',
         foreground: '#00FF00',
         cursor: '#00FF00',
         selection: 'rgba(221, 240, 255, 0.20)',
         gutterBackground: '#0B1818',
         gutterForeground: '#03EE03',
         gutterActiveLine: 'rgba(255, 255, 255, 0.04)',
         activeLine: 'rgba(255, 255, 255, 0.04)',
         matchingBracket: 'rgba(64, 255, 255, 0.25)',
         selectionMatch: 'rgba(192, 240, 255, 0.20)',
         invisible: 'rgba(255, 255, 255, 0.25)'
      },
      tokens: {
         keyword: {
            color: '#10D8E8'
         },
         operator: {
            color: '#10D8E8'
         },
         type: {
            color: '#10FF98'
         },
         builtin: {
            color: '#00F800'
         },
         number: {
            color: '#10F0A0'
         },
         atom: {
            color: '#10F0A0'
         },
         string: {
            color: '#10F060'
         },
         regexp: {
            color: '#20F090'
         },
         comment: {
            color: '#00E060',
            fontStyle: 'italic'
         },
         variable: {
            color: '#00F888'
         },
         property: {
            color: '#00F888'
         },
         tag: {
            color: '#00F868'
         },
         attributeValue: {
            color: '#10F060'
         },
         tagPunctuation: {
            color: '#00F868'
         },
         heading: {
            color: '#10F0A0'
         },
         emphasis: {
            color: '#10F060'
         },
         strong: {
            color: '#10F060'
         },
         list: {
            color: '#10FF98'
         },
         quote: {
            color: '#10F060'
         },
         monospace: {
            color: '#00F800'
         },
         meta: {
            color: '#488858'
         }
      }
   },
   {
      code: 'idle_fingers',
      name: 'Idle Fingers',
      dark: true,
      editor: {
         background: '#323232',
         foreground: '#FFFFFF',
         cursor: '#91FF00',
         selection: 'rgba(90, 100, 126, 0.88)',
         gutterBackground: '#3b3b3b',
         gutterForeground: 'rgb(153,153,153)',
         gutterActiveLine: '#353637',
         activeLine: 'rgba(150, 183, 217, 0.03)',
         matchingBracket: '#404040',
         selectionMatch: 'rgba(90, 100, 126, 0.88)',
         invisible: '#404040'
      },
      tokens: {
         keyword: {
            color: '#CC7833'
         },
         operator: {
            color: '#CC7833'
         },
         builtin: {
            color: '#B83426'
         },
         number: {
            color: '#6C99BB'
         },
         atom: {
            color: '#6C99BB'
         },
         string: {
            color: '#A5C261'
         },
         regexp: {
            color: '#CCCC33'
         },
         comment: {
            color: '#BC9458',
            fontStyle: 'italic'
         },
         tag: {
            color: '#FFE5BB'
         },
         attributeValue: {
            color: '#A5C261'
         },
         tagPunctuation: {
            color: '#FFE5BB'
         },
         emphasis: {
            color: '#A5C261'
         },
         strong: {
            color: '#A5C261'
         },
         quote: {
            color: '#A5C261'
         },
         monospace: {
            color: '#B83426'
         },
         invalid: {
            color: '#FFFFFF',
            backgroundColor: '#FF0000'
         }
      }
   },
   {
      code: 'kr_theme',
      name: 'krTheme',
      dark: true,
      editor: {
         background: '#0B0A09',
         foreground: '#FCFFE0',
         cursor: '#FF9900',
         selection: 'rgba(170, 0, 255, 0.45)',
         gutterBackground: '#1c1917',
         gutterForeground: '#FCFFE0',
         gutterActiveLine: '#38403D',
         activeLine: 'rgba(216, 255, 245, 0.22)',
         matchingBracket: 'rgba(255, 177, 111, 0.32)',
         selectionMatch: 'rgba(170, 0, 255, 0.45)',
         invisible: 'rgba(255, 177, 111, 0.32)'
      },
      tokens: {
         keyword: {
            color: '#949C8B'
         },
         operator: {
            color: '#949C8B'
         },
         type: {
            color: '#FFEE80'
         },
         builtin: {
            color: '#85873A'
         },
         number: {
            color: 'rgba(210, 117, 24, 0.76)'
         },
         atom: {
            color: 'rgba(210, 117, 24, 0.76)'
         },
         string: {
            color: 'rgba(164, 161, 181, 0.8)'
         },
         regexp: {
            color: 'rgba(125, 255, 192, 0.65)'
         },
         comment: {
            color: '#706D5B',
            fontStyle: 'italic'
         },
         variable: {
            color: '#D1A796'
         },
         property: {
            color: '#D1A796'
         },
         tag: {
            color: '#BABD9C'
         },
         attributeValue: {
            color: 'rgba(164, 161, 181, 0.8)'
         },
         tagPunctuation: {
            color: '#BABD9C'
         },
         emphasis: {
            color: 'rgba(164, 161, 181, 0.8)'
         },
         strong: {
            color: 'rgba(164, 161, 181, 0.8)'
         },
         list: {
            backgroundColor: '#0F0040'
         },
         quote: {
            color: 'rgba(164, 161, 181, 0.8)'
         },
         monospace: {
            color: '#85873A'
         },
         invalid: {
            color: '#F8F8F8',
            backgroundColor: '#A41300'
         }
      }
   },
   {
      code: 'merbivore',
      name: 'Merbivore',
      dark: true,
      editor: {
         background: '#161616',
         foreground: '#E6E1DC',
         cursor: '#FFFFFF',
         selection: '#454545',
         gutterBackground: '#202020',
         gutterForeground: '#E6E1DC',
         gutterActiveLine: '#333435',
         activeLine: 'rgba(229, 236, 243, 0.14)',
         matchingBracket: '#404040',
         selectionMatch: '#454545',
         invisible: '#404040'
      },
      tokens: {
         keyword: {
            color: '#FC6F09'
         },
         operator: {
            color: '#FC6F09'
         },
         type: {
            color: '#FC6F09'
         },
         builtin: {
            color: '#FC6F09'
         },
         number: {
            color: '#58C554'
         },
         atom: {
            color: '#FDC251'
         },
         string: {
            color: '#8DFF0A'
         },
         regexp: {
            color: '#8DFF0A'
         },
         comment: {
            color: '#AD2EA4',
            fontStyle: 'italic'
         },
         tag: {
            color: '#FC6F09'
         },
         attribute: {
            color: '#FFFF89'
         },
         attributeValue: {
            color: '#8DFF0A'
         },
         tagPunctuation: {
            color: '#FC6F09'
         },
         emphasis: {
            color: '#8DFF0A'
         },
         strong: {
            color: '#8DFF0A'
         },
         quote: {
            color: '#8DFF0A'
         },
         monospace: {
            color: '#FC6F09'
         },
         invalid: {
            color: '#FFFFFF',
            backgroundColor: '#990000'
         }
      }
   },
   {
      code: 'mono_industrial',
      name: 'Mono Industrial',
      dark: true,
      editor: {
         background: '#222C28',
         foreground: '#FFFFFF',
         cursor: '#FFFFFF',
         selection: 'rgba(145, 153, 148, 0.40)',
         gutterBackground: '#1d2521',
         gutterForeground: '#C5C9C9',
         gutterActiveLine: 'rgba(12, 13, 12, 0.25)',
         activeLine: 'rgba(12, 13, 12, 0.25)',
         matchingBracket: 'rgba(102, 108, 104, 0.50)',
         selectionMatch: 'rgba(145, 153, 148, 0.40)',
         invisible: 'rgba(102, 108, 104, 0.50)'
      },
      tokens: {
         keyword: {
            color: '#A39E64'
         },
         operator: {
            color: '#A8B3AB'
         },
         type: {
            color: '#C23B00'
         },
         builtin: {
            color: '#588E60'
         },
         number: {
            color: '#E98800'
         },
         atom: {
            color: '#E98800'
         },
         string: {
            color: '#FFFFFF',
            backgroundColor: '#151C19'
         },
         regexp: {
            color: '#FFFFFF',
            backgroundColor: '#151C19'
         },
         comment: {
            color: '#666C68',
            backgroundColor: '#151C19'
         },
         variable: {
            color: '#A8B3AB'
         },
         property: {
            color: '#A8B3AB'
         },
         tag: {
            color: '#A39E64'
         },
         attribute: {
            color: '#909993'
         },
         attributeValue: {
            color: '#FFFFFF',
            backgroundColor: '#151C19'
         },
         tagPunctuation: {
            color: '#A39E64'
         },
         emphasis: {
            color: '#FFFFFF',
            backgroundColor: '#151C19'
         },
         strong: {
            color: '#FFFFFF',
            backgroundColor: '#151C19'
         },
         quote: {
            color: '#FFFFFF',
            backgroundColor: '#151C19'
         },
         monospace: {
            color: '#588E60'
         },
         invalid: {
            color: '#FFFFFF',
            backgroundColor: 'rgba(153, 0, 0, 0.68)'
         }
      }
   },
   {
      code: 'monokai',
      name: 'Monokai',
      dark: true,
      editor: {
         background: '#272822',
         foreground: '#F8F8F2',
         cursor: '#F8F8F0',
         selection: '#49483E',
         gutterBackground: '#2F3129',
         gutterForeground: '#8F908A',
         gutterActiveLine: '#272727',
         activeLine: 'rgba(4, 0, 24, 0.20)',
         matchingBracket: '#49483E',
         selectionMatch: '#49483E',
         invisible: '#52524d'
      },
      tokens: {
         keyword: {
            color: '#F92672'
         },
         operator: {
            color: '#F92672'
         },
         type: {
            color: '#66D9EF',
            fontStyle: 'italic'
         },
         builtin: {
            color: '#66D9EF'
         },
         number: {
            color: '#AE81FF'
         },
         atom: {
            color: '#AE81FF'
         },
         string: {
            color: '#E6DB74'
         },
         regexp: {
            color: '#E6DB74'
         },
         comment: {
            color: '#75715E'
         },
         variable: {
            color: '#A6E22E'
         },
         property: {
            color: '#A6E22E'
         },
         tag: {
            color: '#F92672'
         },
         attribute: {
            color: '#A6E22E'
         },
         attributeValue: {
            color: '#E6DB74'
         },
         tagPunctuation: {
            color: '#fff'
         },
         emphasis: {
            color: '#E6DB74'
         },
         strong: {
            color: '#E6DB74'
         },
         quote: {
            color: '#E6DB74'
         },
         monospace: {
            color: '#66D9EF'
         },
         invalid: {
            color: '#F8F8F0',
            backgroundColor: '#F92672'
         }
      }
   },
   {
      code: 'nord_dark',
      name: 'Nord Dark',
      dark: true,
      editor: {
         background: '#2e3440',
         foreground: '#d8dee9',
         cursor: '#d8dee9',
         selection: '#434c5ecc',
         gutterBackground: '#2e3440',
         gutterForeground: '#616e88',
         gutterActiveLine: '#434c5ecc',
         activeLine: '#434c5ecc',
         matchingBracket: '#88c0d066',
         selectionMatch: '#88c0d066',
         invisible: '#4c566a'
      },
      tokens: {
         keyword: {
            color: '#81a1c1'
         },
         operator: {
            color: '#81a1c1'
         },
         type: {
            color: '#d8dee9'
         },
         builtin: {
            color: '#8fbcbb'
         },
         number: {
            color: '#b48ead'
         },
         atom: {
            color: '#5e81ac'
         },
         string: {
            color: '#a3be8c'
         },
         regexp: {
            color: '#bf616a'
         },
         comment: {
            color: '#616e88'
         },
         variable: {
            color: '#8fbcbb'
         },
         property: {
            color: '#8fbcbb'
         },
         tag: {
            color: '#81a1c1'
         },
         attribute: {
            color: '#d8dee9'
         },
         attributeValue: {
            color: '#a3be8c'
         },
         tagPunctuation: {
            color: '#81a1c1'
         },
         emphasis: {
            color: '#a3be8c'
         },
         strong: {
            color: '#a3be8c'
         },
         quote: {
            color: '#a3be8c'
         },
         monospace: {
            color: '#8fbcbb'
         }
      }
   },
   {
      code: 'pastel_on_dark',
      name: 'Pastel on Dark',
      dark: true,
      editor: {
         background: '#2C2828',
         foreground: '#8F938F',
         cursor: '#A7A7A7',
         selection: 'rgba(221, 240, 255, 0.20)',
         gutterBackground: '#353030',
         gutterForeground: '#8F938F',
         gutterActiveLine: 'rgba(255, 255, 255, 0.031)',
         activeLine: 'rgba(255, 255, 255, 0.031)',
         matchingBracket: 'rgba(255, 255, 255, 0.25)',
         selectionMatch: 'rgba(221, 240, 255, 0.20)',
         invisible: 'rgba(255, 255, 255, 0.25)'
      },
      tokens: {
         keyword: {
            color: '#757aD8'
         },
         operator: {
            color: '#797878'
         },
         builtin: {
            color: '#AEB2F8'
         },
         number: {
            color: '#CCCCCC'
         },
         atom: {
            color: '#DE8E30'
         },
         string: {
            color: '#66A968'
         },
         regexp: {
            color: '#E9C062'
         },
         comment: {
            color: '#A6C6FF'
         },
         variable: {
            color: '#BEBF55'
         },
         property: {
            color: '#BEBF55'
         },
         tag: {
            color: '#757aD8'
         },
         attributeValue: {
            color: '#66A968'
         },
         tagPunctuation: {
            color: '#757aD8'
         },
         emphasis: {
            color: '#66A968'
         },
         strong: {
            color: '#66A968'
         },
         quote: {
            color: '#66A968'
         },
         monospace: {
            color: '#AEB2F8'
         },
         meta: {
            color: '#494949'
         },
         invalid: {
            color: '#F8F8F8',
            backgroundColor: 'rgba(86, 45, 86, 0.75)'
         }
      }
   },
   {
      code: 'solarized_dark',
      name: 'Solarized Dark',
      dark: true,
      editor: {
         background: '#002B36',
         foreground: '#839496',
         cursor: '#D30102',
         selection: 'rgba(255, 255, 255, 0.1)',
         gutterBackground: '#01313f',
         gutterForeground: '#d0edf7',
         gutterActiveLine: '#0d3440',
         activeLine: 'rgba(255, 255, 255, 0.1)',
         matchingBracket: 'rgba(147, 161, 161, 0.50)',
         selectionMatch: '#073642',
         invisible: 'rgba(147, 161, 161, 0.50)'
      },
      tokens: {
         keyword: {
            color: '#859900'
         },
         operator: {
            color: '#859900'
         },
         type: {
            color: '#839496'
         },
         builtin: {
            color: '#268BD2'
         },
         number: {
            color: '#D33682'
         },
         atom: {
            color: '#B58900'
         },
         string: {
            color: '#2AA198'
         },
         regexp: {
            color: '#D30102'
         },
         comment: {
            color: '#657B83',
            fontStyle: 'italic'
         },
         variable: {
            color: '#268BD2'
         },
         property: {
            color: '#268BD2'
         },
         tag: {
            color: '#859900'
         },
         attribute: {
            color: '#839496'
         },
         attributeValue: {
            color: '#2AA198'
         },
         tagPunctuation: {
            color: '#859900'
         },
         emphasis: {
            color: '#2AA198'
         },
         strong: {
            color: '#2AA198'
         },
         quote: {
            color: '#2AA198'
         },
         monospace: {
            color: '#268BD2'
         }
      }
   },
   {
      code: 'terminal',
      name: 'Terminal',
      dark: true,
      editor: {
         background: 'black',
         foreground: '#DEDEDE',
         cursor: '#9F9F9F',
         selection: '#424242',
         gutterBackground: '#1a0005',
         gutterForeground: 'steelblue',
         gutterActiveLine: '#2A112A',
         activeLine: '#2A2A2A',
         selectionMatch: '#424242',
         invisible: '#343434'
      },
      tokens: {
         keyword: {
            color: 'tomato'
         },
         operator: {
            color: 'deeppink'
         },
         type: {
            color: 'tomato'
         },
         builtin: {
            color: '#7AA6DA'
         },
         number: {
            color: '#E78C45'
         },
         atom: {
            color: '#E78C45'
         },
         string: {
            color: '#B9CA4A'
         },
         regexp: {
            color: '#D54E53'
         },
         comment: {
            color: 'orangered'
         },
         variable: {
            color: '#D54E53'
         },
         property: {
            color: '#D54E53'
         },
         tag: {
            color: '#D54E53'
         },
         attribute: {
            color: '#D54E53'
         },
         attributeValue: {
            color: '#B9CA4A'
         },
         tagPunctuation: {
            color: '#D54E53'
         },
         heading: {
            color: '#B9CA4A'
         },
         emphasis: {
            color: '#B9CA4A'
         },
         strong: {
            color: '#B9CA4A'
         },
         quote: {
            color: '#B9CA4A'
         },
         monospace: {
            color: '#7AA6DA'
         },
         invalid: {
            color: 'yellow',
            backgroundColor: 'red'
         }
      }
   },
   {
      code: 'tomorrow_night',
      name: 'Tomorrow Night',
      dark: true,
      editor: {
         background: '#1D1F21',
         foreground: '#C5C8C6',
         cursor: '#AEAFAD',
         selection: '#373B41',
         gutterBackground: '#25282c',
         gutterForeground: '#C5C8C6',
         gutterActiveLine: '#282A2E',
         activeLine: 'rgba(212, 214, 250, 0.06)',
         matchingBracket: '#4B4E55',
         selectionMatch: '#373B41',
         invisible: '#4B4E55'
      },
      tokens: {
         keyword: {
            color: '#B294BB'
         },
         operator: {
            color: '#8ABEB7'
         },
         type: {
            color: '#B294BB'
         },
         builtin: {
            color: '#81A2BE'
         },
         number: {
            color: '#DE935F'
         },
         atom: {
            color: '#DE935F'
         },
         string: {
            color: '#B5BD68'
         },
         regexp: {
            color: '#CC6666'
         },
         comment: {
            color: '#969896'
         },
         variable: {
            color: '#CC6666'
         },
         property: {
            color: '#CC6666'
         },
         tag: {
            color: '#CC6666'
         },
         attribute: {
            color: '#CC6666'
         },
         attributeValue: {
            color: '#B5BD68'
         },
         tagPunctuation: {
            color: '#CC6666'
         },
         heading: {
            color: '#B5BD68'
         },
         emphasis: {
            color: '#B5BD68'
         },
         strong: {
            color: '#B5BD68'
         },
         quote: {
            color: '#B5BD68'
         },
         monospace: {
            color: '#81A2BE'
         },
         invalid: {
            color: '#CED2CF',
            backgroundColor: '#DF5F5F'
         }
      }
   },
   {
      code: 'tomorrow_night_blue',
      name: 'Tomorrow Night Blue',
      dark: true,
      editor: {
         background: '#002451',
         foreground: '#FFFFFF',
         cursor: '#FFFFFF',
         selection: '#003F8E',
         gutterBackground: '#00204b',
         gutterForeground: '#7388b5',
         gutterActiveLine: '#022040',
         activeLine: 'rgba(0, 130, 252, 0.17)',
         matchingBracket: '#404F7D',
         selectionMatch: '#003F8E',
         invisible: '#404F7D'
      },
      tokens: {
         keyword: {
            color: '#EBBBFF'
         },
         operator: {
            color: '#99FFFF'
         },
         type: {
            color: '#EBBBFF'
         },
         builtin: {
            color: '#BBDAFF'
         },
         number: {
            color: '#FFC58F'
         },
         atom: {
            color: '#FFC58F'
         },
         string: {
            color: '#D1F1A9'
         },
         regexp: {
            color: '#FF9DA4'
         },
         comment: {
            color: '#7285B7'
         },
         variable: {
            color: '#FF9DA4'
         },
         property: {
            color: '#FF9DA4'
         },
         tag: {
            color: '#FF9DA4'
         },
         attribute: {
            color: '#FF9DA4'
         },
         attributeValue: {
            color: '#D1F1A9'
         },
         tagPunctuation: {
            color: '#FF9DA4'
         },
         heading: {
            color: '#D1F1A9'
         },
         emphasis: {
            color: '#D1F1A9'
         },
         strong: {
            color: '#D1F1A9'
         },
         quote: {
            color: '#D1F1A9'
         },
         monospace: {
            color: '#BBDAFF'
         },
         invalid: {
            color: '#FFFFFF',
            backgroundColor: '#F99DA5'
         }
      }
   },
   {
      code: 'tomorrow_night_bright',
      name: 'Tomorrow Night Bright',
      dark: true,
      editor: {
         background: '#000000',
         foreground: '#DEDEDE',
         cursor: '#9F9F9F',
         selection: '#424242',
         gutterBackground: '#1a1a1a',
         gutterForeground: '#DEDEDE',
         gutterActiveLine: '#2A2A2A',
         activeLine: 'rgba(247, 247, 247, 0.17)',
         matchingBracket: '#888888',
         selectionMatch: '#888888',
         invisible: '#343434'
      },
      tokens: {
         keyword: {
            color: '#C397D8'
         },
         operator: {
            color: '#70C0B1'
         },
         type: {
            color: '#C397D8'
         },
         builtin: {
            color: '#7AA6DA'
         },
         number: {
            color: '#E78C45'
         },
         atom: {
            color: '#E78C45'
         },
         string: {
            color: '#B9CA4A'
         },
         regexp: {
            color: '#D54E53'
         },
         comment: {
            color: '#969896'
         },
         variable: {
            color: '#D54E53'
         },
         property: {
            color: '#D54E53'
         },
         tag: {
            color: '#D54E53'
         },
         attribute: {
            color: '#D54E53'
         },
         attributeValue: {
            color: '#B9CA4A'
         },
         tagPunctuation: {
            color: '#D54E53'
         },
         heading: {
            color: '#B9CA4A'
         },
         emphasis: {
            color: '#B9CA4A'
         },
         strong: {
            color: '#B9CA4A'
         },
         quote: {
            color: '#B9CA4A'
         },
         monospace: {
            color: '#7AA6DA'
         },
         invalid: {
            color: '#CED2CF',
            backgroundColor: '#DF5F5F'
         }
      }
   },
   {
      code: 'tomorrow_night_eighties',
      name: 'Tomorrow Night 80s',
      dark: true,
      editor: {
         background: '#2D2D2D',
         foreground: '#CCCCCC',
         cursor: '#CCCCCC',
         selection: '#515151',
         gutterBackground: '#272727',
         gutterForeground: '#CCC',
         gutterActiveLine: '#393939',
         activeLine: 'rgba(245, 245, 245, 0.06)',
         matchingBracket: '#6A6A6A',
         selectionMatch: '#515151',
         invisible: '#6A6A6A'
      },
      tokens: {
         keyword: {
            color: '#CC99CC'
         },
         operator: {
            color: '#66CCCC'
         },
         type: {
            color: '#CC99CC'
         },
         builtin: {
            color: '#6699CC'
         },
         number: {
            color: '#F99157'
         },
         atom: {
            color: '#F99157'
         },
         string: {
            color: '#99CC99'
         },
         regexp: {
            color: '#99CC99'
         },
         comment: {
            color: '#999999'
         },
         variable: {
            color: '#F2777A'
         },
         property: {
            color: '#F2777A'
         },
         tag: {
            color: '#F2777A'
         },
         attribute: {
            color: '#F2777A'
         },
         attributeValue: {
            color: '#99CC99'
         },
         tagPunctuation: {
            color: '#F2777A'
         },
         heading: {
            color: '#99CC99'
         },
         emphasis: {
            color: '#99CC99'
         },
         strong: {
            color: '#99CC99'
         },
         quote: {
            color: '#99CC99'
         },
         monospace: {
            color: '#6699CC'
         },
         invalid: {
            color: '#CDCDCD',
            backgroundColor: '#F2777A'
         }
      }
   },
   {
      code: 'twilight',
      name: 'Twilight',
      dark: true,
      editor: {
         background: '#141414',
         foreground: '#F8F8F8',
         cursor: '#A7A7A7',
         selection: 'rgba(221, 240, 255, 0.20)',
         gutterBackground: '#232323',
         gutterForeground: '#E2E2E2',
         gutterActiveLine: 'rgba(255, 255, 255, 0.031)',
         activeLine: 'rgba(255, 255, 255, 0.031)',
         matchingBracket: 'rgba(255, 255, 255, 0.25)',
         selectionMatch: 'rgba(221, 240, 255, 0.20)',
         invisible: 'rgba(255, 255, 255, 0.25)'
      },
      tokens: {
         keyword: {
            color: '#CDA869'
         },
         operator: {
            color: '#CDA869'
         },
         type: {
            color: '#F9EE98'
         },
         builtin: {
            color: '#DAD085'
         },
         number: {
            color: '#CF6A4C'
         },
         atom: {
            color: '#CF6A4C'
         },
         string: {
            color: '#8F9D6A'
         },
         regexp: {
            color: '#E9C062'
         },
         comment: {
            color: '#5F5A60',
            fontStyle: 'italic'
         },
         variable: {
            color: '#7587A6'
         },
         property: {
            color: '#7587A6'
         },
         tag: {
            color: '#AC885B'
         },
         attributeValue: {
            color: '#8F9D6A'
         },
         tagPunctuation: {
            color: '#AC885B'
         },
         heading: {
            color: '#CF6A4C'
         },
         emphasis: {
            color: '#8F9D6A'
         },
         strong: {
            color: '#8F9D6A'
         },
         list: {
            color: '#F9EE98'
         },
         quote: {
            color: '#8F9D6A'
         },
         monospace: {
            color: '#DAD085'
         },
         meta: {
            color: '#494949'
         }
      }
   },
   {
      code: 'vibrant_ink',
      name: 'Vibrant Ink',
      dark: true,
      editor: {
         background: '#0F0F0F',
         foreground: '#FFFFFF',
         cursor: '#FFFFFF',
         selection: '#6699CC',
         gutterBackground: '#1a1a1a',
         gutterForeground: '#BEBEBE',
         gutterActiveLine: '#333333',
         activeLine: 'rgba(255, 255, 255, 0.15)',
         matchingBracket: '#404040',
         selectionMatch: '#6699CC',
         invisible: '#404040'
      },
      tokens: {
         keyword: {
            color: '#FF6600'
         },
         operator: {
            color: '#FF6600'
         },
         builtin: {
            color: '#FFCC00'
         },
         number: {
            color: '#99CC99'
         },
         atom: {
            color: '#339999'
         },
         string: {
            color: '#66FF00'
         },
         regexp: {
            color: '#44B4CC'
         },
         comment: {
            color: '#9933CC'
         },
         variable: {
            color: '#FFCC00'
         },
         property: {
            color: '#FFCC00'
         },
         tag: {
            color: '#FF6600'
         },
         attribute: {
            color: '#99CC99',
            fontStyle: 'italic'
         },
         attributeValue: {
            color: '#66FF00'
         },
         tagPunctuation: {
            color: '#FF6600'
         },
         emphasis: {
            color: '#66FF00'
         },
         strong: {
            color: '#66FF00'
         },
         quote: {
            color: '#66FF00'
         },
         monospace: {
            color: '#FFCC00'
         },
         invalid: {
            color: '#CCFF33',
            backgroundColor: '#000000'
         }
      }
   }
];
