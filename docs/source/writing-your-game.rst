Writing Your Game
=================

In order to write your game, you should edit the Python implementation in `public/scripts`. You are encouraged to be **testing** your code **as** you are writing it,
by running it alongside editing it using ``bun run dev`` (i.e. edit your code and then check that it works like you expect it to).

.. note::
    If you start working on this before building or running the development server once (``bun run build`` or ``bun run dev``), you will not have the `code_battles` python library.

.. warning::
    Make sure to not edit the files in the `public/scripts/code_battles` directory as it's part of the components library, or the `files` element in the `public/config.json` file, as it is automatically generated.

Your game implementation begins in the `main.py` file. Your custom game will inherit from the `CodeBattles` class of the `code_battles` library, which provides methods to override, and binds to the React code.

Game Renderer
+++++++++++++

Code Battles aims to assist you in making the rendering as simple as possible. You are given a ``GameCanvas`` wrapper. This is how you should think of it:

- Given your map image file is X by Y pixels, your Game Canvas will be NX by Y pixels, where N is the number of boards. Override the `get_board_count` method to change this value, for example to have a board for each player.
- By overriding the `get_extra_height` method you can add extra height in the bottom, in pixels.
- The Game Canvas is responsible for scaling everything according to the actual size of the display, but you don't need to worry about this!

Now, the Game Canvas gives you the following methods:

- ``clear()`` to clear it and re-draw the player's maps. You should probably call this in the beginning of your ``render`` method.
- ``draw_text()`` to draw text. You can supply ``board_index`` if you want the `x, y` coordinates to be relative to said ``board_index`` (this can simplify your ``render`` method), otherwise set it to 0. Adding a custom font is explained later.
- ``draw_element()`` to draw images. You must download your asset images upon initialization, which is explained later. Then, you simply pass an image object and set its width (relative to the above X by Y board). Again you can supply a ``board_index`` or set it to 0.

Setup Functions
+++++++++++++++

You may use ``download_images`` inside your ``setup`` method.
This is a utility method which takes a list of images to download and returns a dictionary mapping from name to image.
For example, run ``self.images = await download_images([("Snake", "/public/images/snake.png")])``

In order to load additional fonts (which you can then use in the ``draw_text()`` method), you can simply call ``load_font()`` in your ``setup`` method.
Supply it with the url of your font, for instance, ``load_font("Assistant", "/fonts/assistant.ttf")``.