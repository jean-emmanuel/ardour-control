# Ardour Control

OSC Control Surface for Ardour. Based on Len Ovens' control surface.

## Requirements

- Ardour 5.9
- [Open Stage Control](https://github.com/jean-emmanuel/open-stage-control) (build from master source, release soon)

## Features

- all tracks (using banking)
- transport
- plugins (ladspa-like generic ui)
- sends/receives

## Getting started

- Enable OSC in ardour
- launch Open Stage Control :

```bash
# Running from sources:
npm start -- -l path/to/ardour.js -c path/to/ardour-plugins-module.js -s 127.0.0.1:3819

# Running from binaries:
open-stage-control -- -l path/to/ardour.js -c path/to/ardour-plugins-module.js -s 127.0.0.1:3819

# Where 127.0.0.1:3819 is ardour's listening 'ip address:osc port'

```
