# bean
Bean Parser Engine

## Clio

`clio` directory contains the new Clio lexer / parser. To try it out do:

```
cd clio
node parser.js
```

## How does this work?

Bean grammars (are written in beef language and) have a binary like format (the name bean comes from here). Each grammar has a left and a right, if `.name` of two consecutive tokens (lexing result) matches `.name` of the left and right rules, then it's a match.

For example, if we have this rule:

```
number add => math_start
math_start number => math_end
```

and have these tokens:

```
number add number
```

it will result in:

```
math_start number
```

and then

```
math_end
```

Basically, bean will keep left reducing your list of tokens based on the grammar you provide. You can see a complete example in `clio` directory.

## Tree manipulation

By default a rule will yield a token icnluding the rule's name and left and right matched tokens. For example:

```
number add => math_start
```

will result in:

```
{
    name: "math_start",
    left: // left token, contents of `number` in this case,
    right: // right token, contents of `add` in this case
}
```

however you can manipulate this result on parse time. For example:

```
number add => math_start {lhs: left}
```

will result in:

```
{
    name: "math_start",
    lhs: // left token
}
```

You can see a complete example in clio directory.

## Parsing errors

Parser returns an array as result. If there are no errors first item in array will be `true`, otherwise it'll be `false`. The parser keeps reducing the tokens until there's only one token left, if more than one token is left and there is no match for any of the rules in the grammar, the parser will assume a parsing error.

Due to the fact that bean grammars are simply left / right rules, having the left side you always know what's expected next. This way you can easily raise the appropriate errors and print appropriate messages.
