const Panel = require('./panel')

module.exports = class Strip extends Panel{

    constructor(properties) {

        var label = properties.label || ''
        delete properties.label

        super({
            layout: 'vertical',
            html: `<div class="strip-label">${properties.label}</div>`,
            ...properties
        })

    }

}
