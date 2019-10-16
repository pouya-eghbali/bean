// TODO: write beef in beef/bean
function beef(string, helpers) {
  string = string.split('\n').filter(line => !line.startsWith('//')).join('\n')
  const rules = string.match(/(.+?) +(.+?) +=> +(.+?)(( +({(.|\n)*?})($|\n))|\n|$)/g);
  const model = [];
  rules.forEach(rule => {
    const match = rule.match(/(.+?) +(.+?) +=> +(.+?)(( +({(.|\n)*?})($|\n))|\n|$)/);
    const lefts = match[1].split("|");
    const rights = match[2].split("|");
    const name = match[3];
    const make = match[5];
    const body = `return { name, ...${make}}`
    const args = ['helpers', 'name', 'left', 'right']
    const makeFn = make ?
      (left, right) => Function(...args, body)(helpers, name, left, right) :
      (left, right) => { return { name, left, right } }
    lefts.forEach(left => {
      rights.forEach(right => {
        model.push({ left, right, make: makeFn })
      })
    })
  });
  return model;
}

function bean(model, tokens) {
  let i = 0;
  while (true) {
    const rule = model[i];
    let matched = false;
    let j = 0;
    while (true) {
      const length = tokens.length;
      if (length == 1) {
        return [true, tokens]
      }
      if (j + 1 > length - 1) {
        break;
      }
      const left = tokens[j];
      const right = tokens[j + 1];
      if (left.name == rule.left && right.name == rule.right) {
        let result = rule.make(left, right);
        tokens = [...tokens.slice(0, j), result, ...tokens.slice(j + 2)];
        i = 0;
        matched = true;
        break;
      }
      j++;
    }
    if (!matched && i + 1 == model.length) {
      return [false, tokens]
    }
    i = matched ? 0 : i + 1;
  }
}

exports.bean = bean;
exports.beef = beef;