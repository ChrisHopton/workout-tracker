const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const isoWeek = require('dayjs/plugin/isoWeek');
const advancedFormat = require('dayjs/plugin/advancedFormat');

dayjs.extend(utc);
dayjs.extend(isoWeek);
dayjs.extend(advancedFormat);

dayjs.utc = dayjs.utc || ((...args) => dayjs(...args).utc());

module.exports = dayjs;
