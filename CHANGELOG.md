# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

- The CLI now works again and supports the new randomness seed option and execution from a file.

## [1.5.1] - 2024-11-07

### Fixed

- Log function now automatically casts to `str` if `text` is not a string.
- Logs are now persistent across rerenders, instead of previously being unstable.
- Round page fixes.

## [1.5.0] - 2024-11-07

### Added

- Simulation files are now seeded.
- When running a simulation, you may now choose a specific randomness seed.

### Changed

- You should now use `self.make_decisions_random` for any randomness usage in `make_decisions`.
- The `random` global for bots is now a seeded pseudorandom generator initialized from the simulation seed by default (this can be customized with `configure_bot_globals`).
- You should now use `self.random` to make your game deterministic for a given seed.

### Fixed

- Running N times now resets the `Results` to make sure the alert at the end is of exactly N times.

## [1.4.0] - 2024-11-06

### Breaking Changes

- You must now add `@mantine/dropzone` to your dependencies.

### Added

- You can now download and upload simulation files. You may also use `configure_version` to invalidate previous simulation files, and choose a custom name for your main class (inheriting from `CodeBattles`) so your website can check that simulation files are of your game.
- You may now specify a varying render rate with `configure_render_rate` for render-intensive code battle games.
- The web worker rendering time is now shown.

### Changed

- The error when `play_sound` fails is now more readable.

### Fixed

- The canvas dimensions in showcase mode are now more accurate (with regard to the height).

## [1.3.0] - 2024-11-01

### Breaking Changes

- You must now add the following to your `index.html` inside `body`:

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
