const { v4: uuid } = require('uuid');

function createId() {
  return uuid();
}

module.exports = {
  createId,
};
