class Ardour {

    constructor() {

        this.host = null
        this.port = null

        if (settings.read('send')) {
            [this.host, this.port] = settings.read('send')[0].split(':')
        } else {
            console.error('(ERROR) "send" option not set, OSC will not be able to communicate with Ardour')
        }

    }

    send(address, ...args) {
        if (this.port) send(this.host, this.port, address, ...args)
    }

    computeStripTypesBits(types={}) {

        var bits = 0

        if (types.AudioTracks) bits += 1
        if (types.MidiTracks) bits += 2
        if (types.AudioBusses) bits += 4
        if (types.MidiBusses) bits += 8
        if (types.VCAs) bits += 16
        if (types.Master) bits += 32
        if (types.Monitor) bits += 64
        if (types.FoldbackBusses) bits += 128
        if (types.Selected) bits += 256
        if (types.Hidden) bits += 512
        if (types.UseGroup) bits += 1024

        return bits

    }

    computeFeedbackBits(feedback={}) {

        var bits = 0

        if (feedback.Button) bits += 1
        if (feedback.Variable) bits += 2
        if (feedback.SSID) bits += 4
        if (feedback.Heartbeat) bits += 8
        if (feedback.Master) bits += 16
        if (feedback.BBT) bits += 32
        if (feedback.Timecode) bits += 64
        if (feedback.MeterDB) bits += 128
        if (feedback.Meter16Bit) bits += 256
        if (feedback.SignalPresent) bits += 512
        if (feedback.PositionInSamples) bits += 1024
        if (feedback.PositionInTime) bits += 2048
        if (feedback.SelectedChannel) bits += 8192
        if (feedback.ReplyV1) bits += 16384

        return bits

    }

    setSurface(userOptions={}) {

        var options = {
            'BankSize': 0,
            'StripTypes': {},
            'Feedback': {},
            'FaderMode': 1,
            'SendPageSize': 0,
            'PluginPageSize': 0,
            'ReplyPort': 0,
            'LinkSet': 0,
            'LinkID': 0
        }

        for (var k in options) {
            if (userOptions[k] !== undefined) {
                if (options[k] === undefined) {
                    console.error(`ardour.setSurface: unknown option ${k}`)
                } else {
                    options[k] = userOptions[k]
                }
            }
        }

        options.StripTypes = this.computeStripTypesBits(options.StripTypes)
        options.Feedback = this.computeFeedbackBits(options.Feedback)

        this.send('/set_surface', ...Object.values(options))

    }

}

module.exports = new Ardour()
