const ardour = require('../modules/ardour.js')
const Surface = require('../modules/surface.js')

const Panel = require('../components/panel.js')
const Strip = require('../components/strip.js')

class Mixer extends Surface {

    constructor() {

        super(__dirname + '/monitors.json', {
            StripTypes: {
                FoldbackBusses: true,
                // since /strip/receives is broken
                // we need to see all strips that might send to foldback busses
                // and use /strip/sends instead
                AudioBusses: true,
                AudioTracks: true,
            },
            Feedback: {
                Button: true,
                Variable: true,
                ReplyV1: true,
            },
        })

        this.strips = {}
        this.receives = {}

        this.receive_ssid = 0

    }

    in(data) {

        if (data.address === '/strip/list' && data.args.length === 0) {
            this.strips = {}
        }

        else if (data.address === '/strip/name') {
            var [ssid, name] = data.args.map(x=>x.value)
            if (name === '0.00') return // ardour bug ?
            if (this.strips[ssid]) return
            this.strips[ssid] = {
                name: name,
                receives: {},
                id: ssid
            }
            this.timeout('queryReceives', ()=>{
                for (var ssid in this.strips) {
                    // broken in ardour
                    // ardour.send('/strip/receives', {type: 'i', value: parseInt(ssid)})
                    // use sends instead
                    ardour.send('/strip/sends', {type: 'i', value: parseInt(ssid)})
                }
            }, 1000)
        }

        else if (data.address === '/strip/pan_type') {
            var [ssid, pan] = data.args.map(x=>x.value)
            if (pan === 'none') this.strips[ssid].is_monitor = true
        }


        else if (data.address === '/strip/sends') {
            if (data.args.length > 1) {
                var a = data.args.map(x=>x.value),
                    receive_ssid = a[0]

                for (var i = 1; i < a.length; i += 5) {
                    var [ssid, name, sendId, enabled, gain] = a.slice(i, i+6)

                    this.strips[ssid].receives[receive_ssid] = {
                        name: this.strips[receive_ssid].name,
                        enabled: enabled,
                        gain: gain,
                        id: receive_ssid
                    }
                }

                this.timeout('buildUi', ()=>{
                    this.buildUi()
                },1000)
            }
        }


        else if (data.address === '/strip/receives') {
            // broken in ardour
        }


        return data
    }

    buildUi() {

        var tabs = this.strips.values.filter(x=>x.is_monitor).map(strip=>new Panel({
            type: 'tab',
            id: `monitor_tab_${strip.id}`,
            label: strip.label,
            layout: 'horizontal',
            widgets: [
                new Panel({
                    id: `receives_panel_${strip.id}`,
                    layout: 'horizontal',
                })
                new Strip({
                    id: `master_strip_${strip.id}`,
                    label:  strip.name,
                    widgets: [
                        
                    ]
                })
            ]
        }))

        for

    }

}

module.exports = new Mixer()
