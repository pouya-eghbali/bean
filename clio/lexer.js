const patterns = require("./patterns");

function lexer(string) {
  var tokens = [];
  var pattern, match, imatch, matched, _i, raw;
  var i = 0;
  var indents = [0];
  while (i < string.length) {
    matched = false;
    for (var name in patterns) {
      if (patterns.hasOwnProperty(name)) {
        pattern = patterns[name];
        match = string.slice(i).match(pattern);
        if (match != null) {
          raw = match[0];
          if (name == "_n") {
            raw = "\\n";
          }
          if (name != "emptyline" && name != "comment") {
            // just take out empty lines and comments
            tokens.push({
              name: name,
              index: i,
              raw: raw
            });
          } else if (name == "emptyline") {
            // so, we should check if this is an emptyline AND dedent, or just an emptyline
            // also, emptylines ARE new lines -_-
            var indent_after = string.slice(i + raw.length).match(patterns._);
            if (indent_after == null) {
              indent_after = 0;
            } else {
              indent_after = indent_after[0].length;
            }
            if (indents[indents.length - 1] > indent_after) {
              var dedents_pushed = 0;
              while (indents[indents.length - 1] > indent_after) {
                dedents_pushed += 1;
                tokens.push({
                  name: "_n",
                  index: i + 1,
                  raw: "\\n"
                });
                tokens.push({
                  name: "dedent",
                  index: i + 1,
                  raw: ""
                });
                indents.pop();
              }
            } else {
              tokens.push({
                name: "_n",
                index: i + 1,
                raw: "\\n"
              });
            }
          }
          if (name == "_n") {
            // new lines are special
            imatch = string.slice(i + match[0].length).match(patterns._);
            _i = imatch ? imatch[0].length : 0;
            if (indents[indents.length - 1] < _i) {
              if (
                tokens.length - 2 >= 0 &&
                tokens[tokens.length - 2].name == "colon"
              ) {
                tokens.push({
                  name: "indent",
                  index: i + 1,
                  raw: ""
                });
                indents.push(_i);
              }
            } else if (indents[indents.length - 1] > _i) {
              var dedents_pushed = 0;
              while (indents[indents.length - 1] > _i) {
                dedents_pushed += 1;
                if (dedents_pushed > 1) {
                  tokens.push({
                    name: "_n",
                    index: i + 1,
                    raw: "\\n"
                  });
                }
                tokens.push({
                  name: "dedent",
                  index: i + 1,
                  raw: ""
                });
                indents.pop();
              }
            }
            tokens.push({
              name: "^",
              index: i + 1,
              raw: ""
            });
          }
          i += match[0].length;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      //console.log(string.slice(i, i+30));
      //throw_error(string, `Lexing error`, i);
      throw `Lexing error at ${i}`;
      //return [false, tokens];
    }
  }
  // post processing
  /*
    Clio is white space sensitive at some places
    and white space insensitive at other places
    it's better to handle these at lexing time
    because it makes parsing much simpler
  */
  for (let i = 0; i < tokens.length - 1; i++) {
    const current = tokens[i];
    const next = tokens[i + 1];
    if (current.name == 'atsign') {
      if (!["_", "_n", "^", "dedent"].includes(next.name)) {
        tokens = [...tokens.slice(0, i + 1), { name: 'no_space', index: i + 2 }, ...tokens.slice(i++ + 1)];
      }
    } else if (next.name == "lbra") {
      if (!["_", "_n", "^", "dedent", "unpack"].includes(current.name)) {        
        tokens = [...tokens.slice(0, i + 1), { name: 'no_space', index: i + 2 }, ...tokens.slice(i++ + 1)];
      }
    }
  }
  //tokens = tokens.filter(token => token.name != "_");
  let isCall = false;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (['map', 'pipe', 'set'].includes(token.name)) {
      if (isCall) {
        // insert call end token
        tokens = [...tokens.slice(0, i), {name: 'ender', index: i+1}, ...tokens.slice(i++)];
        //isCall = false;
      } else {
        isCall = true;
      }
    } else if (token.name == '_n') {
      if (isCall) {
        // check if it's a function:
        if (tokens[i + 1] && tokens[i + 1].name == "indent") {
          // do nothing
        } else {
          // insert call end token (if next token isn't whitespace)
          if (tokens[i+1] && !['_', '^', '_n'].includes(tokens[i+1].name)) {            
            tokens = [...tokens.slice(0, i), { name: 'ender', index: i + 1 }, ...tokens.slice(i++)];
            isCall = false;
          } else {
            let j = i + 1
            while (tokens[++j] && tokens[j].name != '_') {}
            if (tokens[j]) {
              const whites = tokens[j].raw.length
              let indent = 0
              j = i + 1
              while (j-- && !['map', 'pipe', 'set'].includes(tokens[j].name)) {}
              while (j-- && tokens[j].name != '_n') {
                indent += tokens[j].raw.length
              }
              if (whites <= indent) {
                tokens = [...tokens.slice(0, i), { name: 'ender', index: i + 1 }, ...tokens.slice(i++)];
                isCall = false;
              }
            } else {
              tokens = [...tokens.slice(0, i), { name: 'ender', index: i + 1 }, ...tokens.slice(i++)];
              isCall = false;
            }
          }
        }
      }
    }
  }
  tokens = tokens.filter(token => !["_n", "^", "_"].includes(token.name));
  tokens.push({
    name: "eof",
    index: string.length,
    raw: "eof"
  });  
  return [true, tokens];
}

module.exports = lexer;
