export const defaultStyle = {
  'pretty-error': {
    display: 'block',
    marginLeft: '2',
  },
  'pretty-error > header': {
    display: 'block',
  },
  'pretty-error > header > title > kind': {
    background: 'red',
    color: 'bright-white',
  },
  'pretty-error > header > title > wrapper': {
    marginRight: '1',
    color: 'grey',
  },
  'pretty-error > header > colon': {
    color: 'grey',
    marginRight: 1,
  },

  'pretty-error > header > message': {
    color: 'bright-white',
  },

  'pretty-error > trace': {
    display: 'block',
    marginTop: 1,
  },

  'pretty-error > trace > item': {
    display: 'block',
    marginBottom: 1,
    marginLeft: 2,
    bullet: '"<grey>-</grey>"',
  },

  'pretty-error > trace > item > header': {
    display: 'block',
  },

  'pretty-error > trace > item > header > pointer > file': {
    color: 'bright-yellow',
  },

  'pretty-error > trace > item > header > pointer > colon': {
    color: 'grey',
  },

  'pretty-error > trace > item > header > pointer > line': {
    color: 'bright-yellow',
    marginRight: 1,
  },

  'pretty-error > trace > item > header > what': {
    color: 'white',
  },

  'pretty-error > trace > item > footer': {
    display: 'block',
  },

  'pretty-error > trace > item > footer > addr': {
    display: 'block',
    color: 'grey',
  },

  'pretty-error > trace > item > footer > extra': {
    display: 'block',
    color: 'grey',
  },
}

//TODO: check if different node versions contain different core module names
export const modulesList = [
  '_debugger.js',
  '_http_agent.js',
  '_http_client.js',
  '_http_common.js',
  '_http_incoming.js',
  '_http_outgoing.js',
  '_http_server.js',
  '_linklist.js',
  '_stream_duplex.js',
  '_stream_passthrough.js',
  '_stream_readable.js',
  '_stream_transform.js',
  '_stream_writable.js',
  '_tls_legacy.js',
  '_tls_wrap.js',
  'assert.js',
  'buffer.js',
  'child_process.js',
  'cluster.js',
  'console.js',
  'constants.js',
  'crypto.js',
  'dgram.js',
  'dns.js',
  'domain.js',
  'events.js',
  'freelist.js',
  'fs.js',
  'http.js',
  'https.js',
  'module.js',
  'net.js',
  'os.js',
  'path.js',
  'punycode.js',
  'querystring.js',
  'readline.js',
  'repl.js',
  'smalloc.js',
  'stream.js',
  'string_decoder.js',
  'sys.js',
  'timers.js',
  'tls.js',
  'tty.js',
  'url.js',
  'util.js',
  'vm.js',
  'zlib.js',
  'node.js',
]
