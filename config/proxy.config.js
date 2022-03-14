/**
 * Paste Alter-ID right here
 * ⬇️⬇️⬇️⬇️⬇️⬇️
 */
const ALTER_ID = 'alter-616147938321633280'

const proxyConfig = {
  '/@O': {
    target: `https://o-${ALTER_ID}.six.dian-dev.com`,
    // target: 'https://o.dian-stable.com',
    changeOrigin: true,
    cookieDomainRewrite: { '*': '' },
    rewrite: path => path.replace(/^\/@O/, '/'),
  },
  '/@Z': {
    target: `https://z-${ALTER_ID}.six.dian-dev.com`,
    // target: 'https://z.dian-stable.com',
    changeOrigin: true,
    cookieDomainRewrite: { '*': '' },
    rewrite: path => path.replace(/^\/@Z/, '/'),
  },
  '/@DCAPI': {
    target: `https://dcapi-${ALTER_ID}.six.dian-dev.com`,
    // target: 'https://dcapi.dian-stable.com',
    // target: 'http://10.254.3.53:8080',
    changeOrigin: true,
    cookieDomainRewrite: { '*': '' },
    rewrite: path => path.replace(/^\/@DCAPI/, '/'),
  },
}

module.exports.proxyConfig = proxyConfig
