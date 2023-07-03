Writing Your Game
=================

In order to write your game, you should edit the Python implementation in `public/scripts`.
The files you need to edit are:

- `game_state.py` which includes a class representing the state of your game at any given time.
- `game_simulator.py` which simulates a single step of your game, by changing the properties of the game state object.
- `game_renderer.py` which renders the state of your game on a canvas. A canvas is just a simple Python wrapper around the HTML canvas.
- `api.py` which includes the public-facing API of your game.
- `api_implementation.py` which includes the implementation of your API. Do your best to not include vulnerabilities.
- `game_config.py` if you want additional control for things.

.. note::
    You are encouraged to put your assets in `public/images`, `public/sounds`, etc.

.. warning::
    If you add more Python files to organize your game, you must change `public/pyscript.toml` to include them, since PyScript fetches Python files manually.