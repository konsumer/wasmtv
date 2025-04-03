This is a place to store ideas about a wasm-driven media-management system.

The idea is that it's a bunch of wasm plugins and a thin host to load all the plugins and trigger different events.

Initially, I will make the host in nodejs and the plugins in C, but this may change later, and part of the point of wasm plugins is that they can be made in anything.

```bash
# install deps and tools
npm i

# build all plugins
npm run build:plugins

# first demo app that uses plugins to collect IPTV streams for TV shows you added to favorites, on a schedule
npm run tv
```
