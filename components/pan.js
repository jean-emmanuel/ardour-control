const Widget = require('./widget')

module.exports = class Fader extends Widget {

    constructor(properties) {

        super({
            type: 'fader',
            design: 'compact',
            horizontal: true,
            range: {
                "min": 1,
                "max": 0
            },
            origin: 0.5,
            sensitivity: 0.5,
            doubleTap: true,
            css: 'class: pan_fader',
            ...properties
        })

    }

}
