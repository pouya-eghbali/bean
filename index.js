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
  let processList = []
  while (true) {
    let match = false
    const processIter = processList.length - 1
    modelLoop: for (const { left, right, make } of model) {
      for (let index = 0; index < processIter; index++) {
        const leftNode = processList[index]
        if (leftNode.name != left) continue
        const rightNode = processList[index + 1]
        if (!rightNode || rightNode.name != right) continue
        match = true
        processList.splice(index + 1, 1)
        processList[index] = make(leftNode, rightNode)
        break modelLoop
      }
    }
    if (!match && tokens.length) processList.push(tokens.shift())
    else if (!match) break
  }
  return [processList.length == 1, processList]
}

exports.bean = bean;
exports.beef = beef;