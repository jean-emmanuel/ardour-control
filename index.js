var surface

surface = require('./monitors/monitors.js')
// surface = require('./mixer/mixer.js')


module.exports = {

    oscInFilter: surface.in.bind(surface),
    oscOutFilter: surface.out.bind(surface),
    init: surface.init.bind(surface),

}
