import { faker } from '@faker-js/faker';
import * as moment from 'moment';

export const fakerCustom = {
   seed: faker.seed,
   setLocale: faker.setLocale,
   ...faker,
   date: {
      now: () => moment().format('YYYY-MM-DD HH:mm:ss'),
      ...faker.date
   },
   time: {
      now: () => moment().format('HH:mm:ss'),
      random: () => moment(faker.date.recent()).format('HH:mm:ss'),
      ...faker.time
   }
};
