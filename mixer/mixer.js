const ardour = require('../modules/ardour.js')
const Surface = require('../modules/surface.js')

class Mixer extends Surface {

    constructor() {

        super(__dirname + '/mixer.json', {
            BankSize: 8,
            StripTypes: {
                AudioTracks: true,
                MidiTracks: true,
                AudioBusses: true,
                MidiBusses: true,
                VCAs: true,
            },
            Feedback: {
                Button: true,
                Variable: true,
                Master: true,
                ReplyV1: true,
                Timecode: true,
                MeterDB: true
            },
        })

        this.strip_names = {}
        this.plugin_names = {}

        this.active_strip_ssid = 0
        this.active_strip_data = {}

    }

    // send plugin list to strip
    createPluginsList(ssid, plugins) {
        var widgets = []
        for (var i in plugins) {
            widgets.push({
                type: 'panel',
                mode: 'horizontal',
                label: false,
                scroll: false,
                padding: 0,
                height: 20,
                alphaStroke: 0,
                innerPadding: false,
                widgets: [
                    {
                        type: 'button',
                        mode: 'toggle',
                        padding: -1,
                        width: 20,
                        value: plugins[i].active,
                        alphaStroke: 0,
                        alphaFillOff: 0.15,
                        alphaFillOn: 0.15,
                        id: `strip_${ssid}_plugin_${plugins[i].id}_active`,
                        label: '^circle',
                        css: '--color-text: var(--color-background); --color-text-on: var(--color-widget);',
                        address: '/strip/plugin/activate',
                        preArgs: [ssid, plugins[i].id],
                        typeTags: 'i'
                    },
                    {
                        type: 'button',
                        mode: 'tap',
                        padding: -1,
                        expand: true,
                        alphaStroke: 0,
                        alphaFillOff: 0.15,
                        linkId: '>> plugin_modal',
                        id: `strip_${ssid}_plugin_${plugins[i].id}`,
                        label: plugins[i].name,
                        address: '/strip/plugin/descriptor',
                        preArgs: ssid,
                        doubleClick: true,
                        on: plugins[i].id
                    }
                ]
            })

        }

        this.edit('plugins_' + ssid, {
            widgets: widgets,
        })

    }


    // send plugin gui to plugin modal
    createPluginsGui() {

        var widgets = [],
            toggles = {type:'panel', layout: 'vertical', label: false, alphaStroke: 0, widgets:[], width:200, contain: false, innerPadding: false, padding: 0},
            faders =  {type:'panel', layout: 'vertical', label: false, alphaStroke: 0, widgets:[], expand:true, contain: false, innerPadding: false, padding: 0}

        for (var j in this.active_strip_data.parameters) {
            if (256 & this.active_strip_data.parameters.flags) continue
            let w = paramsToWidget(this.active_strip_data.parameters[j], this.active_strip_data.id)
            if (!w) continue
            var pane = w.type === 'button' ? toggles : faders
            pane.widgets.push({
                type: 'panel',
                height: 35,
                layout: 'horizontal',
                label: false,
                padding: 0,
                alphaStroke: 0,
                widgets: [
                    {
                        type: 'text',
                        value: this.active_strip_data.parameters[j].name,
                        label: false,
                        expand: w.type === 'button',
                        width: 100,
                        alphaStroke: 0,
                        alphaFillOff: 0,
                        align: 'left',
                        colorWidget: '#ccc'
                    },
                    w
                ]
            })
            if (w.type === 'fader') {
                pane.widgets[pane.widgets.length-1].widgets.push({
                    type: 'input',
                    label: false,
                    width: 80,
                    unit: w.unit,
                    linkId: w.linkId,
                    alphaStroke: 0,
                    bypass: true
                })
            }
        }

        if (toggles.widgets.length) widgets.push(toggles)
        if (faders.widgets.length) widgets.push(faders)

        this.edit('plugin_modal', {
            widgets: widgets,
            popupLabel: this.strip_names[this.active_strip_ssid] + ' ^chevron-right ' + this.plugin_names[this.active_strip_ssid + '_' + this.active_strip_data.id]
        })

    }


