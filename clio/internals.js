/*

    Clio scopes

        Functions have read-only access to outer scope
        Each function has its own scope

*/

const ScopeHandler = {
    get(scope, name) {
        if (scope.names.hasOwnProperty(name)) {
            return scope.names[name]
        }
        if (scope.outer) {
            return scope.outer.get(name)
        }
        throw 'Not defined'
    },
    set(scope, name, value) {
        scope[name] = value
    }
}

class Scope {
    constructor(names, outer) {
        this.names = names || {}
        this.outer = outer
        return new Proxy(ScopeHandler, this)
    }
}

/*

    Clio functions

        Functions have their own scope
        Functions should be async and lazy
        Functions are all wrapped

*/

class Parameter {
    constructor(definition) {
        this.isKwVariadic = definition.startsWith('**')
        this.isVariadic = !this.isKwVariadic && definition.startsWith('*')
        this.name = definition.replace(/\*+/, '')
    }
    is(name) {
        return this.name == name
    }
}

class ArgParser {
    constructor(parameters, defaults) {
        this.parameters = parameters.map(function (parameter) {
            return new Parameter(parameter)
        })
        this.KwVariadic = this.kwVariadic()
        this.Variadic = this.variadic()
        this.Positionals = this.KwVariadic ? this.parameters.slice(0, -1) : this.parameters
        this.defaults = defaults || {}
    }
    parse(args, kwargs) {
        args = args || []
        kwargs = kwargs || {}
        const parsed = Object.assign({}, this.defaults)
        if (this.KwVariadic) {
            parsed[this.KwVariadic.name] = {}
        }
        if (this.Variadic) {
            parsed[this.Variadic.name] = []
        }
        for (const [key, value] of Object.entries(kwargs)) {
            if(this.has(key)) {
                parsed[key] = value
            } else if (this.KwVariadic) {
                parsed[this.KwVariadic.name][key] = value
            } else {
                throw `Function does not accept ${key}`
            }
        }
        const zipped = args.map((arg, index) => [arg, this.Positionals[index]])
        for (const [arg, parameter] of zipped) {
            if (parameter && !parameter.isVariadic && parsed.hasOwnProperty(parameter.name)) {
                throw `Got multiple values for ${parameter.name}`
            }
            if (this.Variadic && (!parameter || parameter.isVariadic)) {
                parsed[this.Variadic.name].push(arg)
            } else if (!parameter) {
                throw `Too many arguments passed to function`
            } else {
                parsed[parameter.name] = arg
            }
        }
        if (Object.keys(parsed).length != this.parameters.length) {
            throw `Not enough arguments were provided`
        }
        return parsed
    }
    has(name) {
        for (const parameter of this.parameters) {
            if (parameter.is(name)) {
                return true
            }
        }
        return false
    }
    kwVariadic() {
        for (const parameter of this.parameters) {
            if (parameter.isKwVariadic) {
                return parameter
            }
        }
        return false
    }
    variadic() {
        for (const parameter of this.parameters) {
            if (parameter.isVariadic) {
                return parameter
            }
        }
        return false
    }
}

class Fn {
    constructor(fn, name, parameters, outer) {
        this.fn = fn
        this.name = name
        this.parser = new ArgParser(parameters)
        this.outer = outer
    }
    call(args, kwargs) {
        const inner = this.parser.parse(args, kwargs)
        inner.__data = args.length ? args[0] : kwargs
        const scope = new Scope(inner, this.outer)
        return new Lazy(fn, scope)
    }
}

/*

    Clio lazy values

*/

class Lazy {
    constructor(fn, scope) {
        this.fn = fn
        this.scope = scope
    }
    value() {
        return this.fn(scope)
    }
}


/*

    Clio debugger (runtime exception handling)

*/

class Debug {
    constructor(lazy, location) {
        this.location = location;
        this.lazy = lazy
    }
    value() {
        try {
            return this.lazy.value()
        } catch (error) {
            throw `Exception at ${this.location}:\n\n${error}`
        }
    }
}

/* tests */

const myArgParser = new ArgParser(['a', 'b', '*args', '**kwargs'])
console.log(
    myArgParser.parse(
        [],
        {
            'b': 10,
            'a': 20
        }
    )
);
