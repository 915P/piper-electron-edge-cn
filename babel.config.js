module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        },
        modules: 'commonjs' // Transform ES modules to CommonJS for Jest
      }
    ]
  ]
};
