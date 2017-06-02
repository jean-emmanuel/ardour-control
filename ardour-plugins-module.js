(function(){

    NO_PLUGIN_TEXT = 'No plugin found'
    NO_SEND_TEXT = 'No send found'

    // Do whatever you want, initialize some variables, declare some functions, ...

    var plugins = [],
        sends = [],
        nPlugins = 0,
        select = 0,
        expand = 0

    // Shorthand for osc sending to ardour
    var [host, port] = settings.read('syncTargets')[0].split(':')
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

    createPluginsGui = ()=>{
        var tabs = []
        for (var i in plugins) {
            tabs[i] = {
                label: plugins[i].name,
                id: 'plugin_' + plugins[i].id,
                widgets: []
            }
            var panel = {type:'panel', label:false, widgets:[], height:'100%', width:'100%', css:'> .panel {display:flex;flex-direction:row};'},
                toggles = {type:'panel', label: '^toggle-on', widgets:[], height:'100%', width:'160rem', css:'> .panel {display:flex;flex-direction:column;flex-wrap: nowrap;};.widget {flex-shrink:0}'},
                faders = {type:'panel', label: '^sliders', widgets:[], height:'100%', width: '100%', css:' > .panel {display:flex;flex-direction:column;flex-wrap: nowrap;};.widget {flex-shrink:0}'}
                meters = {type:'panel', label: '^tachometer', widgets:[], height:'100%', width: '60%', css:' > .panel {display:flex;flex-direction:column;flex-wrap: nowrap;};.widget {flex-shrink:0}'}

            for (var j in plugins[i].parameters) {
                let w = paramsToWidget(plugins[i].parameters[j], plugins[i].id)
                if (w.type == 'meter') meters.widgets.push(w)
                if (w.type == 'fader') faders.widgets.push(w)
                if (w.type == 'toggle') toggles.widgets.push(w)
            }

            if (toggles.widgets.length) panel.widgets.push(toggles)
            if (faders.widgets.length) panel.widgets.push(faders)
            if (meters.widgets.length) panel.widgets.push(meters)
            tabs[i].widgets.push(panel)

        }
        receive('/EDIT', 'plugins_panel', JSON.stringify({
            tabs:tabs,
            widgets: tabs.length ? [] : [
                {type:'text',label:false, width:'100%', height:'100%',value:NO_PLUGIN_TEXT}
            ]
        }))
    }

    createSendsReceivesGui = (dir)=>{
        var widgets = []

        for (var i in sends) {


            var strip = {type:'strip', label:`${dir} ${i+1}`, widgets:[], height:'100%', width:'80rem', css:'> .panel {display:flex;flex-direction:row};'}
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
                value: sends[i].gain
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
                {type:'text',label:false, width:'100%', height:'100%',value:NO_SEND_TEXT}
            ]
        }))
    }


    paramsToWidget = (params, ppid)=>{
        var type = ! (128 & params.flags) ? 'meter' :
                    64 & params.flags ? 'toggle' : 'fader',
            unit = !params.unit.length ? '' :
                    params.unit.indexOf(' ') != -1 ?
                        params.unit.split(' ').pop() :
                        params.unit.split('').pop()
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
            widget.width = '100%'
            widget.height = 60
            widget.compact = true
            widget.horizontal = true
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
            widget.width = "100%"
            widget.height = 60
            widget.horizontal = true
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
                if (address == '/strip/select') select = args[0].value
                if (address == '/strip/expand') expand = args[0].value

                send(
                    '/strip/plugin/list',
                    {type:'i', value:getCurrentStrip()}
                )
                send(
                    '/strip/sends',
                    {type:'i', value:getCurrentStrip()}
                )
                send(
                    '/strip/receives',
                    {type:'i', value:getCurrentStrip()}
                )
            }

            if (address == '/select/expand' && args[0].value == 0) {
                expand = 0
                send(
                    '/strip/plugin/list',
                    {type:'i', value:getCurrentStrip()}
                )
                send(
                    '/strip/sends',
                    {type:'i', value:getCurrentStrip()}
                )
                send(
                    '/strip/receives',
                    {type:'i', value:getCurrentStrip()}
                )
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
            }

            if (address == '/strip/plugin/list') {
                plugins = []
                if (args.length > 1) {
                    nPlugins = (args.length - 1) / 2
                    for (var i=1; i<args.length; i+=2) {
                        send(
                            '/strip/plugin/descriptor',
                            args[0].value,
                            args[i].value
                        )
                    }
                } else {
                    nPlugins = 0
                    createPluginsGui()
                }
            }

            if (address == '/strip/plugin/descriptor' && args.length > 1) {
                var plugin = {
                    id: args[1].value,
                    name: args[2].value,
                    parameters: []
                }

                var i = 3, n = 0
                while (i < args.length) {

                    plugin.parameters[n] = {
                        id: args[i + 0].value,
                        name: args[i + 1].value,
                        flags: args[i + 2].value,
                        dataType: args[i + 3].value,
                        min: args[i + 4].value,
                        max: args[i + 5].value,
                        unit: args[i + 6].value,
                        pips: []
                    }

                    // increment
                    i += 7

                    // skip scale infos
                    var pips = args[i].value
                    i += 1
                    for (var p=0; p<pips; p += 1) {
                        plugin.parameters[n].pips.push([args[i].value, args[i+1].value])
                        i += 2
                    }

                    // get current value
                    plugin.parameters[n].value = args[i].value

                    // next param
                    i += 1
                    n += 1

                }

                plugins.push(plugin)

                if (plugins.length == nPlugins) {
                    createPluginsGui()
                }

            }


            // return data if you want the message to be processed
            return {address, args, host, port}

        },
        oscOutFilter:function(data){
            // Filter outgoing osc messages
            var {address, args, host, port} = data

            // same as oscInFilter

            // return data if you want the message to be and sent
            return {address, args, host, port}
        }
    }

})()
