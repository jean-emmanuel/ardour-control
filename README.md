# Ardour Control

OSC Control Surface for Ardour.

## Requirements

- [Ardour](http://ardour.org/) v6.0
- [Open Stage Control](https://github.com/jean-emmanuel/open-stage-control) v1


*This is a work in progress*

*For Ardour v5.12 / OSC v0.49: https://github.com/jean-emmanuel/ardour-control/tree/v1.0*

## Features

- all tracks (using banking)
- transport
- plugins (ladspa-like generic ui)

## Getting started

- Enable OSC in ardour
- launch Open Stage Control :

```bash
# Running from sources:
npm start -- -l path/to/ardour.json -c path/to/ardour-plugins-module.js -s 127.0.0.1:3819

# Running from binaries:
open-stage-control -- -l path/to/ardour.json -c path/to/ardour-plugins-module.js -s 127.0.0.1:3819

```

## Troubleshooting

If the interface doesn't sync properly, try increasing the udp buffer size :
https://www.systutorials.com/241303/how-to-enlarge-linux-udp-buffer-size/
```bash
# check buffer size
cat /proc/sys/net/core/rmem_default

# change buffer size
sudo sysctl -w net.core.rmem_default=262144


```
## Screenshots

![a](https://user-images.githubusercontent.com/5261671/80501610-eb489880-896f-11ea-86bc-82c5c40ffeb2.png)
