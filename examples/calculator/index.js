const { rule, bean, map, list } = require("../../index");
const readline = require("readline");

const numPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;

const lex = (string) => {
  const tokens = list([]);
  while (string) {
    const char = string[0];
    switch (char) {
      case "(":
        tokens.push({ type: "lParen", value: char });
        string = string.slice(1);
        break;
      case ")":
        tokens.push({ type: "rParen", value: char });
        string = string.slice(1);
        break;
      case "+":
        tokens.push({ type: "addOp", value: char });
        string = string.slice(1);
        break;
      case "-":
        const match = string.match(numPattern);
        if (match) {
          tokens.push({ type: "number", value: parseFloat(match[0]) });
          string = string.slice(match[0].length);
        } else {
          tokens.push({ type: "subOp", value: char });
          string = string.slice(1);
        }
        break;
      case "/":
        tokens.push({ type: "divOp", value: char });
        string = string.slice(1);
        break;
      case "*":
        if (string[1] == "*") {
          tokens.push({ type: "powOp", value: "**" });
          string = string.slice(2);
        } else {
          tokens.push({ type: "mulOp", value: "*" });
          string = string.slice(1);
        }
        break;
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
        tokens.push({ type: "number", value: parseFloat(numMatch) });
        string = string.slice(numMatch.length);
        break;
      default:
        string = string.slice(1);
        break;
    }
  }
  return tokens;
};

const rules = {
  lParen: {
    number: rule((_, { value }) => {
      return { type: "openParen", value };
    }, 0),
  },
  openParen: {
    rParen: rule(({ value }) => {
      return { type: "number", value };
    }, 0),
  },
  number: {
    powOp: rule((lhs) => {
      return { type: "powLhs", lhs: lhs.value };
    }, 3),
    mulOp: rule((lhs) => {
      return { type: "mulLhs", lhs: lhs.value };
    }, 2),
    divOp: rule((lhs) => {
      return { type: "divLhs", lhs: lhs.value };
    }, 2),
    addOp: rule((lhs) => {
      return { type: "addLhs", lhs: lhs.value };
    }),
    subOp: rule((lhs) => {
      return { type: "subLhs", lhs: lhs.value };
    }),
  },
  addLhs: {
    number: rule(({ lhs }, rhs) => {
      return { type: "number", value: lhs + rhs.value };
    }),
  },
  subLhs: {
    number: rule(({ lhs }, rhs) => {
      return { type: "number", value: lhs - rhs.value };
    }),
  },
  mulLhs: {
    number: rule(({ lhs }, rhs) => {
      return { type: "number", value: lhs * rhs.value };
    }),
  },
  divLhs: {
    number: rule(({ lhs }, rhs) => {
      return { type: "number", value: lhs / rhs.value };
    }),
  },
  powLhs: {
    number: rule(({ lhs }, rhs) => {
      return { type: "number", value: Math.pow(lhs, rhs.value) };
    }),
  },
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = () =>
  rl.question("> ", (input) => {
    if (input == "exit") return rl.close();
    const tokens = lex(input);
    const result = bean(tokens, rules);
    console.log(result.current.item.value);
    prompt();
  });

prompt();
