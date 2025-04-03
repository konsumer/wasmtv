// this demo app will load plugins and collect IPTV shows for you

import { loadPlugin } from './utils.js';

const plugins = {info_tvdb: await loadPlugin('info_tvdb')}

for (const p of Object.values(plugins)) {
  if (p.on_load) {
    p.on_load()
  }
}
