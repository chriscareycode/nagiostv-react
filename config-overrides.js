/* config-overrides.js */

// module.exports = function override(config, env) {
//   // do stuff with the webpack config...
//   return config
// }

// for react fast refresh
const { override } = require('customize-cra')
const { addReactRefresh } = require('customize-cra-react-refresh')

module.exports = override(addReactRefresh())
