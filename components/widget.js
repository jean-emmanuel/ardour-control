module.exports = class Widget {

    constructor(properties) {

        this.properties = properties

    }

    toJSON() {

        var props = {...this.properties}

        for (let script of ['onCreate', 'onValue', 'onTouch', 'onDraw', 'onResize']) {
            if (typeof this[scriot] === 'function') {
                let code = this[script].toString(),
                    start = code.indexOf('{')
                code = code.substr(start, code.length - start)
                props[script] = code
                console.log(code)
            }
        }

        return JSON.stringify(props)

    }

}
