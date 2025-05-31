import asyncio
import base64
import datetime
import gzip
import json
import math
import sys
import time
import traceback
import typing
from dataclasses import dataclass
from random import Random
from typing import Any, Dict, Generic, List, Optional, Set, Tuple, TypeVar
from urllib.parse import quote

from code_battles.utilities import (
    GameCanvas,
    console_log,
    download_image,
    is_web,
    is_worker,
    navigate,
    set_results,
    show_alert,
    show_download,
    web_only,
)

try:
    import js
except Exception:
    pass

GameStateType = TypeVar("GameStateType")
APIImplementationType = TypeVar("APIImplementationType")
APIType = TypeVar("APIType")
PlayerRequestsType = TypeVar("PlayerRequestsType")


@dataclass
class Simulation:
    parameters: Dict[str, str]
    player_names: str
    game: str
    version: str
    timestamp: datetime.datetime
    logs: list
    decisions: List[bytes]
    seed: int

    def dump(self):
        return base64.b64encode(
            gzip.compress(
                json.dumps(
                    {
                        "parameters": self.parameters,
                        "playerNames": self.player_names,
                        "game": self.game,
                        "version": self.version,
                        "timestamp": self.timestamp.isoformat(),
                        "logs": self.logs,
                        "decisions": [
                            base64.b64encode(decision).decode()
                            for decision in self.decisions
                        ],
                        "seed": self.seed,
                    }
                ).encode()
            )
        ).decode()

    @staticmethod
    def load(file: str):
        contents: Dict[str, Any] = json.loads(gzip.decompress(base64.b64decode(file)))
        return Simulation(
            contents["parameters"]
            if "parameters" in contents
            else {"map": contents["map"]},
            contents["playerNames"],
            contents["game"],
            contents["version"],
            datetime.datetime.fromisoformat(contents["timestamp"]),
            contents["logs"],
            [base64.b64decode(decision) for decision in contents["decisions"]],
            contents["seed"],
        )


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
    parameters: Dict[str, str]
    """The parameters of the simulation. This is populated before any of the overridable methods run."""
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
    random: Random
    """A pseudorandom generator that should be used for all randomness purposes (except :func:`make_decisions`)"""
    player_randoms: List[Random]
    """A pseudorandom generator that should be used for all randomness purposes in a player's bot. Given to the bots as a global via :func:`configure_bot_globals`."""
    make_decisions_random: Random
    """A pseudorandom generator that should be used for all randomness purposes in :func:`make_decisions`."""

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
    _breakpoints: Set[int]
    _since_last_render: int

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

        If you need any randomness, use :attr:`make_decisions_random`.

        This function may take a lot of time to execute.

        .. warning::
           Do not call any other method other than :func:`run_bot_method` in here. This method will run in a web worker.
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

    def configure_map_image_url(self, map: str) -> str:
        """The URL containing the map image for the given map. By default, this takes the lowercase, replaces spaces with _ and loads from `/images/maps` which is stored in `public/images/maps` in a project."""

        return "/images/maps/" + map.lower().replace(" ", "_") + ".png"

    def configure_sound_url(self, name: str) -> str:
        """The URL containing the sound for the given name. By default, this takes the lowercase, replaces spaces with _ and loads from `/sounds` which is stored in `public/sounds` in a project."""

        return "/sounds/" + name.lower().replace(" ", "_") + ".mp3"

    def configure_bot_base_class_name(self) -> str:
        """A bot's base class name. CodeBattlesBot by default."""

        return "CodeBattlesBot"

    def configure_render_rate(self, playback_speed: float) -> int:
        """
        The amount of frames to simulate before each render.

        For games with an intensive `render` method, this is useful for higher playback speeds.
        """
        return 1

    def configure_bot_globals(self, player_index: int) -> Dict[str, Any]:
        """
        Configure additional available global items, such as libraries from the Python standard library, bots can use.

        By default, this is math, time, typing and random, where random is the corresponding :attr:`player_randoms`.

        .. warning::
           Bots will also have `api`, `context`, `player_api`, and the bot base class name (CodeBattlesBot by default) available as part of the globals, alongside everything in `api`.

           Any additional imports will be stripped (not as a security mechanism).
        """

        return {
            "math": math,
            "time": time,
            "typing": typing,
            "random": self.player_randoms[player_index],
        }

    def configure_version(self) -> str:
        """Configure the version of the game, which is stored in the simulation files."""
        return "1.0.0"

    @web_only
    def download_image(self, url: str) -> "asyncio.Future[js.Image]":
        from js import Image

        result = asyncio.Future()
        image = Image.new()
        image.onload = lambda _: result.set_result(image)
        image.src = url
        return result

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

    def run_bot_method(self, player_index: int, method_name: str) -> float:
        """
        Runs the specified method of the given player and returns the time it took (in seconds).

        Upon exception, shows an alert (does not terminate the bot).
        """
        start = time.time()

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

            self.alert(
                f"Code Exception in 'Player {player_index + 1}' API!",
                output,
                "red",
                "fa-solid fa-exclamation",
            )

        end = time.time()
        return end - start

    def eliminate_player(self, player_index: int, reason=""):
        """Eliminate the specified player for the specified reason from the simulation."""

        self.active_players = [p for p in self.active_players if p != player_index]
        if self.verbose:
            self.alert(
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
            f"[Battles {self.step + 1}] Player #{player_index + 1} ({self.player_names[player_index]}) was eliminated: {reason}",
            -1,
            "white",
        )

    def log(self, text: str, player_index: Optional[int] = None, color="white"):
        """
        Logs the given entry with the given color.

        For game-global log entries (not coming from a specific player), don't specify a ``player_index``.
        """
        if not isinstance(text, str):
            text = str(text)

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

    def alert(
        self,
        title: str,
        alert: str,
        color: str,
        icon: str,
        limit_time: int = 5000,
        is_code=True,
    ):
        """
        Displays the given alert in the game UI.
        """

        if is_worker():
            self._alerts.append(
                {
                    "title": title,
                    "alert": alert,
                    "color": color,
                    "icon": icon,
                    "limit_time": limit_time,
                    "is_code": is_code,
                }
            )
        else:
            show_alert(title, alert, color, icon, limit_time, is_code)

    @web_only
    def play_sound(self, sound: str, force=False):
        """
        Plays the given sound, from the URL given by :func:`configure_sound_url`.

        If ``force`` is set, will play the sound even if the simulation is not :attr:`verbose`.
        """
        from js import Audio, window

        if not force and not self.verbose:
            return

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

    def pause(self):
        """
        Pauses the current simulation. Useful for letting bots insert breakpoints wherever they wish.

        **Important:** call this method only from the :func:`make_decisions` method.
        """
        self._should_pause = True

    @property
    def time(self) -> str:
        """The current step of the simulation, as a string with justification to fill 5 characters."""

        return str(self.step).rjust(5)

    @property
    def over(self) -> bool:
        """Whether there is only one remaining player."""

        return len(self.active_players) <= 1

    def _make_decisions(self):
        r = self.random
        del self.random

        result = self.make_decisions()

        self.random = r
        return result

    @web_only
    def _initialize(self):
        from js import document, window
        from pyscript.ffi import create_proxy

        window.addEventListener("resize", create_proxy(lambda _: self._resize_canvas()))
        document.getElementById("playpause").onclick = create_proxy(
            lambda _: asyncio.get_event_loop().run_until_complete(self._play_pause())
        )
        step_element = document.getElementById("step")
        if step_element is not None:
            step_element.onclick = create_proxy(lambda _: self._step())

        # Start the simulation.
        document.getElementById("playpause").click()

    def _initialize_simulation(
        self, player_codes: List[str], seed: Optional[int] = None
    ):
        if seed is None:
            seed = Random().randint(0, 2**128)
        self._logs = []
        self._alerts = []
        self._decisions = []
        self._breakpoints = set()
        self._decision_index = 0
        self._seed = seed
        self.step = 0
        self.active_players = list(range(len(self.player_names)))
        self.random = Random(seed)
        self.make_decisions_random = Random(self.random.randint(0, 2**128))
        self.player_randoms = [
            Random(self.random.randint(0, 2**128)) for _ in self.player_names
        ]
        self.state = self.create_initial_state()
        self.player_requests = [
            self.create_initial_player_requests(i)
            for i in range(len(self.player_names))
        ]
        self._eliminated = []
        self._player_globals = self._get_initial_player_globals(player_codes)
        self._since_last_render = 1
        self._start_time = time.time()

    def _run_webworker_simulation(
        self,
        parameters: Dict[str, str],
        player_names_str: str,
        player_codes_str: str,
        seed: Optional[int] = None,
    ):
        from pyscript import sync

        # JS to Python
        parameters = json.loads(parameters)
        player_names = json.loads(player_names_str)
        player_codes = json.loads(player_codes_str)

        self.parameters = parameters
        self.map = parameters.get("map")
        self.player_names = player_names
        self.background = True
        self.console_visible = False
        self.verbose = False
        self._initialize_simulation(player_codes, seed)
        while not self.over:
            self._should_pause = False
            self._logs = []
            self._alerts = []
            decisions = self._make_decisions()
            logs = self._logs
            alerts = self._alerts
            log = self.log
            self.log = lambda *args, **kwargs: None
            self.apply_decisions(decisions)
            self.log = log

            sync.update_step(
                base64.b64encode(decisions).decode(),
                json.dumps(logs),
                json.dumps(alerts),
                "true" if self.over else "false",
                "true" if self._should_pause else "false",
            )

            if not self.over:
                self.step += 1

    def _run_local_simulation(self):
        command = sys.argv[1]
        output_file = None
        decisions = []
        if command == "simulate":
            seed = None if sys.argv[2] == "None" else int(sys.argv[2])
            output_file = None if sys.argv[3] == "None" else sys.argv[3]
            self.map = sys.argv[4]
            self.player_names = sys.argv[5].split("-")
            player_codes = []
            for filename in sys.argv[6:]:
                with open(filename, "r") as f:
                    player_codes.append(f.read())
        elif command == "simulate-from-file":
            with open(sys.argv[2], "r") as f:
                contents = f.read()
            simulation = Simulation.load(contents)
            seed = simulation.seed
            self.parameters = simulation.parameters
            self.map = simulation.parameters.get("map")
            self.player_names = simulation.player_names
            decisions = simulation.decisions
            player_codes = ["" for _ in simulation.player_names]
        else:
            print(f"invalid command {sys.argv[1]}", file=sys.stderr)
            exit(-1)
        self.background = True
        self.console_visible = False
        self.verbose = False
        self._initialize_simulation(player_codes, seed)

        all_logs = []
        while not self.over:
            print("__CODE_BATTLES_ADVANCE_STEP")
            if len(decisions) != 0:
                self.apply_decisions(decisions.pop(0))
            else:
                self._logs = []
                _decisions = self._make_decisions()
                all_logs.append(self._logs)
                self._logs = []
                if output_file is not None:
                    self._decisions.append(_decisions)
                self.apply_decisions(_decisions)

            if not self.over:
                self.step += 1
        self._logs = all_logs

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
                    "logs": [log for logs in self._logs for log in logs],
                }
            )
        )

        if output_file is not None:
            simulation_str = self._get_simulation().dump()
            with open(output_file, "w") as f:
                f.write(simulation_str)

    def _start_simulation(self, *args, **kwargs):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self._start_simulation_async(*args, **kwargs))

    def _start_simulation_from_file(self, contents: str):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self._start_simulation_from_file_async(contents))

    async def _start_simulation_from_file_async(self, contents: str):
        from js import document

        try:
            simulation = Simulation.load(str(contents))
            parameters = "&".join(
                [f"{p}={quote(v)}" for p, v in simulation.parameters.items()]
            )
            navigate(
                f"/simulation/{','.join([quote(player_name) for player_name in simulation.player_names])}?seed={simulation.seed}&{parameters}"
            )
            self.alert(
                "Loaded simulation file!",
                f"{', '.join(simulation.player_names)} competed with {simulation.parameters} at {simulation.timestamp}",
                "blue",
                "fa-solid fa-file-code",
                0,
            )
            if simulation.game != self.__class__.__name__:
                self.alert(
                    "Warning: game mismatch!",
                    f"Simulation file is for game {simulation.game} while the website is running {self.__class__.__name__}!",
                    "yellow",
                    "fa-solid fa-exclamation",
                    0,
                )
            if simulation.version != self.configure_version():
                self.alert(
                    "Warning: version mismatch!",
                    f"Simulation file is for version {simulation.version} while the website is running {self.configure_version()}!",
                    "yellow",
                    "fa-solid fa-exclamation",
                    0,
                )
            while document.getElementById("loader") is None:
                await asyncio.sleep(0.01)
            self._initialize()
            self.parameters = simulation.parameters
            self.map = self.parameters.get("map")
            self.map_image = await download_image(
                self.configure_map_image_url(self.map)
            )
            self.player_names = simulation.player_names
            self.background = False
            self.console_visible = True
            self.verbose = True
            self._initialize_simulation(
                ["" for _ in simulation.player_names], simulation.seed
            )
            self._decisions = simulation.decisions
            self._logs = simulation.logs
            self.canvas = GameCanvas(
                document.getElementById("simulation"),
                self.configure_board_count(),
                self.map_image,
                self._get_canvas_width(),
                self._get_canvas_height(),
                self.configure_extra_width(),
                self.configure_extra_height(),
            )
            document.getElementById("loader").style.display = "none"
            await self.setup()
            self.render()
        except Exception as e:
            print(e)

    @web_only
    async def _start_simulation_async(
        self,
        parameters: Dict[str, str],
        player_codes: List[str],
        player_names: List[str],
        background: bool,
        console_visible: bool,
        verbose: bool,
        seed="",
    ):
        from js import document
        from pyscript import workers

        # JS to Python
        player_names = [str(x) for x in player_names]
        player_codes = [str(x) for x in player_codes]
        parameters = parameters.to_py()

        try:
            render_status = document.getElementById("render-status")
            if render_status is not None:
                render_status.textContent = "Rendering: Initializing..."

            self.parameters = parameters
            self.map = parameters.get("map")
            self.player_names = player_names
            self.map_image = await download_image(
                self.configure_map_image_url(self.map)
            )
            self.background = background
            self.console_visible = console_visible
            self.verbose = verbose
            self._initialize_simulation(player_codes, None if seed == "" else int(seed))

            if not self.background:
                self.canvas = GameCanvas(
                    document.getElementById("simulation"),
                    self.configure_board_count(),
                    self.map_image,
                    self._get_canvas_width(),
                    self._get_canvas_height(),
                    self.configure_extra_width(),
                    self.configure_extra_height(),
                )
            await self.setup()

            if not self.background:
                self._initialize()

                # Show that loading finished
                document.getElementById("loader").style.display = "none"
                self.render()

            self._worker = await workers["worker"]
            self._worker.update_step = self._update_step
            self._worker._run_webworker_simulation(
                json.dumps(parameters),
                json.dumps(player_names),
                json.dumps(player_codes),
                self._seed,
            )

            if self.background:
                await self._play_pause()
        except Exception:
            traceback.print_exc()

    @web_only
    def _get_canvas_width(self):
        from js import document

        return (
            document.body.clientWidth - 440
            if self.console_visible
            else document.body.clientWidth - 40
        )

    @web_only
    def _get_canvas_height(self):
        from js import document

        return (
            document.body.clientHeight - 255
            if self.console_visible
            else document.body.clientHeight - 180
        )

    def _get_simulation(self):
        return Simulation(
            self.parameters,
            self.player_names,
            self.__class__.__name__,
            self.configure_version(),
            datetime.datetime.now(),
            self._logs,
            self._decisions,
            self._seed,
        )

    def _update_step(
        self,
        decisions_str: str,
        logs_str: str,
        alerts_str: str,
        is_over_str: str,
        should_pause_str: str,
    ):
        from js import document, window

        now = time.time()
        decisions = base64.b64decode(str(decisions_str))
        logs: list = json.loads(str(logs_str))
        alerts: list = json.loads(str(alerts_str))
        is_over = str(is_over_str) == "true"
        should_pause = str(should_pause_str) == "true"

        if should_pause:
            self._breakpoints.add(len(self._decisions))
        self._decisions.append(decisions)
        self._logs.append(logs)
        self._alerts.append(alerts)

        if is_over:
            try:
                simulation = self._get_simulation()
                window.simulationToDownload = simulation.dump()
                show_download()
            except Exception as e:
                print(e)

        render_status = document.getElementById("render-status")
        if render_status is not None:
            render_status.textContent = (
                f"Rendering: Complete! ({int(now - self._start_time)}s)"
                if is_over
                else f"Rendering: Frame {len(self._decisions)} ({int(now - self._start_time)}s)"
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
            | self.configure_bot_globals(player_index)
            for player_index, context in enumerate(contexts)
        ]
        for index, api_code in enumerate(player_codes):
            if api_code != "" and api_code is not None:
                if f"class MyBot({bot_base_class_name}):" not in api_code:
                    self.alert(
                        f"Code Exception in 'Player {index + 1}' API!",
                        f"Missing line:\nclass MyBot({bot_base_class_name}):",
                        "red",
                        "fa-solid fa-exclamation",
                    )
                    continue

                def check_import(library: str):
                    """Checks if the import is available, otherwise shows an alert"""
                    split = library.split()
                    if len(split) >= 2 and split[1] not in player_globals[index]:
                        self.alert(
                            f"Import Error in 'Player {index + 1}' API!",
                            f"The import '{split[1]}' is not available, you need to remove it!",
                            "red",
                            "fa-solid fa-exclamation",
                        )
                    elif (
                        len(split) >= 4
                        and split[0] == "from"
                        and not (
                            split[3] == "*"
                            or all(
                                [
                                    x.strip() in player_globals[index]
                                    for x in "".join(split[3:]).split(",")
                                ]
                            )
                        )
                    ):
                        self.alert(
                            f"Import Error in 'Player {index + 1}' API!",
                            f"You need to change '{library}' to 'import {split[1]}'!",
                            "red",
                            "fa-solid fa-exclamation",
                        )
                    return ""

                lines = [
                    check_import(line)
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

                    self.alert(
                        f"Code Exception in 'Player {index + 1}' API!",
                        output,
                        "red",
                        "fa-solid fa-exclamation",
                    )

        return player_globals

    @web_only
    def _resize_canvas(self):
        if not hasattr(self, "canvas"):
            return

        self.canvas._fit_into(
            self._get_canvas_width(),
            self._get_canvas_height(),
        )
        if not self.background:
            self.render()

    @web_only
    def _ensure_paused(self):
        from js import document

        if "Pause" in document.getElementById("playpause").textContent:
            # Make it apparent that the game is stopped.
            document.getElementById("playpause").click()

    @web_only
    def _step(self):
        from js import document, setTimeout
        from pyscript.ffi import create_proxy

        if not self.over:
            if len(self._decisions) == self._decision_index:
                print("Warning: sleeping because decisions were not made yet!")
                setTimeout(create_proxy(self._step), 100)
                return
            else:
                logs = self._logs[self._decision_index]
                for log in logs:
                    console_log(
                        -1 if log["player_index"] is None else log["player_index"],
                        log["text"],
                        log["color"],
                    )
                alerts = self._alerts[self._decision_index]
                for alert in alerts:
                    self.alert(**alert)
                self.apply_decisions(self._decisions[self._decision_index])
                self._decision_index += 1

        if not self.over:
            self.step += 1

        if self.over:
            if len(self.active_players) == 1:
                self._eliminated.append(self.active_players[0])
            set_results(
                self.player_names, self._eliminated[::-1], self.parameters, self.verbose
            )
            if not self.background:
                self.render()

        if not self.background:
            if self._since_last_render >= self.configure_render_rate(
                self._get_playback_speed()
            ):
                self.render()
                self._since_last_render = 1
            else:
                self._since_last_render += 1

            if self.over:
                self._ensure_paused()
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

        playpause = document.getElementById("playpause")
        if playpause is None or "Pause" not in playpause.textContent:
            return False

        if self.step == self._get_breakpoint():
            return False

        if self.step in self._breakpoints and self.console_visible:
            self._breakpoints.remove(self.step)
            self._ensure_paused()
            self.log(f"[Battles {self.step + 1}] Pause requested!")
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
                await asyncio.sleep(0.0005)
