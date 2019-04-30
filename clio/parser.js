const {bean, beef} = require('../index');
// DEBUG
const util = require("util");
const fs = require("fs");
const ClioLexer = require("./lexer.js");

const source = fs.readFileSync("./test.clio", { encoding: "utf8" });
const clioModel = fs.readFileSync("./clio.beef", { encoding: "utf8" });

const tokens = ClioLexer(source)[1];
const model = beef(clioModel);

const parseResults = bean(model, tokens);
if (parseResults[0]) {
    const cst = parseResults[1][0];
    console.log(util.inspect(cst, { showHidden: false, depth: null }));
} else {
    // we need to write our parsing error function here
}

/*
var myvar;
((data) => {
    data = first(...data, ...args);
    data = second(...data, ...args);
    data = third(data[1], data[2]);
    myvar = data; 
})(data);
*/