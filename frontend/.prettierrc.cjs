module.exports = {
  singleQuote: true,
  trailingComma: 'es5',
  arrowParens: 'always',
  printWidth: 120,
  tabWidth: 2,
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  importOrder: [
    "^[react]",
    "^./hooks",
    "^~/icons",
    "^@(?!/)",
    "^@/entities",
    "^@/features",
    "^@/widget",
    "^@/shared",
    "^./ui",
    "^[./]"
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};