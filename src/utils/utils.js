function omitKeysInObject(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key))
  );
}

module.exports = { omitKeysInObject };