const { rule, bean, map, lPluck, list } = require("../../index");
const fs = require("fs");

const strPattern = /^"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/;
const numPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;

const lex = (string) => {
  const tokens = list([]);
  while (string.length) {
    const char = string[0];
    switch (char) {
      case "{":
        tokens.push({ type: "lCurl", value: char });
        string = string.slice(1);
        break;
      case "}":
        tokens.push({ type: "rCurl", value: char });
        string = string.slice(1);
        break;
      case "[":
        tokens.push({ type: "lBra", value: char });
        string = string.slice(1);
        break;
      case "]":
        tokens.push({ type: "rBra", value: char });
        string = string.slice(1);
        break;
      case ",":
        tokens.push({ type: "comma", value: char });
        string = string.slice(1);
        break;
      case ":":
        tokens.push({ type: "colon", value: char });
        string = string.slice(1);
        break;
      case '"':
        const [match] = string.match(strPattern);
        tokens.push({ type: "string", value: eval(match) });
        string = string.slice(match.length);
        break;
      case "-":
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        const [numMatch] = string.match(numPattern);
        tokens.push({ type: "number", value: numMatch });
        string = string.slice(numMatch.length);
        break;
      case "f":
        tokens.push({ type: "false", value: false });
        string = string.slice(5);
        break;
      case "t":
        tokens.push({ type: "true", value: true });
        string = string.slice(4);
        break;
      case "n":
        tokens.push({ type: "null", value: null });
        string = string.slice(4);
        break;
      default:
        string = string.slice(1);
        break;
    }
  }
  return tokens;
};

const types = {
  true: () => true,
  false: () => false,
  null: () => null,
  number: (n) => parseFloat(n),
};

const values = ["string", "number", "null", "true", "false", "object", "array"];

const rules = {
  // Objects
  lCurl: {
    string: rule((_, { value: key }) => {
      return { type: "openObject", key, value: {} };
    }),
    rCurl: rule(() => {
      return { type: "object", value: {} };
    }),
  },
  openObject: {
    ...map(["colon", "comma"], rule(lPluck)),
    ...map(
      values,
      rule((object, { value, type }) => {
        const getValue = types[type];
        if (getValue) value = getValue(value);
        const { key } = object;
        if (key) {
          object.value[key] = value;
          object.key = null;
        } else {
          object.key = value;
        }
        return object;
      })
    ),
    rCurl: rule((object) => {
      return { type: "object", value: object.value };
    }),
  },
  // Arrays
  lBra: {
    ...map(
      values,
      rule((_, { value, type }) => {
        const getValue = types[type];
        if (getValue) value = getValue(value);
        return { type: "openArray", value: [value] };
      })
    ),
    rBra: rule(() => {
      return { type: "array", value: [] };
    }),
  },
  openArray: {
    comma: rule(lPluck),
    ...map(
      values,
      rule((openArray, { value, type }) => {
        const getValue = types[type];
        if (getValue) value = getValue(value);
        openArray.value.push(value);
        return openArray;
      })
    ),
    rBra: rule((array) => {
      return { type: "array", value: array.value };
    }),
  },
};

const json = fs.readFileSync("./data.json", { encoding: "utf-8" });
const parsed = bean(lex(json), rules, false);

const beanJ = JSON.stringify(parsed.current.item.value, null, 2);
const JavaScriptJ = JSON.stringify(JSON.parse(json), null, 2);

console.log("JavaScript and bean results equal:", JavaScriptJ == beanJ);
