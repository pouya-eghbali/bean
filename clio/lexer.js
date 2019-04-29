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
                  raw: "-$"
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
                  raw: "+$"
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
                  raw: "-$"
                });
                indents.pop();
              }
            }
            tokens.push({
              name: "^",
              index: i + 1,
              raw: "^"
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
  tokens = tokens.filter(token => token.name != "_");
  let isCall = false;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (['map', 'pipe', 'set'].includes(token.name)) {
      if (isCall) {
        // insert call end token
        tokens = [...tokens.slice(0, i), {name: '!', index: i+1}, ...tokens.slice(i++)];
        //isCall = false;
      } else {
        isCall = true;
      }
    } else if (token.name == '_n') {
      if (isCall) {
        // check if it's a function:
        if (tokens[i + 1] && tokens[i + 1].name == "indent") {
          // find the matching dedent and insert call end there
          let count = 0;
          let j = 1;
          while (true) {
            let _token = tokens[i + j];
            if (!_token) {
              throw `Lexing error at ${i}`;
            }
            if (_token.name == "indent") {
              count++;
            } else if (_token.name == "dedent") {
              count--;
            }
            if (count == 0) {
              j++;
              tokens = [...tokens.slice(0, i+j), { name: '!', index: i + j + 1 }, ...tokens.slice(i++ + j)];
              break;
            }
            j++;
          }
        } else {
          // insert call end token        
          tokens = [...tokens.slice(0, i), { name: '!', index: i + 1 }, ...tokens.slice(i++)];
        }
        isCall = false;
      }
    }
  }
  tokens = tokens.filter(token => !["_n", "^"].includes(token.name));
  tokens.push({
    name: "eof",
    index: string.length,
    raw: "eof"
  });  
  return [true, tokens];
}

module.exports = lexer;
