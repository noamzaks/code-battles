Writing Your Game
=================

In order to write your game, you should edit the Python implementation in `public/scripts`. You are encouraged to be **testing** your code **as** you are writing it,
by running it alongside editing it using ``yarn dev`` (i.e. edit your code and then check that it works like you expect it to).

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

Game State
++++++++++

Your ``GameState`` class **must** contain an ``is_over()`` method which returns a ``bool``, a ``time`` property which is a ``float`` in seconds, and a ``active_player_indices`` property which is a list of the indices of the active players.

Game Simulator
++++++++++++++

Your game simulator may make use of the following provided functions:

- ``play_sound``: Call this function with a ``str`` representing your sound filename (without .mp3). Your file should be stored in `public/sounds/`. For instance, place a `moo.mp3` file in `public/sounds` and call ``play_sound("moo")``.

Game Renderer
+++++++++++++

Code Battles aims to assist you in making the rendering as simple as possible. As a result, you are given a ``GameCanvas`` wrapper. This is how you should think of it:

- Given your map image file is X by Y pixels, your Game Canvas will be NX by Y pixels, where N is the number of players.
- In your `game_config.py` you can customize an extra height in the bottom, in pixels.
- The Game Canvas is responsible for scaling everything according to the actual size of the display, but you don't need to worry about this!

Now, the Game Canvas gives you the following methods:

- ``clear()`` to clear it and re-draw the player's maps. You should probably call this in the beginning of your ``render`` method.
- ``draw_text()`` to draw text. You can supply ``player_index`` if you want the `x, y` coordinates to be relative to said ``player_index`` (this can simplify your ``render`` method), otherwise set it to 0. Adding a custom font is explained later.
- ``draw_element()`` to draw images. You must download your asset images upon initialization, which is explained later. Then, you simply pass an image object and set its width (relative to the above X by Y board). Again you can supply a ``player_index`` or set it to 0.

Downloading Images
++++++++++++++++++

You may use ``download_images`` inside your ``initial_setup`` method (inside `game_config.py`). This is a utility method which takes a list of images to download and returns a dictionary mapping from name to image. For example, run ``image_dict = await download_images([("Snake", "/public/images/snake.png")])``

Then, return the dictionary as part of the array from the ``initial_setup`` method. After doing this, Code Battles will give it as an additional argument to your ``render`` method - so you can simply add a ``image_dict`` parameter after the rest!

.. note::
    If you want to see how this is implemented, look at ``ui.py`` which includes most of Code Battles.

Loading Fonts
+++++++++++++

In order to load additional fonts (which you can then use in the ``draw_text()`` method), you can simply call ``load_font()`` in your ``initial_setup`` method.
Supply it with the url of your font, for instance, ``load_font("Assistant", "/fonts/assistant.ttf")``