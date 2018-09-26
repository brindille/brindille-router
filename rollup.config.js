// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'index.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  },
  plugins: [
    resolve(),
    commonjs({
      // non-CommonJS modules will be ignored, but you can also
      // specifically include/exclude files
      include: 'node_modules/**',  // Default: undefined
      // these values can also be regular expressions
      // include: /node_modules/

      // if false then skip sourceMap generation for CommonJS modules
      sourceMap: false,  // Default: true

      // explicitly specify unresolvable named exports
      // (see below for more details)
      // namedExports: { './module.js': ['foo', 'bar' ] },  // Default: undefined
    })
  ]
};