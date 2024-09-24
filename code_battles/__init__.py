import asyncio
import math
import traceback
import time
import random

from typing import Any, Generic, List, TypeVar
from code_battles.utilities import (
    GameCanvas,
    console_log,
    download_image,
    play_sound,
    set_results,
    show_alert,
)
from js import Image, document, window
from pyscript.ffi import create_proxy

GameStateType = TypeVar("GameStateType")
GameContextType = TypeVar("GameContextType")
APIType = TypeVar("APIType")


class CodeBattles(Generic[GameStateType, GameContextType, APIType]):
    player_names: list[str]
    map: str
    map_image: Image
    canvas: GameCanvas
    state: GameStateType
    background: bool
    console_visible: bool
    verbose: bool
    step: int
    active_players: List[int]

    _player_globals: list[dict[str, Any]]
    _initialized: bool
    _eliminated: List[int]

    def render(self) -> None:
        raise NotImplementedError("render")

    def simulate_step(self) -> None:
        raise NotImplementedError("simulate_step")

    def create_initial_state(self) -> GameStateType:
        raise NotImplementedError("create_initial_state")

    def get_api(self) -> APIType:
        raise NotImplementedError("get_api")

    def create_game_context(self, player_index: int) -> GameContextType:
        raise NotImplementedError("create_game_context")

    async def setup(self):
        pass

    def get_extra_height(self):
        return 0

    def get_steps_per_second(self):
        return 20

    def get_board_count(self):
        return len(self.player_names)

    def get_map_path(self, map: str):
        return "/images/maps/" + map.lower().replace(" ", "_") + ".png"

    def get_bot_base_class_name(self):
        return "CodeBattlesBot"

    def eliminate_player(self, player_index: int, reason=""):
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
            play_sound("player_eliminated")
        self._eliminated.append(player_index)
        console_log(
            -1,
            f"[Game T{self.time}] Player #{player_index + 1} ({self.player_names[player_index]}) was eliminated: {reason}",
            "white",
        )

    @property
    def time(self):
        return str(self.step).rjust(5)

    @property
    def over(self):
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
        player_codes: list[str],
        player_names: list[str],
        background: bool,
        console_visible: bool,
        verbose: bool,
    ):
        self.map = map
        self.player_names = player_names
        self.map_image = await download_image(self.get_map_path(map))
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

    def _get_initial_player_globals(self, player_codes: list[str]):
        contexts = [self.create_game_context(i) for i in range(len(self.player_names))]
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

        self.canvas.fit_into(
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


def run_game(battles: CodeBattles):
    window._startSimulation = create_proxy(battles._start_simulation)
