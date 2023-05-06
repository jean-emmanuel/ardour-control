const Widget = require('./widget')

module.exports = class Panel extends Widget {

    constructor(properties) {

        super({
            type: 'panel',
            lineWidth: 0,
            padding: 0,
            ...properties
        })

    }

}
