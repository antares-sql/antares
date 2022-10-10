/* eslint-disable @typescript-eslint/no-explicit-any */
export default class {
   static get _methods () {
      return [
         { name: 'zipCode', group: 'address', types: ['string'] },
         { name: 'zipCodeByState', group: 'address', types: ['string'] },
         { name: 'city', group: 'address', types: ['string'] },
         { name: 'cityPrefix', group: 'address', types: ['string'] },
         { name: 'citySuffix', group: 'address', types: ['string'] },
         { name: 'streetName', group: 'address', types: ['string'] },
         { name: 'streetAddress', group: 'address', types: ['string'] },
         { name: 'streetSuffix', group: 'address', types: ['string'] },
         { name: 'streetPrefix', group: 'address', types: ['string'] },
         { name: 'secondaryAddress', group: 'address', types: ['string'] },
         { name: 'county', group: 'address', types: ['string'] },
         { name: 'country', group: 'address', types: ['string'] },
         { name: 'countryCode', group: 'address', types: ['string'] },
         { name: 'state', group: 'address', types: ['string'] },
         { name: 'stateAbbr', group: 'address', types: ['string'] },
         { name: 'latitude', group: 'address', types: ['string'] },
         { name: 'longitude', group: 'address', types: ['string'] },
         { name: 'direction', group: 'address', types: ['string'] },
         { name: 'cardinalDirection', group: 'address', types: ['string'] },
         { name: 'ordinalDirection', group: 'address', types: ['string'] },
         // { name: 'nearbyGPSCoordinate', group: 'address', types: ['string'] },
         { name: 'timeZone', group: 'address', types: ['string'] },

         { name: 'color', group: 'commerce', types: ['string'] },
         { name: 'department', group: 'commerce', types: ['string'] },
         { name: 'productName', group: 'commerce', types: ['string'] },
         { name: 'price', group: 'commerce', types: ['string', 'float'] },
         { name: 'productAdjective', group: 'commerce', types: ['string'] },
         { name: 'productMaterial', group: 'commerce', types: ['string'] },
         { name: 'product', group: 'commerce', types: ['string'] },
         { name: 'productDescription', group: 'commerce', types: ['string'] },

         { name: 'suffixes', group: 'company', types: ['string'] },
         { name: 'companyName', group: 'company', types: ['string'] },
         { name: 'companySuffix', group: 'company', types: ['string'] },
         { name: 'catchPhrase', group: 'company', types: ['string'] },
         { name: 'bs', group: 'company', types: ['string'] },
         { name: 'catchPhraseAdjective', group: 'company', types: ['string'] },
         { name: 'catchPhraseDescriptor', group: 'company', types: ['string'] },
         { name: 'catchPhraseNoun', group: 'company', types: ['string'] },
         { name: 'bsAdjective', group: 'company', types: ['string'] },
         { name: 'bsBuzz', group: 'company', types: ['string'] },
         { name: 'bsNoun', group: 'company', types: ['string'] },

         { name: 'column', group: 'database', types: ['string'] },
         { name: 'type', group: 'database', types: ['string'] },
         { name: 'collation', group: 'database', types: ['string'] },
         { name: 'engine', group: 'database', types: ['string'] },

         { name: 'past', group: 'date', types: ['string', 'datetime'] },
         { name: 'future', group: 'date', types: ['string', 'datetime'] },
         // { name: 'between', group: 'date', types: ['string'] },
         { name: 'recent', group: 'date', types: ['string', 'datetime'] },
         { name: 'soon', group: 'date', types: ['string', 'datetime'] },
         { name: 'month', group: 'date', types: ['string'] },
         { name: 'weekday', group: 'date', types: ['string'] },

         { name: 'account', group: 'finance', types: ['string', 'number'] },
         { name: 'accountName', group: 'finance', types: ['string'] },
         { name: 'routingNumber', group: 'finance', types: ['string', 'number'] },
         { name: 'mask', group: 'finance', types: ['string', 'number'] },
         { name: 'amount', group: 'finance', types: ['string', 'float'] },
         { name: 'transactionType', group: 'finance', types: ['string'] },
         { name: 'currencyCode', group: 'finance', types: ['string'] },
         { name: 'currencyName', group: 'finance', types: ['string'] },
         { name: 'currencySymbol', group: 'finance', types: ['string'] },
         { name: 'bitcoinAddress', group: 'finance', types: ['string'] },
         { name: 'litecoinAddress', group: 'finance', types: ['string'] },
         { name: 'creditCardNumber', group: 'finance', types: ['string'] },
         { name: 'creditCardCVV', group: 'finance', types: ['string', 'number'] },
         { name: 'ethereumAddress', group: 'finance', types: ['string'] },
         { name: 'iban', group: 'finance', types: ['string'] },
         { name: 'bic', group: 'finance', types: ['string'] },
         { name: 'transactionDescription', group: 'finance', types: ['string'] },

         { name: 'branch', group: 'git', types: ['string'] },
         { name: 'commitEntry', group: 'git', types: ['string'] },
         { name: 'commitMessage', group: 'git', types: ['string'] },
         { name: 'commitSha', group: 'git', types: ['string'] },
         { name: 'shortSha', group: 'git', types: ['string'] },

         { name: 'abbreviation', group: 'hacker', types: ['string'] },
         { name: 'adjective', group: 'hacker', types: ['string'] },
         { name: 'noun', group: 'hacker', types: ['string'] },
         { name: 'verb', group: 'hacker', types: ['string'] },
         { name: 'ingverb', group: 'hacker', types: ['string'] },
         { name: 'phrase', group: 'hacker', types: ['string'] },

         // { name: 'avatar', group: 'internet', types: ['string'] },
         { name: 'email', group: 'internet', types: ['string'] },
         { name: 'exampleEmail', group: 'internet', types: ['string'] },
         { name: 'userName', group: 'internet', types: ['string'] },
         { name: 'protocol', group: 'internet', types: ['string'] },
         { name: 'url', group: 'internet', types: ['string'] },
         { name: 'domainName', group: 'internet', types: ['string'] },
         { name: 'domainSuffix', group: 'internet', types: ['string'] },
         { name: 'domainWord', group: 'internet', types: ['string'] },
         { name: 'ip', group: 'internet', types: ['string'] },
         { name: 'ipv6', group: 'internet', types: ['string'] },
         { name: 'userAgent', group: 'internet', types: ['string'] },
         { name: 'color', group: 'internet', types: ['string'] },
         { name: 'mac', group: 'internet', types: ['string'] },
         { name: 'password', group: 'internet', types: ['string'] },

         { name: 'word', group: 'lorem', types: ['string'] },
         { name: 'words', group: 'lorem', types: ['string'] },
         { name: 'sentence', group: 'lorem', types: ['string'] },
         { name: 'slug', group: 'lorem', types: ['string'] },
         { name: 'sentences', group: 'lorem', types: ['string'] },
         { name: 'paragraph', group: 'lorem', types: ['string'] },
         { name: 'paragraphs', group: 'lorem', types: ['string'] },
         { name: 'text', group: 'lorem', types: ['string'] },
         { name: 'lines', group: 'lorem', types: ['string'] },

         { name: 'genre', group: 'music', types: ['string'] },

         { name: 'firstName', group: 'name', types: ['string'] },
         { name: 'lastName', group: 'name', types: ['string'] },
         { name: 'middleName', group: 'name', types: ['string'] },
         { name: 'findName', group: 'name', types: ['string'] },
         { name: 'jobTitle', group: 'name', types: ['string'] },
         { name: 'gender', group: 'name', types: ['string'] },
         { name: 'prefix', group: 'name', types: ['string'] },
         { name: 'suffix', group: 'name', types: ['string'] },
         { name: 'title', group: 'name', types: ['string'] },
         { name: 'jobDescriptor', group: 'name', types: ['string'] },
         { name: 'jobArea', group: 'name', types: ['string'] },
         { name: 'jobType', group: 'name', types: ['string'] },

         { name: 'phoneNumber', group: 'phone', types: ['string'] },
         { name: 'phoneNumberFormat', group: 'phone', types: ['string'] },
         { name: 'phoneFormats', group: 'phone', types: ['string'] },

         { name: 'number', group: 'random', types: ['string', 'number'], params: ['min', 'max'] },
         { name: 'float', group: 'random', types: ['string', 'float'], params: ['min', 'max'] },
         { name: 'arrayElement', group: 'random', types: ['string'] },
         { name: 'arrayElements', group: 'random', types: ['string'] },
         { name: 'objectElement', group: 'random', types: ['string'] },
         { name: 'uuid', group: 'random', types: ['string', 'uuid'] },
         { name: 'boolean', group: 'random', types: ['string'] },
         { name: 'word', group: 'random', types: ['string'] },
         { name: 'words', group: 'random', types: ['string'] },
         // { name: 'image', group: 'random', types: ['string'] },
         { name: 'locale', group: 'random', types: ['string'] },
         { name: 'alpha', group: 'random', types: ['string'] },
         { name: 'alphaNumeric', group: 'random', types: ['string'] },
         { name: 'hexaDecimal', group: 'random', types: ['string'] },

         { name: 'fileName', group: 'system', types: ['string'] },
         { name: 'commonFileName', group: 'system', types: ['string'] },
         { name: 'mimeType', group: 'system', types: ['string'] },
         { name: 'commonFileType', group: 'system', types: ['string'] },
         { name: 'commonFileExt', group: 'system', types: ['string'] },
         { name: 'fileType', group: 'system', types: ['string'] },
         { name: 'fileExt', group: 'system', types: ['string'] },
         { name: 'directoryPath', group: 'system', types: ['string'] },
         { name: 'filePath', group: 'system', types: ['string'] },
         { name: 'semver', group: 'system', types: ['string'] },

         { name: 'recent', group: 'time', types: ['string', 'time'] },

         { name: 'vehicle', group: 'vehicle', types: ['string'] },
         { name: 'manufacturer', group: 'vehicle', types: ['string'] },
         { name: 'model', group: 'vehicle', types: ['string'] },
         { name: 'type', group: 'vehicle', types: ['string'] },
         { name: 'fuel', group: 'vehicle', types: ['string'] },
         { name: 'vin', group: 'vehicle', types: ['string'] },
         { name: 'color', group: 'vehicle', types: ['string'] }
      ];
   }

   static getGroups () {
      const groupsObj = this._methods.reduce((acc, curr) => {
         if (curr.group in acc)
            curr.types.forEach(type => acc[curr.group].add(type));
         else
            acc[curr.group] = new Set(curr.types);

         return acc;
      }, {} as any);

      const groupsArr = [];

      for (const key in groupsObj)
         groupsArr.push({ name: key, types: [...groupsObj[key]] });

      return groupsArr.sort((a, b) => {
         if (a.name < b.name)
            return -1;

         if (b.name > a.name)
            return 1;

         return 0;
      });
   }

   static getGroupsByType (type: string) {
      if (!type) return [];
      return this.getGroups().filter(group => group.types.includes(type));
   }

   static getMethods ({ type, group }: {type: string; group: string}) {
      return this._methods.filter(method => method.group === group && method.types.includes(type)).sort((a, b) => {
         if (a.name < b.name)
            return -1;

         if (b.name > a.name)
            return 1;

         return 0;
      });
   }
}
