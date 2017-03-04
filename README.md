# linter-flow

Lightweight alternative to Facebook's Flow plugin for [facebook/flow](http://flowtype.org/).

![linter-demo](https://naman.s3.amazonaws.com/linter-flow-plus/linter-flow-plus.gif)

## Installation

* Install [flow](http://flowtype.org/docs/getting-started.html#installing-flow)
* `flow init`
* `apm install linter-flow`

## Settings

You can configure linter-flow by editing ~/.atom/config.cson (choose Open Your Config in Atom menu) or in Preferences:

```cson
'linter-flow':
  'executablePath': 'flow'
```

* `executablePath`: Absolute path to the Flow executable on your system.

### Why not X?

linter-flow is made to be a lightweight package that does one thing well.

1. A similarly named package: linter-flow-plus is now a mirror. The development happens for both packages in parallel.
2. IDE-flow works relatively well, but it doesn't lint on-the-fly and doesn't integrate with the linter package.
3. Nuclide has too many problems for now to be reliable. It also involves installing a large number of other packages.

Please Note: IDE-flow and Nuclide provide other features such as autocomplete, type definitions on hover etc. Please continue to use those services for those features. (possibly in addition to linter-flow)

### Limitations

This linter currently does not support Hack. Though the linter just uses the flow-cli and hack support should be trivial to add, I'm not a Hack/PHP developer and I can't test that it actually works. I would welcome if someone was to add support for Hack to this package and test it.

## Contributing

If you would like to contribute enhancements or fixes, please do the following:

1. Fork the plugin repository
2. Hack on a separate topic branch created from the latest `master`
3. Commit and push the topic branch
4. Make a pull request
5. Welcome to the club!

Please note that modifications should follow these coding guidelines:

* Indent is 2 spaces with `.editorconfig`
* Code should pass `eslint` linter with the provided `.eslintrc`
* Vertical whitespace helps readability, don’t be afraid to use it

**Thank you for helping out!**
