# Ardour Control

OSC Control Surface for Ardour. Based on Len Ovens' control surface.

## Requirements

- Ardour 5.11
- [Open Stage Control](https://github.com/jean-emmanuel/open-stage-control) (>= v0.19.3)

## Features

- all tracks (using banking)
- transport
- plugins (ladspa-like generic ui)
- sends/receives

## Getting started

- Enable OSC in ardour
- launch Open Stage Control :

```bash
# Running from sources:
npm start -- -l path/to/ardour.js -c path/to/ardour-plugins-module.js -s 127.0.0.1:3819

# Running from binaries:
open-stage-control -- -l path/to/ardour.js -c path/to/ardour-plugins-module.js -s 127.0.0.1:3819

# Where 127.0.0.1:3819 is ardour's listening 'ip address:osc port'

```
# Screenshots

![a](https://cloud.githubusercontent.com/assets/5261671/26752006/6bbade10-4846-11e7-8199-ae89209f6502.png)

![b](https://cloud.githubusercontent.com/assets/5261671/26752005/6ba0480c-4846-11e7-933b-7fc7715a807e.png)
