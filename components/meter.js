const Widget = require('./widget')

module.exports = class Fader extends Widget {

    constructor(properties) {

        super({
            type: 'fader',
            design: 'compact',
            padding: 0,
            range: {
                "min": -193,
                "6%": -60,
                "12%": -50,
                "20%": -40,
                "30%": -30,
                "42%": -20,
                "60%": -10,
                "80%": 0,
                "max": 6
            },
            gradient: {
                0: 'green',
                0.2: 'green',
                0.42: 'lime',
                0.5: 'lime'
                0.6: 'yellow',
                0.8: 'yellow',
                1: 'red',
            },
            class: 'meter',
            ...properties
        })

    }

}
