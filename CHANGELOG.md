## v5.0.0

#### Bug Fixes

- Removed the flow server management as it was causing problems.
- Instead do a `flow stop` on deactivate.
- Improved type checking using flow of the code base.

#### Enhancements

- Change to a more strict check for a flow comment, to reduce false-positives
