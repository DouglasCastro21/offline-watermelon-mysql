function toMysqlDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function fromMysqlDate(value) {
  return value ? new Date(value).toISOString() : null;
}

module.exports = {
  toMysqlDate,
  fromMysqlDate
};
