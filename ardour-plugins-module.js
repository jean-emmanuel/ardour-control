STRIP_NAMES = {}
PLUGIN_NAMES = {}
PLUGIN = {}
CURRENT_SSID = 0

// Shorthand for osc sending to ardour
var [host, port] = settings.read('send')[0].split(':')
_send = (address, ...args)=>{
    send(host, port, address, ...args)
}

_receive = (address, ...args)=>{
    receive(host, port, address, ...args)
}

// send plugin list to strip
function createPluginsList(ssid, plugins) {
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

    _receive('/EDIT', 'plugins_' + ssid, {
        widgets: widgets,
    })

}

// send plugin gui to plugin modal
function createPluginsGui() {

    var widgets = [],
        toggles = {type:'panel', layout: 'vertical', label: false, alphaStroke: 0, widgets:[], width:200},
        faders =  {type:'panel', layout: 'vertical', label: false, alphaStroke: 0, widgets:[], expand:true}

    for (var j in PLUGIN.parameters) {
        if (256 & PLUGIN.parameters.flags) continue
        let w = paramsToWidget(PLUGIN.parameters[j], PLUGIN.id)
        if (!w) continue
        var pane = w.type === 'button' ? toggles : faders
        pane.widgets.push({
            type: 'panel',
            height: 25,
            layout: 'horizontal',
            label: false,
            padding: 0,
            alphaStroke: 0,
            widgets: [
                {
                    type: 'text',
                    value: PLUGIN.parameters[j].name,
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

    _receive('/EDIT', 'plugin_modal', {
        widgets: widgets,
        label: STRIP_NAMES[CURRENT_SSID] + ' ^chevron-right ' + PLUGIN_NAMES[CURRENT_SSID + '_' + PLUGIN.id]
    })

}

// convert ardour plugin parameters to widget definition
function paramsToWidget(params, ppid) {

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
        preArgs: [CURRENT_SSID, ppid, params.id],
        precision: 2 & params.flags ? 0 : 2,
        logScale: 4 & params.flags ? true : false,
        unit: unit,
        value: params.value
    }

    if (type == 'button') {
        widget.mode = 'toggle'
        widget.off = params.min
        widget.on = params.max
        widget.width = 25
        widget.label = false
        widget.alphaFillOff = 0.15
    } else if (type == 'fader'){
        widget.horizontal = true
        widget.label = false
        widget.expand = true
        widget.design = 'compact'
        widget.linkId = 'plugin_param_' + CURRENT_SSID + '_' + ppid + '_' + params.id
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

app.on('sessionOpened', ()=>{
    // make client send config to ardour
    receive('/SET', 'connect', 1)
})

module.exports = {

    oscInFilter: function(data) {

        var {address, args, host, port} = data

        if (address === '/strip/name') {
            if (args[1].value === ' ') {
                createPluginsList(args[0].value, [])
            } else {
                _send('/strip/plugin/list', args[0].value)
            }
            STRIP_NAMES[args[0].value] = args[1].value
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
                PLUGIN_NAMES[ssid + '_' + plugin.id] = plugin.name

                plugins[args[i].value] = plugin

            }
            createPluginsList(ssid, plugins)
            return
        }

        else if (address == '/strip/plugin/descriptor' && args.length > 1) {

            PLUGIN.id = args[1].value
            PLUGIN.parameters[args[2].value] = {
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
                PLUGIN.parameters[args[2].value].pips.push([args[10 + p].value, args[10 + p + 1].value])
            }

            // get current value
            PLUGIN.parameters[args[2].value].value = args[10 + nPips * 2].value

            return
        }

        else if (address == '/strip/plugin/descriptor_end' && args.length > 1) {
            console.log(args)
            createPluginsGui()

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

    },

    oscOutFilter: function(data) {

        var {address, args, host, port} = data

        if (address === '/strip/plugin/list') {
            console.log(args)

            if (!args[1].value) {
                // empty plugin panel
                plugins = []
                createPluginsList()
                return
            } else {
                // query plugin list
                CURRENT_SSID = args[0].value
                args.pop()
            }
        }

        else if (address === '/strip/plugin/descriptor') {

            CURRENT_SSID = args[0].value
            PLUGIN = {id: 0, parameters:  {}}

        }

        else if (address === '/plugin_modal' && args[0].value === 0) {
            receive('/EDIT', 'plugin_modal', {
                label: false,
                widgets: []
            })
        }

        else if (address === '/strip/plugin/activate') {

            if (!args[2].value) address = '/strip/plugin/deactivate'
            args.pop()

        }


        // else if (address === '/receives_panel' && args[0].value === 1) {
        //     _send(
        //         '/strip/receives',
        //         {type:'i', value:CURRENT_SSID}
        //     )
        // }
        //
        // else if (address === '/sends_panel' && args[0].value === 1) {
        //     _send(
        //         '/strip/sends',
        //         {type:'i', value:CURRENT_SSID}
        //     )
        // }

        return {address, args, host, port}

    }

}
