module.exports = {
  presets: [['@dian/babel-preset', {
    'preset-env': process.env.NODE_ENV === 'production' ? {} : false, // 本地开发优化（可选）
    'preset-react': { runtime: 'automatic' },
  }]],
}
