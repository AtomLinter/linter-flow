# Changelog

## v5.5.0

*   Update `flow-bin` to v0.30.0.

## v5.1.0

*   Reverted the flow comment detection as the new implementation was buggy.

*   Throttle the number of atom notifications, and limit console logs to dev
    mode.

## v5.0.0

**Bug Fixes**

*   Removed the flow server management as it was causing problems.
*   Instead do a `flow stop` on deactivate.
*   Improved type checking using flow of the code base.

**Enhancements**

*   Change to a more strict check for a flow comment, to reduce false-positives
