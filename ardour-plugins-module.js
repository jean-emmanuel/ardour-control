(function(){

    NO_PLUGIN_TEXT = 'No plugin found'
    NO_SEND_TEXT = 'No send found'
    NO_RECEIVE_TEXT = 'No receive found'

    const dedupeWatch = {
        delay: 250,
        duration: 1000,
        active: false,
        timeout: null,
        activate: ()=>{
            clearTimeout(dedupeWatch.timeout)
            dedupeWatch.active = true
            dedupeWatch.timeout = setTimeout(()=>{
                dedupeWatch.active = false
            }, Math.max(dedupeWatch.delay * 2, dedupeWatch.duration))
        }
    }
    const dedupeWatchTriggers = [
        '/strip/select',
        '/bank_up',
        '/bank_down',
        '/set_surface'
    ]

    const dedupeAddress = {
        '/strip/expand': {default:0, timeouts: []},
        '/strip/name': {default:' ', timeouts: []},
        '/strip/mute': {default:0, timeouts: []},
        '/strip/solo': {default:0, timeouts: []},
        '/strip/recenable': {default:0, timeouts: []},
        '/strip/record_safe': {default:0, timeouts: []},
        '/strip/monitor_input': {default:0, timeouts: []},
        '/strip/monitor_disk': {default:0, timeouts: []},
        '/strip/gui_select': {default:0, timeouts: []},
        '/strip/select': {default:0, timeouts: []},
        '/strip/gain': {default:-193, timeouts: []},
        '/strip/trimdB': {default:0, timeouts: []},
        '/strip/pan_stereo_position': {default:0.5, timeouts: []},
        '/strip/meter': {default:-193, timeouts: []}
    }

    // Do whatever you want, initialize some variables, declare some functions, ...

    var plugins = [],
        sends = [],
        select = 0,
        expand = 0

    // Shorthand for osc sending to ardour
    var [host, port] = settings.read('targets')[0].split(':')
    send = (address, ...args)=>{
        for (var i in args) {
            if (args[i].type) {
                args[i] = {type:args[i].type,value:args[i].value}
            } else if (parseFloat(args[i]) == args[i]) {
                args[i] = {type:'f',value:args[i]}
            } else {
                args[i] = {type:'s',value:args[i]}
            }
        }
        sendOsc({address:address, args:args, host:host, port:port})
    }

    receive = (address, ...args)=>{
        for (var i in args) {
            if (parseFloat(args[i]) == args[i]) {
                args[i] = {type:'f',value:args[i]}
            } else {
                args[i] = {type:'s',value:args[i]}
            }
        }
        receiveOsc({address:address, args:args, host:host, port:port})
    }

    getCurrentStrip = ()=>{
        return expand || select
    }

    createPluginsList = ()=>{
        var widgets = []
        for (var i in plugins) {

            let hstrip = {
                type:'strip',
                label: false,
                height: 60,
                widgets: [
                    {type:'modal', id: 'plugin_' + plugins[i].id, label:plugins[i].name, address:'/strip/plugin/descriptor', preArgs: [getCurrentStrip(), plugins[i].id], css: 'flex:1'},
                ]
            }
            widgets.push(hstrip)

        }
        receive('/EDIT', 'plugins_panel', JSON.stringify({
            widgets: widgets
        }))
    }

    createPluginsGui = (id)=>{

        var panel = {type:'strip', label:false, widgets:[], height:'100%', width:'100%', horizontal:true, spacing: 5},
            toggles = {type:'strip', label: false, widgets:[], height:'100%', width:100},
            faders = {type:'strip', label: false, widgets:[], height:'100%', css:'flex:1'},
            meters = {type:'strip', label: false, widgets:[], height:'100%', css:'font-size:80%', horizontal:true}

        for (var j in plugins[id].parameters) {
            if (256 & plugins[id].parameters.flags) continue
            let w = paramsToWidget(plugins[id].parameters[j], plugins[id].id)
            if (w.type == 'meter') {
                meters.widgets.push({
                    type:'strip', label: false, width:25,
                    widgets: [
                        {type: 'text', value: plugins[id].parameters[j].name, label: false, vertical: true, height: 100},
                        w
                    ]
                })
            }
            if (w.type == 'fader') {
                faders.widgets.push({
                    type:'strip', label: false, horizontal: true, height: 60,
                    widgets: [
                        {type: 'text', value: plugins[id].parameters[j].name, label: false, wrap: true},
                        w
                    ]
                })
            }
            if (w.type == 'toggle') toggles.widgets.push(w)
        }

        meters.width = Math.min(meters.widgets.length * 25, 150)

        if (toggles.widgets.length) panel.widgets.push(toggles)
        if (faders.widgets.length) panel.widgets.push(faders)
        if (meters.widgets.length) panel.widgets.push(meters)

        receive('/EDIT', 'plugin_' + id, JSON.stringify({
            widgets: [panel],
            bypass: true
        }))
    }

    createSendsReceivesGui = (dir)=>{
        var widgets = []

        for (var i in sends) {


            var strip = {type:'strip', label:`${dir} ${i+1}`, widgets:[], height:'100%', width:'80rem'}
            strip.widgets.push({
                type:'text',
                id: 'send_name_' + sends[i].id + '_to_' + sends[i].targetId,
                label: false,
                height:40,
                address: '/strip/send_name',
                preArgs: [sends[i].targetId, sends[i].id],
                value: sends[i].name
            })
            strip.widgets.push({
                type:'fader',
                id: 'send_' + sends[i] + '_to_' + sends[i].targetId,
                label: false,
                address: '/strip/send/gain',
                preArgs: [sends[i].targetId, sends[i].id],
                range: {"min": {"inf": -193},"6%": -60,"12%": -50,"20%": -40,"30%": -30,"42%": -20,"60%": -10,"80%": 0,"max": 6},
                unit: 'dB',
                value: sends[i].gain,
                css:'flex:1'
            })
            strip.widgets.push({
                type:'toggle',
                id: 'send_toggle_' + sends[i].id + '_to_' + sends[i].targetId,
                label: 'Enable',
                address: '/strip/send/enable',
                preArgs: [sends[i].targetId, sends[i].id],
                height:40,
                off:0,
                on:1,
                precision:0,
                value: sends[i].enabled
            })
            widgets.push(strip)

        }

        receive('/EDIT', dir.toLowerCase() + 's_panel', JSON.stringify({
            widgets: widgets.length ?
            widgets : [
                {type:'text',label:false, width:'100%', height:'100%',value: dir == 'Send' ? NO_SEND_TEXT : NO_RECEIVE_TEXT}
            ]
        }))
    }


    paramsToWidget = (params, ppid)=>{
        var type = ! (128 & params.flags) ? 'meter' :
                    64 & params.flags ? 'toggle' : 'fader',
            unit = !params.unit.length ? '' :
                    params.unit.replace(/\%\.?[0-9]*[a-z]{1}/,'')
                               .replace('%%','%').trim()

        var widget = {
            id: 'plugin_' + ppid + '_param_' + params.id,
            label: params.name,
            type: type,
            address: '/strip/plugin/parameter',
            preArgs: [getCurrentStrip(), ppid, params.id],
            precision: 2 & params.flags ? 0 : 2,
            logScale: 4 & params.flags ? true : false,
            unit: unit,
            value: params.value
        }

        if (type == 'toggle') {
            widget.off = params.min
            widget.on = params.max
            widget.width = '100%'
            widget.height = 50
        } else if (type == 'fader'){
            widget.compact = true
            widget.horizontal = true
            widget.pips = false
            widget.label = false
            widget.css = 'flex:1'
            // if (params.pips.length) {
            //     var range = {}
            //     for (var n in params.pips) {
            //         let val = params.pips[n][0],
            //             percent = 100 * (params.pips[n][0] - params.min) / (params.max - params.min) + '%',
            //             label = params.pips[n][1]
            //         range[percent] = {}
            //         range[percent][label] = val
            //     }
            //     widget.range = range
            // } else {
                widget.range = {min:params.min, max:params.max}
            // }
        } else if (type == 'meter'){
            widget.label = false
            widget.css = 'flex:1'
            widget.range = {min:params.min, max:params.max}
        }


        return widget
    }

    return {
        init: function(){
            // this will be executed once when the osc server starts
        },
        oscInFilter:function(data){
            // Filter incomming osc messages

            var {address, args, host, port} = data

            if ((address == '/strip/select' || address == '/strip/expand') && args.length == 2 && args[1].value == 1) {
                var sel = getCurrentStrip()
                if (address == '/strip/select') select = args[0].value
                if (address == '/strip/expand') expand = args[0].value
                if (sel !== getCurrentStrip()) {
                    send(
                        '/strip/plugin/list',
                        {type:'i', value:getCurrentStrip()}
                    )
                }
            }

            if (address == '/select/expand' && args[0].value == 0) {
                var sel = getCurrentStrip()
                expand = 0
                if (sel !== getCurrentStrip()) {
                    send(
                        '/strip/plugin/list',
                        {type:'i', value:getCurrentStrip()}
                    )
                }
            }

            if (address == '/strip/sends') {
                sends = []

                if (args.length > 1) {
                    for (var i=1; i<args.length; i+=5) {
                        sends[i] = {
                            tagetId: args[i].value,
                            name: args[i+1].value,
                            id: args[i+2].value,
                            gain: args[i+3].value,
                            enabled: args[i+4].value
                        }
                    }
                }
                createSendsReceivesGui('Send')
                return
            }

            if (address == '/strip/receives') {
                sends = []

                if (args.length > 1) {
                    for (var i=0; i<args.length; i+=5) {
                        sends[i] = {
                            tagetId: args[i].value,
                            name: args[i+1].value,
                            id: args[i+2].value,
                            gain: args[i+3].value,
                            enabled: args[i+4].value
                        }
                    }
                }
                createSendsReceivesGui('Receive')
                return
            }

            if (address == '/strip/plugin/list') {
                plugins = []
                for (var i=1; i<args.length; i+=3) {

                    let plugin = {
                        id: args[i].value,
                        name: args[i+1].value,
                        active: args[i+2],
                        parameters: []
                    }

                    plugins[args[i].value] = plugin

                }
                createPluginsList()
                return
            }

            if (address == '/strip/plugin/descriptor' && args.length > 1) {

                if (args[0].value != getCurrentStrip()) return

                var plugin = plugins[args[1].value]

                // console.log(plugin)
                if (!plugin) return

                plugin.parameters[args[2].value] = {
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
                for (var p=0; p < nPips; p += 2) {
                    plugin.parameters[args[2].value].pips.push([args[10 + p].value, args[10 + p + 1].value])
                }

                // get current value
                plugin.parameters[args[2].value].value = args[10 + nPips * 2].value

                return
            }

            if (address == '/strip/plugin/descriptor_end' && args.length > 1) {
                if (args[0].value != getCurrentStrip()) return
                createPluginsGui(args[1].value)

                return
            }

            if (dedupeAddress[address] && args.length === 2 && dedupeWatch.active) {

                var strip = args[0].value,
                    value = args[1].value

                clearTimeout(dedupeAddress[address].timeouts[strip])

                if (value === dedupeAddress[address].default) {

                    dedupeAddress[address].timeouts[strip] = setTimeout(()=>{
                        receiveOsc({address, args, host, port})
                    }, dedupeWatch.delay)

                    return

                }

            }


            // return data if you want the message to be processed
            return {address, args, host, port}

        },
        oscOutFilter:function(data){
            // Filter outgoing osc messages
            var {address, args, host, port} = data

            if (dedupeWatchTriggers.includes(address)) {
                dedupeWatch.activate()
            }

            if (address === '/receives_panel' && args[0].value === 1) {
                send(
                    '/strip/receives',
                    {type:'i', value:getCurrentStrip()}
                )
            }
            if (address === '/sends_panel' && args[0].value === 1) {
                send(
                    '/strip/sends',
                    {type:'i', value:getCurrentStrip()}
                )
            }
            if (address === '/strip/plugin/descriptor') {
                if (args[2].value === 1) {
                    args.pop()
                } else {return}
            }

            // return data if you want the message to be and sent
            return {address, args, host, port}
        }
    }

})()
