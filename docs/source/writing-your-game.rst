Writing Your Game
=================

In order to write your game, you should edit the Python implementation in `public/scripts`. You are encouraged to be **testing** your code **as** you are writing it,
by running it alongside editing it using ``bun run dev`` (i.e. edit your code and then check that it works like you expect it to).

The following sections explain what things you _must_ implement.

.. note::
    If you start working on this before building or running the development server once (``bun run build`` or ``bun run dev``), you will not have the `code_battles` python library.

.. warning::
    Make sure to not edit the files in the `public/scripts/code_battles` directory as it's part of the components library, or the `public/config.json` file as it is automatically generated.

Your game implementation begins in the `main.py` file. Your custom game will inherit from the `CodeBattles` class of the `code_battles` library, which provides methods to override, and binds to the React code.

When using images/fonts/sounds from URLs, you can put your assets in the `public` directory like in the template, and it will be copied to your website, so for example `public/config.json` is available at the URL ``/config.json``.

Game Simulator
++++++++++++++

The game simulation is split up into a few parts. First, all of the state for a particular frame of the game must be contained inside the `GameState` class.

Then, you define the user-facing API in the `api.py` file. You may define classes which the users can work with, and the important class here is the context.
The implementation of the context will not be (directly) visible to the users. Instead, you will implement that context in the `api_implementation.py` file.

Your API implementation gets read access to your `GameState` and can change the corresponding `PlayerRequests` object, after checking for validity of API calls.

Then, you must override the ``make_decisions`` method which can make use of ``self.run_bot_method`` to update the `PlayerRequests` and perform the heavy part of your game logic which may take a long time.
You should return a `bytes` object which contains all of the decisions (so that games can be replayed later quicker).

.. note::
   You can make use of the pickle library if you don't need your simulation files to be small.

In the ``apply_decisions`` method, you get the current decisions `bytes` object and you must change the current ``self.state`` to be the one of the next frame.

Game Renderer
+++++++++++++

The ``render`` method should render the current state onto ``self.canvas``.

This is how you should think of the canvas:

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

For example:

.. code-block:: python

    self.images = await self.download_images([("Snake", "/images/snake.png")])

In order to load additional fonts (which you can then use in the ``draw_text()`` method), you can simply call ``load_font()`` in your ``setup`` method.
Supply it with the url of your font.

For example:

.. code-block:: python

    self.load_font("Assistant", "/fonts/assistant.ttf")