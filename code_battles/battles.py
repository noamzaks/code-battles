import asyncio
import base64
import json
import math
import time
import random
import sys
import traceback

from typing import Any, Dict, Generic, List, Optional, Tuple, TypeVar
from code_battles.utilities import (
    GameCanvas,
    console_log,
    download_image,
    set_results,
    show_alert,
    web_only,
    is_web,
)

try:
    import js
except Exception:
    pass

GameStateType = TypeVar("GameStateType")
APIImplementationType = TypeVar("APIImplementationType")
APIType = TypeVar("APIType")
PlayerRequestsType = TypeVar("PlayerRequestsType")


class CodeBattles(
    Generic[GameStateType, APIImplementationType, APIType, PlayerRequestsType]
):
    """
    The base class for a Code Battles game.

    You should subclass this class and override the following methods:

    - :meth:`.render`
    - :meth:`.make_decisions`
    - :meth:`.apply_decisions`
    - :meth:`.create_initial_state`
    - :meth:`.create_initial_player_requests`
    - :meth:`.get_api`
    - :meth:`.create_api_implementation`

    Then, bind your class to the React application by calling :func:`run_game` with an instance of your subclass.
    """

    player_names: List[str]
    """The name of the players. This is populated before any of the overridable methods run."""
    map: str
    """The name of the map. This is populated before any of the overridable methods run."""
    map_image: "js.Image"
    """The map image. This is populated before any of the overridable methods run."""
    canvas: GameCanvas
    """The game's canvas. Useful for the :func:`render` method. This is populated before any of the overridable methods run, but it isn't populated for background simulations, so you should only use it in :func:`render`."""
    state: GameStateType
    """The current state of the game. You should modify this in :func:`apply_decisions`."""
    player_requests: List[PlayerRequestsType]
    """The current requests set by the players. Should be read in :func:`make_decisions` (and probably serialized), and set by the API implementation."""

    background: bool
    """Whether the current simulation is occuring in the background (without UI)."""
    console_visible: bool
    """Whether the console is visible, i.e. the current simulation is not in showcase mode."""
    verbose: bool
    """Whether the current simulation is verbose, i.e. should show alerts and play sounds."""
    step: int
    """The current step of the simulation. Automatically increments after each :func:`apply_decisions`."""
    active_players: List[int]
    """A list of the currently active player indices."""

    _player_globals: List[Dict[str, Any]]
    _initialized: bool
    _eliminated: List[int]
    _sounds: Dict[str, "js.Audio"] = {}
    _decisions: List[bytes]

    def render(self) -> None:
        """
        **You must override this method.**

        Use the :attr:`canvas` attribute to render the current :attr:`state` attribute.
        """

        raise NotImplementedError("render")

    def make_decisions(self) -> bytes:
        """
        **You must override this method.**

        Use the current state and bots to make decisions in order to reach the next state.
        You may use :func:`run_bot_method` to run a specific player's method (for instance, `run`).

        This function may take a lot of time to execute.

        .. warning::
           Do not call any other method other than :func:`run_bot_method` in here. This method will run in a web worker.

        Do NOT update :attr:`state` or :attr:`step`.
        """

        raise NotImplementedError("make_decisions")

    def apply_decisions(self, decisions: bytes) -> None:
        """
        **You must override this method.**

        Use the current state and the specified decisions to update the current state to be the next state.

        This function should not take a lot of time.

        Do NOT update :attr:`step`.
        """

        raise NotImplementedError("apply_decisions")

    def get_api(self) -> APIType:
        """
        **You must override this method.**

        Returns the `api` module.
        """

        raise NotImplementedError("get_api")

    def create_initial_state(self) -> GameStateType:
        """
        **You must override this method.**

        Create the initial state for each simulation, to store in the :attr:`state` attribute.
        """

        raise NotImplementedError("create_initial_state")

    def create_initial_player_requests(self, player_index: int) -> PlayerRequestsType:
        """
        **You must override this method.**

        Create the initial player requests for each simulation, to store in the :attr:`player_requests` attribute.

        Should probably be empty.
        """

        raise NotImplementedError("create_initial_player_requests")

    def create_api_implementation(self, player_index: int) -> APIImplementationType:
        """
        **You must override this method.**

        Returns an implementation for the API's Context class, which provides users with access to their corresponding element in :attr:`player_requests`.

        You should also provide the API implementation with the state, but think about it as read-only.

        Should perform checking.
        """

        raise NotImplementedError("create_api_implementation")

    async def setup(self):
        """
        Optional setup for the simulation.

        For example, loading images using :func:`download_images` or fonts using :func:`load_font`.
        """

        pass

    def configure_extra_width(self) -> int:
        """Optionally add extra height to the right of the boards. 0 by default."""

        return 0

    def configure_extra_height(self) -> int:
        """Optionally add extra height below the boards. 0 by default."""

        return 0

    def configure_steps_per_second(self) -> int:
        """The number of wanted steps per second when running the simulation with UI. 20 by default."""

        return 20

    def configure_board_count(self) -> int:
        """The number of wanted boards for the game. 1 by default."""

        return 1

    def configure_map_image_url(self, map: str):
        """The URL containing the map image for the given map. By default, this takes the lowercase, replaces spaces with _ and loads from `/images/maps` which is stored in `public/images/maps` in a project."""

        return "/images/maps/" + map.lower().replace(" ", "_") + ".png"

    def configure_sound_url(self, name: str):
        """The URL containing the sound for the given name. By default, this takes the lowercase, replaces spaces with _ and loads from `/sounds` which is stored in `public/sounds` in a project."""

        return "/sounds/" + name.lower().replace(" ", "_") + ".mp3"

    def configure_bot_base_class_name(self) -> str:
        """A bot's base class name. CodeBattlesBot by default."""

        return "CodeBattlesBot"

    def configure_bot_globals(self) -> Dict[str, Any]:
        """
        Configure additional available global items, such as libraries from the Python standard library, bots can use.

        By default, this is math, time and random.

        .. warning::
           Bots will also have `api`, `context`, `player_api`, and the bot base class name (CodeBattlesBot by default) available as part of the globals, alongside everything in `api`.

           Any additional imports will be stripped (not as a security mechanism).
        """

        return {
            "math": math,
            "time": time,
            "random": random,
        }

    @web_only
    def download_images(
        self, sources: List[Tuple[str, str]]
    ) -> asyncio.Future[Dict[str, "js.Image"]]:
        """
        :param sources: A list of ``(image_name, image_url)`` to download.
        :returns: A future which can be ``await``'d containing a dictionary mapping each ``image_name`` to its loaded image.
        """
        from js import Image

        remaining_images: List[str] = []
        result = asyncio.Future()

        images: Dict[str, Image] = {}
        remaining = len(sources)

        def add_image(image):
            nonlocal remaining
            nonlocal remaining_images
            src = image.currentTarget.src
            to_remove = None
            for image in remaining_images:
                if image in src:
                    to_remove = image
                    break
            if to_remove:
                remaining_images.remove(to_remove)

            remaining -= 1
            if remaining == 0:
                result.set_result(images)

        for key, src in sources:
            image = Image.new()
            images[key] = image
            remaining_images.append(src)
            image.onload = lambda _: add_image(_)
            image.onerror = lambda _: print(f"Failed to fetch {src}")
            image.src = src

        return result

    @web_only
    async def load_font(self, name: str, url: str) -> None:
        """Loads the font from the specified url as the specified name."""
        from js import FontFace, document

        ff = FontFace.new(name, f"url({url})")
        await ff.load()
        document.fonts.add(ff)

    def run_bot_method(self, player_index: int, method_name: str):
        """
        Runs the specifid method of the given player.

        Upon exception, shows an alert (does not terminate the bot).
        """

        assert player_index in self.active_players

        try:
            exec(
                f"if player_api is not None: player_api.{method_name}()",
                self._player_globals[player_index],
            )
        except Exception:
            lines = traceback.format_exc().splitlines()
            string_file_indices: List[int] = []
            for i, line in enumerate(lines):
                if "<string>" in line:
                    string_file_indices.append(i)
            output = lines[0] + "\n"
            for i in string_file_indices:
                output += (
                    lines[i].strip().replace('File "<string>", line', "Line") + "\n"
                )
            output += lines[string_file_indices[-1] + 1].strip() + "\n"

            show_alert(
                f"Code Exception in 'Player {player_index + 1}' API!",
                output,
                "red",
                "fa-solid fa-exclamation",
            )

    def eliminate_player(self, player_index: int, reason=""):
        """Eliminate the specified player for the specified reason from the simulation."""

        self.active_players = [p for p in self.active_players if p != player_index]
        if self.verbose:
            show_alert(
                f"{self.player_names[player_index]} was eliminated!",
                reason,
                "blue",
                "fa-solid fa-skull",
                0,
                False,
            )
            self.play_sound("player_eliminated")
        self._eliminated.append(player_index)
        self.log(
            f"[Game T{self.step}] Player #{player_index + 1} ({self.player_names[player_index]}) was eliminated: {reason}",
            -1,
            "white",
        )

    def log(self, text: str, player_index: Optional[int] = None, color="white"):
        """
        Logs the given entry with the given color.

        For game-global log entries (not coming from a specific player), don't specify a ``player_index``.
        """
        if is_web():
            console_log(-1 if player_index is None else player_index, text, color)
        else:
            self._logs.append(
                {
                    "step": self.step,
                    "text": text,
                    "player_index": player_index,
                    "color": color,
                }
            )

    @web_only
    def play_sound(self, sound: str):
        """Plays the given sound, from the URL given by :func:`configure_sound_url`."""
        from js import window, Audio

        if sound not in self._sounds:
            self._sounds[sound] = Audio.new(self.configure_sound_url(sound))

        volume = window.localStorage.getItem("Volume") or 0
        s = self._sounds[sound].cloneNode(True)
        s.volume = volume

        async def p():
            try:
                await s.play()
            except Exception:
                print(
                    f"Warning: couldn't play sound '{sound}'. Make sure the `sound` and `configure_sound_url` are correct."
                )

        asyncio.get_event_loop().run_until_complete(p())

    @property
    def time(self) -> str:
        """The current step of the simulation, as a string with justification to fill 5 characters."""

        return str(self.step).rjust(5)

    @property
    def over(self) -> bool:
        """Whether there is only one remaining player."""

        return len(self.active_players) <= 1

    @web_only
    def _initialize(self):
        from js import window, document
        from pyscript.ffi import create_proxy

        window.addEventListener("resize", create_proxy(lambda _: self._resize_canvas()))
        document.getElementById("playpause").onclick = create_proxy(
            lambda _: asyncio.get_event_loop().run_until_complete(self._play_pause())
        )
        step_element = document.getElementById("step")
        if step_element is not None:
            step_element.onclick = create_proxy(lambda _: self._step())

        self._initialized = True

    def _initialize_simulation(self, player_codes: List[str]):
        self.step = 0
        self._logs = []
        self._decisions = []
        self.active_players = list(range(len(self.player_names)))
        self.active_players = list(range(len(self.player_names)))
        self.state = self.create_initial_state()
        self.player_requests = [
            self.create_initial_player_requests(i)
            for i in range(len(self.player_names))
        ]
        self._eliminated = []
        self._player_globals = self._get_initial_player_globals(player_codes)
        self._webworker_frame = 0

    def _run_webworker_simulation(
        self, map: str, player_names_str: str, player_codes_str: str
    ):
        from pyscript import sync

        # JS to Python
        player_names = json.loads(player_names_str)
        player_codes = json.loads(player_codes_str)

        self.map = map
        self.player_names = player_names
        self.background = True
        self.console_visible = False
        self.verbose = False
        self._initialize_simulation(player_codes)
        while not self.over:
            self._logs = []
            decisions = self.make_decisions()
            logs = self._logs
            self._logs = []
            self.apply_decisions(decisions)

            sync.update_step(
                base64.b64encode(decisions).decode(),
                json.dumps(logs),
                "true" if self.over else "false",
            )

            if not self.over:
                self.step += 1

    def _run_local_simulation(self):
        self.map = sys.argv[1]
        self.player_names = sys.argv[2].split("-")
        self.background = True
        self.console_visible = False
        self.verbose = False
        player_codes = []
        for filename in sys.argv[3:]:
            with open(filename, "r") as f:
                player_codes.append(f.read())
        self._initialize_simulation(player_codes)

        while not self.over:
            self.apply_decisions(self.make_decisions())

            if not self.over:
                self.step += 1

        print("--- SIMULATION FINISHED ---")
        print(
            json.dumps(
                {
                    "winner_index": self.active_players[0]
                    if len(self.active_players) > 0
                    else None,
                    "winner": self.player_names[self.active_players[0]]
                    if len(self.active_players) > 0
                    else None,
                    "steps": self.step,
                    "logs": self._logs,
                }
            )
        )

    def _start_simulation(self, *args, **kwargs):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self._start_simulation_async(*args, **kwargs))

    @web_only
    async def _start_simulation_async(
        self,
        map: str,
        player_codes: List[str],
        player_names: List[str],
        background: bool,
        console_visible: bool,
        verbose: bool,
    ):
        from js import document
        from pyscript import workers

        # JS to Python
        player_names = [str(x) for x in player_names]
        player_codes = [str(x) for x in player_codes]

        try:
            render_status = document.getElementById("render-status")
            if render_status is not None:
                render_status.textContent = "Rendering: Initializing..."

            self.map = map
            self.player_names = player_names
            self.map_image = await download_image(self.configure_map_image_url(map))
            self.background = background
            self.console_visible = console_visible
            self.verbose = verbose
            self._initialize_simulation(player_codes)

            if not self.background:
                self.canvas = GameCanvas(
                    document.getElementById("simulation"),
                    self.configure_board_count(),
                    self.map_image,
                    document.body.clientWidth - 440
                    if console_visible
                    else document.body.clientWidth - 40,
                    document.body.clientHeight - 280,
                    self.configure_extra_width(),
                    self.configure_extra_height(),
                )
            await self.setup()

            if not self.background:
                if not hasattr(self, "_initialized"):
                    self._initialize()

                # Show that loading finished
                document.getElementById("loader").style.display = "none"
                self.render()

                self._worker = await workers["worker"]
                self._worker.update_step = self._update_step
                self._worker._run_webworker_simulation(
                    map, json.dumps(player_names), json.dumps(player_codes)
                )

            if self.background:
                await self._play_pause()
        except Exception:
            traceback.print_exc()

    def _update_step(self, decisions_str: str, logs_str: str, is_over_str: str):
        from js import document

        decisions = base64.b64decode(str(decisions_str))
        logs: list = json.loads(str(logs_str))
        is_over = str(is_over_str) == "true"

        self._decisions.append(decisions)
        self._logs.append(logs)
        self._webworker_frame += 1

        render_status = document.getElementById("render-status")
        if render_status is not None:
            render_status.textContent = (
                "Rendering: Complete!"
                if is_over
                else f"Rendering: Frame {self._webworker_frame}"
            )

    def _get_initial_player_globals(self, player_codes: List[str]):
        contexts = [
            self.create_api_implementation(i) for i in range(len(self.player_names))
        ]
        bot_base_class_name = self.configure_bot_base_class_name()

        player_globals = [
            {
                "api": self.get_api(),
                bot_base_class_name: getattr(self.get_api(), bot_base_class_name),
                "player_api": None,
                "context": context,
                **self.get_api().__dict__,
            }
            | self.configure_bot_globals()
            for context in contexts
        ]
        for index, api_code in enumerate(player_codes):
            if api_code != "" and api_code is not None:
                if f"class MyBot({bot_base_class_name}):" not in api_code:
                    show_alert(
                        f"Code Exception in 'Player {index + 1}' API!",
                        f"Missing line:\nclass MyBot({bot_base_class_name}):",
                        "red",
                        "fa-solid fa-exclamation",
                    )
                    continue

                lines = [
                    ""
                    if (line.startswith("from") or line.startswith("import"))
                    else line
                    for line in api_code.splitlines()
                ]
                lines = "\n".join(lines)
                lines = lines.replace("class MyBot", f"class Player{index}Bot")
                try:
                    exec(lines, player_globals[index])
                    exec(
                        f"player_api = Player{index}Bot(context)",
                        player_globals[index],
                    )
                except Exception:
                    lines = traceback.format_exc().splitlines()
                    string_file_indices = []
                    for i, line in enumerate(lines):
                        if "<string>" in line:
                            string_file_indices.append(i)
                    output = lines[0] + "\n"
                    for i in string_file_indices:
                        output += (
                            lines[i].strip().replace('File "<string>", line', "Line")
                            + "\n"
                        )
                    output += lines[string_file_indices[-1] + 1].strip() + "\n"

                    show_alert(
                        f"Code Exception in 'Player {index + 1}' API!",
                        output,
                        "red",
                        "fa-solid fa-exclamation",
                    )

        return player_globals

    @web_only
    def _resize_canvas(self):
        from js import document

        if not hasattr(self, "canvas"):
            return

        self.canvas._fit_into(
            document.body.clientWidth - 440
            if self.console_visible
            else document.body.clientWidth - 40,
            document.body.clientHeight - 280,
        )
        if not self.background:
            self.render()

    @web_only
    def _step(self):
        from js import document, setTimeout
        from pyscript.ffi import create_proxy

        if not self.over:
            if len(self._decisions) == 0:
                print("Warning: sleeping because decisions were not made yet!")
                setTimeout(create_proxy(self._step), 100)
                return
            else:
                logs = self._logs.pop(0)
                for log in logs:
                    console_log(
                        -1 if log["player_index"] is None else log["player_index"],
                        log["text"],
                        log["color"],
                    )
                self.apply_decisions(self._decisions.pop(0))

        if not self.over:
            self.step += 1

        if self.over:
            if len(self.active_players) == 1:
                self._eliminated.append(self.active_players[0])
            set_results(
                self.player_names, self._eliminated[::-1], self.map, self.verbose
            )

        if not self.background:
            self.render()
            if (
                self.over
                and "Pause" in document.getElementById("playpause").textContent
            ):
                # Make it apparent that the game is stopped.
                document.getElementById("playpause").click()
        elif self.verbose:
            document.getElementById("noui-progress").style.display = "block"
            document.getElementById(
                "noui-progress"
            ).textContent = f"Simulating T{self.time}s..."
            if self.over:
                document.getElementById("noui-progress").style.display = "none"

    @web_only
    def _should_play(self):
        from js import document

        if self.over:
            return False

        if self.background:
            return True

        if "Pause" not in document.getElementById("playpause").textContent:
            return False

        if self.step == self._get_breakpoint():
            return False

        return True

    @web_only
    def _get_playback_speed(self):
        from js import document

        return 2 ** float(
            document.getElementById("timescale")
            .getElementsByClassName("mantine-Slider-thumb")
            .to_py()[0]
            .ariaValueNow
        )

    @web_only
    def _get_breakpoint(self):
        from js import document

        breakpoint_element = document.getElementById("breakpoint")
        if breakpoint_element is None or breakpoint_element.value == "":
            return -1

        try:
            return int(breakpoint_element.value)
        except Exception:
            return -1

    async def _play_pause(self):
        await asyncio.sleep(0.05)
        while self._should_play():
            start = time.time()
            try:
                self._step()
            except Exception:
                traceback.print_exc()
            if not self.background:
                await asyncio.sleep(
                    max(
                        1
                        / self.configure_steps_per_second()
                        / self._get_playback_speed()
                        - (time.time() - start),
                        0,
                    )
                )
            else:
                await asyncio.sleep(0.01)