    // convert ardour plugin parameters to widget definition
    paramsToWidget(params, ppid) {

        var type =  ! (128 & params.flags) ? 'meter' :
                    1 & params.flags ? 'dropdown' :
                    64 & params.flags ? 'button' : 'fader',
            unit = !params.unit.length ? '' :
                    params.unit.replace(/\%\.?[0-9]*[a-z]{1}/,'')
                               .replace('%%','%').trim()

        var widget = {
            id: 'plugin_' + ppid + '_param_' + params.id,
            label: params.name,
            type: type,
            address: '/strip/plugin/parameter',
            preArgs: [this.active_strip_ssid, ppid, params.id],
            precision: 2 & params.flags ? 0 : 2,
            logScale: 4 & params.flags ? true : false,
            unit: unit,
            value: params.value,
            alphaStroke: 0,
            alphaFillOff: 0.1
        }

        if (type == 'button') {
            widget.mode = 'toggle'
            widget.off = params.min
            widget.on = params.max
            widget.width = 35
            widget.padding = 1
            widget.label = false
        } else if (type == 'fader'){
            widget.horizontal = true
            widget.label = false
            widget.expand = true
            widget.design = 'compact'
            widget.linkId = 'plugin_param_' + this.active_strip_ssid + '_' + ppid + '_' + params.id
            if (params.pips.length) {
                var range = {}
                for (var n in params.pips) {
                    let val = params.pips[n][0],
                        percent = 100 * (params.pips[n][0] - params.min) / (params.max - params.min) + '%',
                        label = params.pips[n][1]
                    range[percent] = {}
                    range[percent][label] = val
                }
                widget.range = range
            } else {
                widget.pips = false
                widget.range = {min:params.min, max:params.max}
            }
        } else if (type == 'meter'){
            return // Useless since ardour doesn't send plugin feedback
        } else if (type == 'dropdown'){
            widget.label = false
            widget.expand = true
            widget.values = {}
            if (params.pips.length) {
                for (var n in params.pips) {
                    widget.values[params.pips[n][1]] = params.pips[n][0]
                }
            } else {
                return
            }

        } else {
            return
        }

        return widget
    }

    in(data) {
        var {address, args, host, port} = data

        if (address === '/strip/name') {
            if (args[1].value === ' ') {
                this.createPluginsList(args[0].value, [])
            } else {
                ardour.send('/strip/plugin/list', args[0].value)
            }
            this.strip_names[args[0].value] = args[1].value
        }

        else if (address == '/strip/plugin/list') {
            let plugins = [],
                ssid = args[0].value

            for (let i=1; i<args.length; i+=3) {
                let plugin = {
                    id: args[i].value,
                    name: args[i+1].value,
                    active: args[i+2].value
                }
                this.plugin_names[ssid + '_' + plugin.id] = plugin.name

                plugins[args[i].value] = plugin

            }
            this.createPluginsList(ssid, plugins)
            return
        }

        else if (address == '/strip/plugin/descriptor' && args.length > 1) {

            this.active_strip_data.id = args[1].value
            this.active_strip_data.parameters[args[2].value] = {
                id: args[2].value,
                name: args[3].value,
                flags: args[4].value,
                dataType: args[5].value,
                min: args[6].value,
                max: args[7].value,
                unit: args[8].value,
                pips: []
            }

            // skip scale infos
            var nPips = args[9].value
            for (var p=0; p < nPips * 2; p += 2) {
                this.active_strip_data.parameters[args[2].value].pips.push([args[10 + p].value, args[10 + p + 1].value])
            }

            // get current value
            this.active_strip_data.parameters[args[2].value].value = args[10 + nPips * 2].value

            return
        }

        else if (address == '/strip/plugin/descriptor_end' && args.length > 1) {

            this.createPluginsGui()

            return
        }


        // else if (address == '/strip/sends') {
        //     sends = []
        //
        //     if (args.length > 1) {
        //         for (var i=1; i<args.length; i+=5) {
        //             sends.push({
        //                 targetId: args[0].value,
        //                 name: args[i+1].value,
        //                 id: args[i+2].value,
        //                 gain: args[i+3].value,
        //                 enabled: args[i+4].value
        //             })
        //         }
        //     }
        //     createSendsReceivesGui('Send')
        //     return
        // }
        //
        // else if (address == '/strip/receives') {
        //     sends = []
        //
        //     if (args.length > 1) {
        //         for (var i=0; i<args.length; i+=5) {
        //             sends.push({
        //                 targetId: args[i].value,
        //                 name: args[i+1].value,
        //                 id: args[i+2].value,
        //                 gain: args[i+3].value,
        //                 enabled: args[i+4].value
        //             })
        //         }
        //     }
        //     createSendsReceivesGui('Receive')
        //     return
        // }

        return {address, args, host, port}
    }

    out(data) {

        var {address, args, host, port} = data

        if (address === '/strip/plugin/list') {

            if (!args[1].value) {
                // empty plugin panel
                plugins = []
                this.createPluginsList()
                return
            } else {
                // query plugin list
                this.active_strip_ssid = args[0].value
                args.pop()
            }
        }

        else if (address === '/strip/plugin/descriptor') {

            this.active_strip_ssid = args[0].value
            this.active_strip_data = {id: 0, parameters:  {}}

        }

        else if (address === '/plugin_modal' && args[0].value === 0) {
            this.edit('plugin_modal', {
                label: false,
                widgets: []
            })
        }

        else if (address === '/strip/plugin/activate') {

            if (!args[2].value) address = '/strip/plugin/deactivate'
            args.pop()

        }


        // else if (address === '/receives_panel' && args[0].value === 1) {
        //     sendToArdour(
        //         '/strip/receives',
        //         {type:'i', value:this.active_strip_ssid}
        //     )
        // }
        //
        // else if (address === '/sends_panel' && args[0].value === 1) {
        //     sendToArdour(
        //         '/strip/sends',
        //         {type:'i', value:this.active_strip_ssid}
        //     )
        // }

        return {address, args, host, port}

    }

}

module.exports = new Mixer()
