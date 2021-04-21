class Node {
  constructor(item) {
    this.item = item;
  }
  setNext(node) {
    this.next = node;
    node.prev = this;
  }
  unlink() {
    if (this.next) this.next.prev = this.prev;
    this.prev.next = this.next;
  }
}

class List {
  constructor(array) {
    if (!array.length) return;
    const [first, ...rest] = array;
    this.current = new Node(first);
    this.first = this.current;
    this.last = this.current;
    let curr = this.current;
    for (const item of rest) {
      const node = new Node(item);
      curr.setNext(node);
      curr = node;
    }
    this.last = curr;
  }
  next() {
    this.current = this.current.next;
  }
  prev() {
    this.current = this.current.prev;
  }
  unlinkNext() {
    this.current.next.unlink();
  }
  push(item) {
    const node = new Node(item);
    if (!this.current) {
      this.current = node;
      this.last = this.current;
      this.first = this.current;
      return;
    }
    this.last.setNext(node);
    this.last = node;
  }
}

const beanPriority = (tokens, rules) => {
  while (true) {
    const { current } = tokens;
    const { next } = current;
    if (!next) break;
    const { next: last } = next;
    const rule = rules[current.item.type]?.[next.item.type];
    if (rule) {
      if (last) {
        const nextRule = rules[next.item.type]?.[last.item.type];
        if (nextRule && nextRule.priority > rule.priority) {
          tokens.next();
          continue;
        }
      }
      current.item = rule.value(current.item, next.item);
      tokens.unlinkNext();
      tokens.current = current.prev || current;
      continue;
    }
    tokens.current = next;
  }
  return tokens;
};

const beanNoPriority = (tokens, rules) => {
  while (true) {
    const { current } = tokens;
    const { next } = current;
    if (!next) break;
    const rule = rules[current.item.type]?.[next.item.type];
    if (rule) {
      current.item = rule.value(current.item, next.item);
      tokens.unlinkNext();
      tokens.current = current.prev || current;
      continue;
    }
    tokens.current = next;
  }
  return tokens;
};

const bean = (tokens, rules, priorities = true) => {
  return priorities
    ? beanPriority(tokens, rules)
    : beanNoPriority(tokens, rules);
};

const rule = (value, priority = 1) => ({ value, priority });
const map = (keys, rule) => Object.fromEntries(keys.map((key) => [key, rule]));
const mapfn = (keys, fn) => Object.fromEntries(keys.map(fn));
const pod = (type) =>
  rule((lhs, rhs) => ({
    type,
    lhs,
    rhs,
  }));

const list = (arr) => new List(arr);
const lPluck = (z) => z;
const rPluck = (_, z) => z;
const ignore = (...types) => map(types, rule(lPluck));
const name = (type, priority = 1) =>
  rule((lhs, rhs) => ({ lhs, rhs, type }), priority);

const merge = (...objects) => {
  const result = {};
  for (const object of objects) {
    for (const [key, value] of Object.entries(object)) {
      if (result[key]) result[key] = { ...result[key], ...value };
      else result[key] = value;
    }
  }
  return result;
};

module.exports.rule = rule;
module.exports.map = map;
module.exports.mapfn = mapfn;
module.exports.pod = pod;
module.exports.bean = bean;
module.exports.List = List;
module.exports.list = list;
module.exports.lPluck = lPluck;
module.exports.rPluck = rPluck;
module.exports.ignore = ignore;
module.exports.name = name;
module.exports.merge = merge;
