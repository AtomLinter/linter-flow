# linter-flow

A better linter plugin for Facebook's [Flow JS typechecker](http://flowtype.org/). It works on the fly.

![linter-demo](https://naman.s3.amazonaws.com/linter-flow-plus/linter-flow-plus.gif)

### How to use it

1. Install [flow](http://flowtype.org/)
2. Confirm the `linter` package is installed and enabled for Atom.
3. Create a .flowconfig file at the root of your repo. (You can use the `flow init` command to do so)
4. Install the linter-flow package using the installer screen or the `apm` cli.
5. At the `/* @flow */` to any JS file to enable on-the-fly flow linting when you code!

Please see the official flow website for details on how to install flow. My recommendation is to clone down the repo and build it yourself for the best ES6 support possible.

### Why not X?

1. A similarly named package: linter-flow-plus is now a mirror. The development happens for both packages in parallel.
2. IDE-flow works relatively well, but it doesn't lint on-the-fly and doesn't integrate with the linter package.
3. Nuclide has too many problems for now to be reliable. It also involves installing a large number of other packages.

linter-flow is made to be a simple package that does one thing well.

Please Note: IDE-flow and Nuclide provide other features such as autocomplete, type definitions on hover etc. Please continue to use those services for those features. (possibly in addition to linter-flow)

### features

linter-flow has on-the-fly linting using flow types. It also provides clean errors with traces.
(Only Nuclide's trace support is based on the same code, and no other implementation exists currently)

### Limitations

This linter currently does not support Hack. Though the linter just uses the flow-cli and hack support should be trivial to add, I'm not a Hack/PHP developer and I can't test that it actually works. I would welcome if someone was to add support for Hack to this package and test it.

This linter only works within files with the `/* @flow */` comment. Linter errors from other files are currently ignored and settings to lint all files without the comment are currently ignored. I would love some feedback to fix this issue.

### Known issues

If you open a project without `.flowconfig` file with this linter enabled, you will get a dumb error on line 1, saying `Error Linting`.

### Contribution and Feedback

This project started off as I was frustrated with IDE-flow and Nuclide. I hunted around in the flow-cli, made a PR to add documentation about it to their website, and create a few issues on Nuclide, and eventually, after seeing how straightforward writing a linter was, creating this linter over the night.

Since then, I depend on this linter on a daily basis for all my Javascript development, and so I maintain this project. There are a few rough edges and I would love some help to fix them.

So please, make contributions and create github issues. In the issues, please complain about problems and missing features.
