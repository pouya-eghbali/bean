const { rule, bean, map, mapfn, ignore, merge } = require("../../index");
const { lPluck } = require("../../index");
const lex = require("./lexer");
const types = require("./types");
const {
  wrap,
  topLevels,
  controls,
  expressions,
  arrayLike,
  ranges,
  values,
} = require("./syntax/common");

const rules = merge(
  require("./syntax/calls/index"),
  require("./syntax/blocks/index"),
  require("./syntax/parallelFns/index"),
  require("./syntax/functions/index"),
  require("./syntax/math/index"),
  require("./syntax/comparisons/index"),
  require("./syntax/logicals/index"),
  require("./syntax/conditionals/index"),
  require("./syntax/arrays/index"),
  require("./syntax/hashmaps/index"),
  require("./syntax/properties/index"),
  require("./syntax/methods/index"),
  require("./syntax/ranges/index"),
  require("./syntax/slices/index"),
  require("./syntax/sets/index"),
  require("./syntax/wrapped/index"),
  require("./syntax/formattedStrings/index"),
  require("./syntax/assignments/index"),
  require("./syntax/fatAssignments/index"),
  require("./syntax/await/index"),
  require("./syntax/exports/index"),
  require("./syntax/imports/index"),
  require("./syntax/in/index"),
  require("./syntax/clio/index"),
  require("./syntax/boosters/index")
);

/* istanbul ignore next */
const skips = ["blockOpen", "ifTail"];

/* istanbul ignore next */
const parsingError = (source, file, tokens) => {
  let first = tokens.first;
  let next = tokens.first.next;
  while (true) {
    const isValid = rules[first.item.type][next.item.type];
    if (isValid || skips.includes(next.item.type)) {
      first = next;
      next = first.next;
    } else {
      break;
    }
  }
  first = first.item;
  next = next.item;
  const expecting = Object.keys(rules[first.type] || {}).join(", ");
  const start = Math.max(0, next.line - 3);
  const location = next.meta?.location || next;
  const { line, column } = location;
  const message = [
    `Parsing error at ${file}[${line}:${column}]\n`,
    source.split("\n").slice(start, line).join("\n"),
    " ".repeat(column) + "^",
    `\nExpecting one of ${expecting} but encountered ${next?.type}`,
  ].join("\n");
  return new Error(message);
};

const parse = (tokens) => bean(tokens, rules);
const compile = (source, file, debug = false) => {
  const tokens = lex(source, file);
  /* istanbul ignore next */
  if (debug) console.dir(tokens.current, { depth: null });
  const result = parse(tokens);
  /* istanbul ignore next */
  if (debug) console.dir(result, { depth: null });
  /* istanbul ignore next */
  if (result.first.item.type == "clio") {
    const code = types.get(result.current.item).toString();
    return code;
    /* istanbul ignore next */
  } else {
    /* istanbul ignore next */
    throw parsingError(source, file, result);
  }
};

/* istanbul ignore next */
let i = 1;
/* istanbul ignore next */
const testStr = (name, input, output, debug = false) => {
  const result = compile(input, "<mem>", debug);
  const passes = result == output;
  console.log(i.toString().padStart(2, " "), [passes], name);
  if (!passes) {
    console.log();
    console.log("Error compiling:");
    console.log(input);
    console.log();
    console.log(`Expecting:`);
    console.log(output);
    console.log();
    console.log(`Got:`);
    console.log(result);
  }
  i++;
};

module.exports.compile = compile;

/*
  Math has the highest priority
  Comparison comes second
  Logical is third
  Hashmaps, arrays, sets, wraps are next
  Function calls are next
  Blocks are next
  Export is next

  Quick functions are messy, they can be improved
*/
