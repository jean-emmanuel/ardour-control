const Widget = require('./widget')

module.exports = class Pips extends Widget {

    constructor(properties) {

        super({
            type: 'canvas',
            interaction: false,
            ...properties
        })

    }

    onCreate() {

        locals.range = {
            '0%': '-inf',
            '6%': -60,
            '12%': -50,
            '20%': -40,
            '30%': -30,
            '42%': -20,
            '51%': -15,
            '60%': -10,
            '70%': -5,
            '80%': '+0',
            '90%': '+3',
            '100%': '+6'
        }

    }

    onDraw() {

        ctx.beginPath()

        ctx.strokeStyle = cssVars['colorText']
        ctx.fillStyle = cssVars['colorText']
        
        ctx.textAlign = 'right'

        for (var k in locals.range) {
            var y = parseInt(k) / 100 * height,
                label = locals.range[k]

            ctx.moveTo(0, y)
            ctx.lineTo(width - 10, y)
            ctx.stroke()
            ctx.fillText(this.rangeLabels[i], width - 10, y)
        }

    }

}
