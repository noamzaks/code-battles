"""Generic useful utilities for creating games with PyScript."""

import asyncio
import math
import sys
from typing import Callable, List, Union
from enum import Enum

try:
    import js
except Exception:
    pass


def is_worker():
    try:
        from js import window  # noqa: F401

        return False
    except Exception:
        return is_web()


def is_web():
    return (
        "MicroPython" in sys.version or "pyodide" in sys.executable
    ) and not is_worker()


def web_only(method):
    if is_web():
        return method

    def wrapper(*args, **kwargs):
        print(f"Warning: {method.__name__} should only be called in a web context.")

    return wrapper


class Alignment(Enum):
    CENTER = 0
    TOP_LEFT = 1


@web_only
def download_image(src: str):
    from js import Image

    result = asyncio.Future()
    image = Image.new()
    image.onload = lambda _: result.set_result(image)
    image.src = src
    return result


def show_alert(
    title: str, alert: str, color: str, icon: str, limit_time: int = 5000, is_code=True
):
    if is_web():
        from js import window

        if hasattr(window, "showAlert"):
            try:
                window.showAlert(title, alert, color, icon, limit_time, is_code)
            except Exception as e:
                print(e)
    else:
        print(f"[ALERT] {title}: {alert}")


@web_only
def set_results(player_names: List[str], places: List[int], map: str, verbose: bool):
    from js import window

    if hasattr(window, "setResults"):
        try:
            window.setResults(player_names, places, map, verbose)
        except Exception as e:
            print(e)


@web_only
def show_download():
    from js import window

    if hasattr(window, "showDownload"):
        try:
            window.showDownload()
        except Exception as e:
            print(e)


@web_only
def navigate(route: str):
    from js import window

    if hasattr(window, "_navigate"):
        try:
            window._navigate(route)
        except Exception as e:
            print(e)


@web_only
def download_json(filename: str, contents: str):
    from js import window

    if hasattr(window, "downloadJson"):
        try:
            window.downloadJson(filename, contents)
        except Exception as e:
            print(e)


@web_only
def console_log(player_index: int, text: str, color: str):
    from js import window

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
        canvas: "js.Element",
        player_count: int,
        map_image: "js.Image",
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
        image: "js.Image",
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

    def draw_line(
        self,
        start_x: int,
        start_y: int,
        end_x: int,
        end_y: int,
        stroke="black",
        stroke_width=10,
        board_index=0,
    ):
        start_x, start_y = self._translate_position(board_index, start_x, start_y)
        end_x, end_y = self._translate_position(board_index, end_x, end_y)

        self.context.strokeStyle = stroke
        self.context.lineWidth = stroke_width * self._scale
        self.context.beginPath()
        self.context.moveTo(start_x, start_y)
        self.context.lineTo(end_x, end_y)
        self.context.stroke()

    def draw_circle(
        self,
        x: int,
        y: int,
        radius: float,
        fill="black",
        stroke="transparent",
        stroke_width=2,
        board_index=0,
    ):
        """
        Draws the given circle (with the given stroke and fill) in the given coordinates and with the given radius (in map pixels).
        """

        x, y = self._translate_position(board_index, x, y)

        self.context.fillStyle = fill
        self.context.strokeStyle = stroke
        self.context.lineWidth = stroke_width * self._scale
        self.context.beginPath()
        self.context.arc(x, y, radius * self._scale, 0, 2 * math.pi)
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
        from js import window

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
