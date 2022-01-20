module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-bitwise': 0,
    'import/prefer-default-export': 0,
    'no-mixed-operators': 0,
    'arrow-parens': 0,
    'no-console': 0,
  },
};
