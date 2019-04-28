// TODO: write beef in beef/bean
function beef(string) {
    let rules = string.split('\n').filter(r => !!r);
    let model = [];
    rules.forEach(rule => {
        let match = rule.match(/^(.*?) (.*?) => (.*?)($| ({.*}))/);
        let lefts = match[1].split("|");
        let rights = match[2].split("|");
        let name = match[3];
        let make = match[5];
        if (make) {
            make = eval(`(left, right) => {
                let result = ${make};
                result.name = "${name}";
                return result;
            }`)
        }
        lefts.forEach(left => {
            rights.forEach(right => {
                if (!make) {
                    make = (left, right) => {
                        return { name: name, left: left, right: right }
                    }
                }
                model.push({ left, right, make })
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
                return tokens;
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
            console.log(util.inspect(tokens, { showHidden: false, depth: null }));
            throw "Ooopsies!"
        }
        i = matched ? 0 : i + 1;
    }
}

// DEBUG
const util = require("util");
const fs = require("fs");
const ClioLexer = require("../clio-lang/clio/lexer/lexer.js");

const source = fs.readFileSync("test.clio", { encoding: "utf8" });
const clioModel = fs.readFileSync("clio.beef", { encoding: "utf8" });

const tokens = ClioLexer(source)[1];
const model = beef(clioModel);

const cst = bean(model, tokens)[0];
console.log(util.inspect(cst, { showHidden: false, depth: null }));
