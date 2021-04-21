const { map } = require("../../../../index");
const { wrap } = require("../common");

module.exports = {
  ...map(["symbol", "propertyAccess", "wrapped", "slice"], {
    ...map(
      ["lParen", "lCurly", "lSquare", "hash"],
      wrap(
        /* istanbul ignore next */
        () => {
          /* This never matches, but boosts wrapped, array,
             hashmap, set vs block rule matching */
        },
        0.01
      )
    ),
  }),
};
