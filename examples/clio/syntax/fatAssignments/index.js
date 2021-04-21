const { rule, map, ignore } = require("../../../../index");
const types = require("../../types");
const { expressions, wrap, values } = require("../common");

module.exports = {
  // Fat arrow assignment
  ...map([...values, ...expressions], {
    ender: rule((lhs) => lhs, 0.5),
    fatArrow: wrap((lhs, rhs) => {
      return {
        type: "fatArrowOpen",
        arrow: rhs,
        value: types.checkLambda(lhs, types.get(lhs), true),
      };
    }, 0.5),
  }),
  fatArrowOpen: {
    symbol: wrap((lhs, rhs) => {
      lhs.type = "arrowAssignment";
      lhs.name = types.get(rhs);
      return lhs;
    }, 0.5),
  },
  arrowAssignment: {
    ...ignore("lineBreak"),
    arrow: wrap((lhs) => {
      return {
        type: "pipeOpen",
        data: lhs,
      };
    }),
    ender: wrap((lhs) => lhs),
  },
};
