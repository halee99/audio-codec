const int = Math.floor;

const genExtendArray = (array) => {
  const newArray = Array.from(array);
  newArray.extend = function (list) {
    this.splice(this.length, 0, ...list);
  };
  return newArray;
};

const toData = (str) => str.split('').map(c => c.charCodeAt());

const pipe = (...args) => x => args.reduce(
  (outputValue, currentFunction) => currentFunction(outputValue),
  x,
);

module.exports = {
  int,
  genExtendArray,
  toData,
  pipe,
};
