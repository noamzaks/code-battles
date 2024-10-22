"""Generic useful utilities for creating games with PyScript."""

import asyncio
import math
from typing import Callable, List, Union
from enum import Enum

from js import Element, Image, window


class Alignment(Enum):
    CENTER = 0
    TOP_LEFT = 1


def download_image(src: str) -> Image:
    result = asyncio.Future()
    image = Image.new()
    image.onload = lambda _: result.set_result(image)
    image.src = src
    return result


def show_alert(
    title: str, alert: str, color: str, icon: str, limit_time: int = 5000, is_code=True
):
    if hasattr(window, "showAlert"):
        try:
            window.showAlert(title, alert, color, icon, limit_time, is_code)
        except Exception as e:
            print(e)


def set_results(player_names: List[str], places: List[int], map: str, verbose: bool):
    if hasattr(window, "setResults"):
        try:
            window.setResults(player_names, places, map, verbose)
        except Exception as e:
            print(e)


def download_json(filename: str, contents: str):
    if hasattr(window, "downloadJson"):
        try:
            window.downloadJson(filename, contents)
        except Exception as e:
            print(e)


def console_log(player_index: int, text: str, color: str):
    if hasattr(window, "consoleLog"):
        try:
            window.consoleLog(player_index, text, color)
        except Exception as e:
            print(e)


async def with_timeout(fn: Callable[[], None], timeout_seconds: float):
    async def f():
        fn()

    await asyncio.wait_for(f(), timeout_seconds)


class GameCanvas:
    """
    A nice wrapper around HTML Canvas for drawing map-based multiplayer games.
    """

    _scale: float

    def __init__(
        self,
        canvas: Element,
        player_count: int,
        map_image: Image,
        max_width: int,
        max_height: int,
        extra_width: int,
        extra_height: int,
    ):
        self.canvas = canvas
        self.player_count = player_count
        self.map_image = map_image
        self.extra_height = extra_height
        self.extra_width = extra_width

        self._fit_into(max_width, max_height)

    def draw_element(
        self,
        image: Image,
        x: int,
        y: int,
        width: int,
        board_index=0,
        direction: Union[float, None] = None,
        alignment=Alignment.CENTER,
    ):
        """
        Draws the given image on the specified board.

        Scaled to fit `width` in map pixels, be on position ``(x, y)`` in map pixels and face `direction`
        where 0 is no rotation and the direction is clockwise positive.
        """

        if direction is None:
            direction = 0

        x, y = self._translate_position(board_index, x, y)
        width, height = self._translate_width(width, image.width / image.height)

        if alignment == Alignment.TOP_LEFT:
            x += width / 2
            y += height / 2

        self.context.save()
        self.context.translate(x, y)
        self.context.rotate(direction)
        self.context.translate(-width / 2, -height / 2)
        self.context.drawImage(image, 0, 0, width, height)
        self.context.restore()

    def draw_text(
        self,
        text: str,
        x: int,
        y: int,
        color="black",
        board_index=0,
        text_size=15,
        font="",
    ):
        """
        Draws the given text in the given coordinates (in map pixels).
        """

        if font != "":
            font += ", "

        x, y = self._translate_position(board_index, x, y)
        self.context.font = f"{text_size * self._scale}pt {font}system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif, 'Noto Emoji'"
        self.context.fillStyle = color
        self.context.fillText(text, x, y)

    def draw_circle(
        self,
        x: int,
        y: int,
        radius: float,
        fill="black",
        stroke="transparent",
        board_index=0,
    ):
        """
        Draws the given circle (with the given stroke and fill) in the given coordinates and with the given radius (in map pixels).
        """

        x, y = self._translate_position(board_index, x, y)
        self.context.fillStyle = fill
        self.context.strokeStyle = stroke
        self.context.beginPath()
        self.context.arc(x, y, radius, 0, 2 * math.pi)
        self.context.stroke()
        self.context.fill()

    def clear(self):
        """Clears the canvas and re-draws the players' maps."""

        self.context.clearRect(0, 0, self.canvas.width, self.canvas.height)
        self.context.fillStyle = "#fff"
        self.context.fillRect(0, 0, self.canvas.width, self.canvas.height)

        for i in range(self.player_count):
            self.context.drawImage(
                self.map_image,
                i * self.canvas.width / self.player_count,
                0,
                self.map_image.width * self._scale,
                self.map_image.height * self._scale,
            )

    @property
    def total_width(self) -> float:
        """The total width of the canvas (in map pixels)."""

        return self.map_image.width * self.player_count

    def _fit_into(self, max_width: int, max_height: int):
        if self.map_image.width == 0 or self.map_image.height == 0:
            raise Exception("Map image invalid!")
        aspect_ratio = (self.map_image.width * self.player_count + self.extra_width) / (
            self.map_image.height + self.extra_height
        )
        width = min(max_width, max_height * aspect_ratio)
        height = width / aspect_ratio
        self.canvas.style.width = f"{width}px"
        self.canvas.style.height = f"{height}px"
        self.canvas.width = width * window.devicePixelRatio
        self.canvas.height = height * window.devicePixelRatio
        self._scale = self.canvas.width / (
            self.player_count * self.map_image.width + self.extra_width
        )
        self.context = self.canvas.getContext("2d")
        self.context.textAlign = "center"
        self.context.textBaseline = "middle"

        self.canvas_map_width = (
            self.canvas.width - self._scale * self.extra_width
        ) / self.player_count
        self.canvas_map_height = (
            self.canvas_map_width * self.map_image.height / self.map_image.width
        )

    def _translate_position(self, board_index: int, x: float, y: float):
        x *= self._scale
        y *= self._scale
        x += board_index * self.map_image.width * self._scale

        return x, y

    def _translate_width(self, width: float, aspect_ratio: float):
        """Aspect ratio: w/h"""
        width *= self._scale
        height = width / aspect_ratio
        return width, height
