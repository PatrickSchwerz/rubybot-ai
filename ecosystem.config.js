module.exports = {
  apps: [{
    name: 'rubybot-ai',
    script: 'index.js',
    cwd: '/www/wwwroot/rubybot-ai',
    env: {
      PORT: 2997,
      AI_MODEL: 'deepseek-chat',
      DEEPSEEK_API_KEY: 'sk-53bb0d53c2bf4d0ab5d9686de0e9f1a3',
    },
  }],
};
