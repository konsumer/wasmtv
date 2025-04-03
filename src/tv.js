// this demo app will load plugins and collect IPTV shows for you

import { loadPlugin } from './utils.js'

const plugins = { info_tvdb: await loadPlugin('info_tvdb') }

for (const p of Object.values(plugins)) {
  if (p.on_load) {
    p.on_load()
  }
}

const FileInfo = plugins.info_tvdb.mem.struct({
  name: 'Uint32',
  lib: 'Uint32'
})

// here is example of passing FileInfo to plugins
function handle_found_file(library, name) {
  for (const p of Object.values(plugins)) {
    if (p.on_file_found) {
      const f = new FileInfo({
        name: p.mem.setString(name),
        lib: p.mem.setString(library)
      })
      p.on_file_found(f._address)
      p.free(f.name)
      p.free(f.lib)
      p.free(f._address)
    }
  }
}

handle_found_file('movies', 'somefile.mp4')
