# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.7.13] - 2026-02-14

### Fixed

- Incorrect Python imports.

### Changed

- Results are not cleared at the end of No UI simulations.

## [1.7.12] - 2025-08-02

### Fixed

- The no-UI simulation bar chart now shows the correct teams.

## [1.7.10] - 2025-07-06

### Fixed

- Alerts are now included in simulation info.
- Running simulations from the CLI works now.

## [1.7.9] - 2025-07-06

### Breaking Changes

- You need to remove the Python `script` tags from the `index.html` file, they are automatically created with the library now!

## [1.7.8] - 2025-07-06

### Changed

- Dependencies are now updated, in particular we switched to React 19.

## [1.7.7] - 2025-07-06

### Fixed

- Calling Python functions from JS now uses `callPromising` to enable async.

## [1.7.6] - 2025-07-06

### Breaking Changes

- Starting from `vite-plugin-code-battles@1.0.12`, you need to change your `index.html` to use the packed Python file instead of a custom configuration:
  ```html
  <script type="py" src="/scripts/packed.py"></script>
  <script type="py" src="/scripts/packed.py" worker name="worker"></script>
  ```

### Added

- The "Tournament Bot" picker is now an autocomplete input instead of a select to make it easier to find the bot to pick.

### Changed

- Auto-play is now disabled, since it made it hard to inspect the first seconds of a simulation and it broke the main game sound.
- The documentation template now looks a bit better.

## [1.7.5] - 2025-06-18

### Fixed

- The simulation would sometimes crash because of the `_step` being recursive.

## [1.7.4] - 2025-06-18

### Added

- Running No UI simulations in the round page and in the main page now shows an updating graph of the winners!

### Breaking Changes

- Users must now add the `@mantine/charts` and `recharts@2` dependencies. You are encouraged to update your dependencies to the versions specified in `package.json`.

## [1.7.3] - 2025-06-17

### Added

- Games can now set `configure_breakpoint_by_time` so that the breakpoint in the simulation page is measured in time and not in steps.

### Fixed

- The step button now works again.

## [1.7.2] - 2025-06-15

### Fixed

- No UI simulations were broken when simulation took a while.
- The round page could crash.

## [1.7.1] - 2025-06-03

### Added

- The game may now return a dictionary of game statistics in `get_statistics`.
- The round page now contains a table of the current round results which can be sorted by statistics returned from `get_statistics`.

### Fixed

- No UI simulation is now fixed.

## [1.7.0] - 2025-05-20

### Added

- The `run_bot_method` now returns the runtime of that method.

### Breaking Changes

- The `map` has now been generalized to `parameters`. Previous Code Battles configuration must be updated.

## [1.6.4] - 2025-04-30

### Added

- Invalid imports now show an alert.
- Bot names are now URL-encoded and separated by commas.
- `self.random` is now removed for `make_decisions`.
- Simulations now start automatically.

## [1.6.3] - 2024-12-27

### Fixed

- The `make_decisions_random` property is now correctly initialized.

## [1.6.2] - 2024-12-07

### Fixed

- Alerts are now shown even if they're created from the web worker. In particular, bot exception alerts are now visible.

## [1.6.1] - 2024-11-16

### Added

- The `GameCanvas` has a new `draw_rectangle` method which can fill/stroke a given rectangle.

## [1.6.0] - 2024-11-15

### Added

- You may now `pause` in `make_decisions` to let the bots pause the simulation in interesting frames!
- You may now use the `download_image` method instead of `download_images` to download a single image.

### Changed

- No UI simulations are now non-verbose by default, meaning alerts shouldn't be shown and sounds are not played (unless the new `force` parameter is specified).

### Fixed

- Canvas dimensions are now slightly improved.
- Documentation of web-only methods is now accurate by using `functools.wraps`.

## [1.5.8] - 2024-11-14

### Fixed

- Logs added immediately one after another now correctly added.
- Peer dependency on `dayjs` now specified correctly.

## [1.5.7] - 2024-11-12

### Fixed

- If the simulation randomness seed is set to "-" it still succeeds.
- `useLocalStorage` now updates falsy variables.
- Log viewer now doesn't reset all of the time.

## [1.5.6] - 2024-11-08

### Fixed

- Second simulation not working because start button would not bind to Python simulation start.
- Running simulation files which were generated locally now works because previous they did not have the correct `_logs`.

## [1.5.5] - 2024-11-08

### Added

- Support for output file in the CLI.

## [1.5.4] - 2024-11-08

### Fixed

- Random differs on the browser (pyodide) and local (python) because of floating point stuff.

## [1.5.3] - 2024-11-08

### Fixed

- Infinite loop of `is_web`.

## [1.5.2] - 2024-11-08

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

