import asyncio
import math
import time
import random
import traceback

from typing import Any, Dict, Generic, List, Tuple, TypeVar
from code_battles.utilities import (
    GameCanvas,
    console_log,
    download_image,
    set_results,
    show_alert,
)
from js import Audio, Image, document, window, FontFace
from pyscript.ffi import create_proxy

GameStateType = TypeVar("GameStateType")
APIImplementationType = TypeVar("APIImplementationType")
APIType = TypeVar("APIType")


class CodeBattles(Generic[GameStateType, APIImplementationType, APIType]):
    """
    The base class for a Code Battles game.

    You should subclass this class and override the following methods:

    - :meth:`.render`
    - :meth:`.simulate_step`
    - :meth:`.create_initial_state`
    - :meth:`.get_api`
    - :meth:`.create_api_implementation`

    Then, bind your class to the React application by calling :func:`run_game` with an instance of your subclass.
    """

    player_names: List[str]
    """The name of the players. This is populated before any of the overridable methods run."""
    map: str
    """The name of the map. This is populated before any of the overridable methods run."""
    map_image: Image
    """The map image. This is populated before any of the overridable methods run."""
    canvas: GameCanvas
    """The game's canvas. Useful for the :func:`render` method. This is populated before any of the overridable methods run, but it isn't populated for background simulations, so you should only use it in :func:`render`."""
    state: GameStateType
    """The current state of the game. You should modify this in :func:`simulate_step`."""

    background: bool
    """Whether the current simulation is occuring in the background (without UI)."""
    console_visible: bool
    """Whether the console is visible, i.e. the current simulation is not in showcase mode."""
    verbose: bool
    """Whether the current simulation is verbose, i.e. should show alerts and play sounds."""
    step: int
    """The current step of the simulation. Automatically increments after each :func:`simulate_step`."""
    active_players: List[int]
    """A list of the currently active player indices."""

    _player_globals: List[Dict[str, Any]]
    _initialized: bool
    _eliminated: List[int]
    _sounds: Dict[str, Audio] = {}

    def render(self) -> None:
        """
        **You must override this method.**

        Use the :attr:`canvas` attribute to render the current :attr:`state` attribute.
        """

        raise NotImplementedError("render")

    def simulate_step(self) -> None:
        """
        **You must override this method.**

        Update the current state to run another step.

        Do NOT update :attr:`step`.
        """

        raise NotImplementedError("simulate_step")

    def create_initial_state(self) -> GameStateType:
        """
        **You must override this method.**

        Create the initial state for each simulation, to store in the :attr:`state` attribute.
        """

        raise NotImplementedError("create_initial_state")

    def get_api(self) -> APIType:
        """
        **You must override this method.**

        Returns the `api` module.
        """

        raise NotImplementedError("get_api")

    def create_api_implementation(self, player_index: int) -> APIImplementationType:
        """
        **You must override this method.**

        Returns an implementation for the API's Context class, which provides users with access to the state.

        **Important:** This implementation may and should change properties in the state, but they should only be propogated in :func:`simulate_step`!
        """

        raise NotImplementedError("create_api_implementation")

    async def setup(self):
        """
        Optional setup for the simulation.

        For example, loading images using :func:`download_images` or fonts using :func:`load_font`.
        """

        pass

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

    def download_images(
        self, sources: List[Tuple[str, str]]
    ) -> asyncio.Future[Dict[str, Image]]:
        """
        :param sources: A list of ``(image_name, image_url)`` to download.
        :returns: A future which can be ``await``'d containing a dictionary mapping each ``image_name`` to its loaded image.
        """

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

    async def load_font(self, name: str, url: str) -> None:
        """Loads the font from the specified url as the specified name."""

        ff = FontFace.new(name, f"url({url})")
        await ff.load()
        document.fonts.add(ff)

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
        console_log(
            -1,
            f"[Game T{self.time}] Player #{player_index + 1} ({self.player_names[player_index]}) was eliminated: {reason}",
            "white",
        )

    def play_sound(self, sound: str):
        if sound not in self._sounds:
            self._sounds[sound] = Audio.new(self.configure_sound_url(sound))

        volume = window.localStorage.getItem("Volume") or 0
        s = self._sounds[sound].cloneNode(True)
        s.volume = volume
        s.play()

    @property
    def time(self) -> str:
        """The current step of the simulation, as a string with justification to fill 5 characters."""

        return str(self.step).rjust(5)

    @property
    def over(self) -> bool:
        """Whether there is only one remaining player."""

        return len(self.active_players) <= 1

    def _initialize(self):
        window.addEventListener("resize", create_proxy(lambda _: self._resize_canvas()))
        document.getElementById("playpause").onclick = create_proxy(
            lambda _: asyncio.get_event_loop().run_until_complete(self._play_pause())
        )
        step_element = document.getElementById("step")
        if step_element is not None:
            step_element.onclick = create_proxy(lambda _: self._step())

        self._initialized = True

    def _start_simulation(self, *args, **kwargs):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self._start_simulation_async(*args, **kwargs))

    async def _start_simulation_async(
        self,
        map: str,
        player_codes: List[str],
        player_names: List[str],
        background: bool,
        console_visible: bool,
        verbose: bool,
    ):
        self.map = map
        self.player_names = player_names
        self.map_image = await download_image(self.get_map_image_url(map))
        self.background = background
        self.console_visible = console_visible
        self.verbose = verbose
        self.state = self.create_initial_state()
        self.step = 0
        self.active_players = list(range(len(player_names)))
        self._eliminated = []
        self._player_globals = self._get_initial_player_globals(player_codes)
        if not self.background:
            self.canvas = GameCanvas(
                document.getElementById("simulation"),
                self.get_board_count(),
                self.map_image,
                document.body.clientWidth - 440
                if console_visible
                else document.body.clientWidth - 40,
                document.body.clientHeight - 280,
                self.get_extra_height(),
            )
        await self.setup()

        if not self.background:
            if not hasattr(self, "_initialized"):
                self._initialize()

            # Show that loading finished
            document.getElementById("loader").style.display = "none"
            self.render()

        if self.background:
            await self._play_pause()

    def _get_initial_player_globals(self, player_codes: List[str]):
        contexts = [
            self.create_api_implementation(i) for i in range(len(self.player_names))
        ]
        bot_base_class_name = self.get_bot_base_class_name()

        player_globals = [
            {
                "math": math,
                "time": time,
                "random": random,
                "api": self.get_api(),
                bot_base_class_name: getattr(self.get_api(), bot_base_class_name),
                "player_api": None,
                "context": context,
                **self.get_api().__dict__,
            }
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

    def _resize_canvas(self):
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

    def _step(self):
        if not self.over:
            self._simulate_with_apis()
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

    def _should_play(self):
        if self.over:
            return False

        if self.background:
            return True

        if "Pause" not in document.getElementById("playpause").textContent:
            return False

        if self.step == self._get_breakpoint():
            return False

        return True

    def _get_playback_speed(self):
        return 2 ** float(
            document.getElementById("timescale")
            .getElementsByClassName("mantine-Slider-thumb")
            .to_py()[0]
            .ariaValueNow
        )

    def _get_breakpoint(self):
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
            self._step()
            if not self.background:
                await asyncio.sleep(
                    max(
                        1 / self.get_steps_per_second() / self._get_playback_speed()
                        - (time.time() - start),
                        0,
                    )
                )
            else:
                await asyncio.sleep(0.01)

    def _simulate_with_apis(self):
        self.simulate_step()

        for index in self.active_players:
            try:
                exec(
                    "if player_api is not None: player_api.run()",
                    self._player_globals[index],
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
                    f"Code Exception in 'Player {index + 1}' API!",
                    output,
                    "red",
                    "fa-solid fa-exclamation",
                )
