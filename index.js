// TODO: write beef in beef/bean
function beef(string, helpers) {
  string = string
    .split("\n")
    .filter(line => !line.startsWith("//"))
    .join("\n");
  const rules = string.match(
    /(.+?) +(.+?) +=> +(.+?)(( +({(.|\n)*?})($|\n))|\n|$)/g
  );
  const aliases = string
    .match(/alias (.+?) (.+)\n/g)
    .reduce((aliases, match) => {
      const [_, name, values] = match.split(" ");
      aliases[name] = values.split("|");
      return aliases;
    }, {});
  const resolve = names => {
    const result = [];
    for (const name of names) {
      if (name in aliases) {
        for (const alias of aliases[name]) {
          result.push(alias);
        }
      } else {
        result.push(name);
      }
    }
    return result;
  };
  const model = [];
  rules.forEach(rule => {
    const match = rule.match(
      /(.+?) +(.+?) +=> +(.+?)(( +({(.|\n)*?})($|\n))|\n|$)/
    );
    const lefts = resolve(match[1].split("|"));
    const rights = resolve(match[2].split("|"));
    const name = match[3];
    const make = match[5];
    const body = `return { name, ...${make}}`;
    const args = ["helpers", "name", "left", "right"];
    const makeFn = make
      ? (left, right) => Function(...args, body)(helpers, name, left, right)
      : (left, right) => {
          return { name, left, right };
        };
    lefts.forEach(left => {
      rights.forEach(right => {
        model.push({ left, right, make: makeFn });
      });
    });
  });
  return model;
}

function bean(model, tokens) {
  while (true) {
    let match = false;
    const iter = tokens.length - 1;
    modelLoop: for (const { left, right, make } of model) {
      for (let index = 0; index < iter; index++) {
        const leftNode = tokens[index];
        if (leftNode.name != left) continue;
        const rightNode = tokens[index + 1];
        if (!rightNode || rightNode.name != right) continue;
        match = true;
        tokens.splice(index + 1, 1);
        tokens[index] = make(leftNode, rightNode);
        break modelLoop;
      }
    }
    if (!match) break;
  }
  return [tokens.length == 1, tokens];
}

exports.bean = bean;
exports.beef = beef;
