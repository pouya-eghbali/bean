const Rules = {
    main: tree => {
        return tree.program.map(walk).join('\n');
    },
    flow: tree => {
        let data = walk(tree.data);        
        let calls = tree.calls.map(walk);
        let vars = [];
        calls = calls.map(call => {
            if (call.variable) {
                vars.push(call.variable);
                return `${call.variable} = ClioFlowData`
            }
            if (call.func.startsWith(".")) {
                call.func = `ClioFlowData${call.func}`
            }
            let hasAtRef = false;
            for (let i = 0; i < call.args.length; i++) {
                const arg = call.args[i];
                if (arg.startsWith("ClioFlowData")) {
                    hasAtRef = true;
                    break;
                }
            }
            if (!hasAtRef) {                
                if (call.isMap) {
                    call.args.unshift("ClioFlowDataMapArg");
                } else {
                    call.args.unshift("ClioFlowData");
                }
            }
            if (call.isMap) {
                return `ClioFlowData = ClioFlowData.map(ClioFlowDataMapArg => {
                    return ${call.func}(${call.args.join(", ")})
                })`
            }
            return `ClioFlowData = ${call.func}(${call.args.join(", ")})`
        })
        
        let var_line = "";
        if (vars.length) {
            var_line = `let ${vars.join(", ")};`
        }

        return `${var_line}
        ((ClioFlowData) => {
            ${calls.join(";\n")};
            return ClioFlowData;
        })(${data})`
    },
    set_var: tree => {
        let name = walk(tree.var_name);
        return {variable: name}
    },
    math: tree => {
        let left = walk(tree.left);
        let right = walk(tree.right);
        return `(${left} ${tree.op} ${right})`
    },
    number: tree => {
        return tree.raw;
    },
    call: tree => {        
        let func = walk(tree.function);
        let args = (tree.args || []).map(walk);
        return { func, args, isMap: tree.isMap };
    },
    symbol: tree => {
        return tree.raw;
    },
    if_elif_else_statement: tree => {
        let If = walk(tree.if);
        let Elifs = tree.elifs.map(walk);
        let Else = walk(tree.else);
        return `
            ${If}
            ${Elifs.join("\n")}
            ${Else}`
    },
    if_statement: tree => {
        let condition = walk(tree.condition);
        let body = walk(tree.body);
        return `if (${condition}) ${body}`;
    },
    elif_statement: tree => {        
        let condition = walk(tree.condition);
        let body = walk(tree.body);
        return `else if (${condition}) ${body}`;
    },
    else_statement: tree => {
        let body = walk(tree.body);
        return `else ${body}`
    },
    block: tree => {
        return `{${tree.content.map(walk).join(";\n")}}`
    },
    comparison: tree => {
        if (tree.op == '=') {
            tree.op = '==';
        }
        return `(${walk(tree.left)} ${tree.op} ${walk(tree.right)})`;
    },
    function: tree => {
        let name = walk(tree.fname);
        let args = tree.args.map(walk).join(", ");
        let body = walk(tree.body);        
        return `function ${name} (${args}) ${body}`;
    },
    list: tree => {
        return `[${tree.items.map(walk).join(", ")}]`
    },
    word: tree => {
        return `"${tree.raw.slice(1)}"`
    },
    dictionary: tree => {
        let items = tree.items.map(item => item.map(walk)).map(item => `${item[0]}: ${item[1]}`).join(", \n");        
        return `{${items}}`
    },
    wrapped_expr: tree => {
        return `(${walk(tree.content)})`
    },
    one_line_quick_function: tree => {
        let args = tree.args.map(walk).join(", ");
        let body = walk(tree.body);
        return `((${args}) => ${body})`;
    },
    at_ref: tree => {
        let index = walk(tree.index);
        return `ClioFlowData[${index}]`;
    },
    method_call: tree => {        
        let func = tree.function;
        let args = (tree.args || []).map(walk);
        return { func, args, isMap: tree.isMap };
    },
    slicer: tree => {
        let data = walk(tree.data);
        let slicer = walk(tree.slicer);
        return `slice(data, slicer)`;
    },
    import_statement: tree => {
        return tree.imports.map(i => `require("${i.raw}")`).join(";\n") + ";";
    },
    import_as_statement: tree => {
        return tree.imports.map(i => `let ${tree.as.raw} = require("${i.raw}")`).join(";\n") + ";";
    },
    import_from_statement: tree => {
        let imports = tree.imports.map(i => i.raw).join(", ");
        return `let {${imports}} = require("${tree.from.raw}");`;
    },
    logical: tree => {
        let op = tree.op == 'and' ? '&&' : '||';
        return `(${walk(tree.left)} ${op} ${walk(tree.right)})`;
    },
    if_else_statement: tree => {
        let If = walk(tree.if);
        let Else = walk(tree.else);
        return `
            ${If}
            ${Else}`
    },
    range: tree => {
        let start = tree.start ? walk(tree.start) : 'null';
        let step = tree.step ? walk(tree.step) : 'null';
        let end = tree.end ? walk(tree.end) : 'null';
        return `range(${start}, ${end}, ${step})`
    },
    bool: tree => {
        return tree.raw;
    }
}

function walk(tree) {
    let name = tree.name;
    if (Rules[name]) {
        return Rules[name](tree);
    }
    const message = `no match for ${name}`;
    throw message;
}

module.exports = walk;