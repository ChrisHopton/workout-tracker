const dayjs = require('./dayjs');

function toSqlDateTime(value) {
  return dayjs(value).utc().format('YYYY-MM-DD HH:mm:ss');
}

module.exports = {
  toSqlDateTime,
};
