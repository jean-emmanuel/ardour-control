const ardour = require('./ardour.js')

class Surface {

    constructor(sessionFile, options) {

        this.options = options
        app.on('open', (data, client)=>{
            setTimeout(()=>{
                // setTimeout: execute after default callback
                this.send('/SESSION/OPEN', sessionFile, {clientId: client.id})
            })
        })

        this.timeouts = {}

    }

    timeout(id, callback, timeout=0) {
        if (this.timeout[id]) clearTimeout(this.timeout[id])
        this.timeout[id] = setTimeout(callback, timeout)
    }

    send(address, ...args) {
        receive('custom_module', 'null', address, ...args)
    }

    edit(widget_id, data) {
        this.receive('/EDIT', widget_id, data, {noWarning: true})
    }

    init() {
        ardour.setSurface(this.options)
    }

    in(data) {

    }

    out(data) {

    }

}

module.exports = Surface
