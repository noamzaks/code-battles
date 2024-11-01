# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.3.0] - 2024-11-01

### Breaking Changes

- You must now add the following to your `index.html` inside `<body>`:

  ```html
  <script
    type="py"
    src="/scripts/main.py"
    config="/config.json"
    worker
    name="worker"
  ></script>
  ```

### Added

- The `make_decisions` method is now called in a web worker and the entire game is able to be rendered before playing. If a frame's decisions hadn't been made and the user tries to play, the browser will sleep until it's ready (currently a fixed amount of time).
- The `GameCanvas` has a new `draw_line` method which can draw a given line.

## [1.1.0] - 2024-10-21

### Added

- You can now configure the globals given to each bot (e.g. `time`, `math`, `random`, etc.) with `configure_bot_globals()`.
- You may now also specify extra width with `configure_extra_width` which works similarly to `configure_extra_height`.
- The `GameCanvas` has a new `draw_circle` method which can fill/stroke a given circle.

## [1.0.0] - 2024-09-27

### Added

- The Python library and pdoc template are now part of the library.
- There is a new vite plugin to include the Python library, update PyScript configuration etc. named vite-plugin-code-battles.
- The documentation now also has a reference of the Python library.
- Breaking changes will now be versioned correctly.

```

```
