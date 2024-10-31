"""
Basic type hints for JavaScript in PyOdide and PyScript.
A lot of properties are missing.
"""

from typing import Callable, List, Literal, Optional

from pyodide.ffi import JsCallable

class TwoDContext:
    textAlign: Literal["left", "right", "center", "start", "end"]
    textBaseline: Literal[
        "top", "hanging", "middle", "alphabetic", "ideographic", "bottom"
    ]
    font: str
    fillStyle: str
    strokeStyle: str
    lineWidth: int

    @staticmethod
    def beginPath(): ...
    @staticmethod
    def arc(
        x: int,
        y: int,
        radius: float,
        startAngle: float,
        endAngle: float,
        counterclockwise=False,
    ): ...
    @staticmethod
    def moveTo(x: int, y: int): ...
    @staticmethod
    def lineTo(x: int, y: int): ...
    @staticmethod
    def stroke(): ...
    @staticmethod
    def fill(): ...
    @staticmethod
    def fillText(text: str, x: int, y: int): ...
    @staticmethod
    def fillRect(x: int, y: int, width: int, height: int): ...
    @staticmethod
    def drawImage(image: "Image", x: int, y: int, width: int, height: int): ...
    @staticmethod
    def clearRect(startX: int, endX: int, width: int, height: int): ...
    @staticmethod
    def save(): ...
    @staticmethod
    def restore(): ...
    @staticmethod
    def translate(x: float, y: float): ...
    @staticmethod
    def rotate(radians: float): ...

class Styles:
    width: str
    height: str
    display: str

class Element:
    id: str
    value: str
    textContent: str
    ariaValueNow: str
    onclick: JsCallable
    width: float
    height: float
    clientWidth: Optional[int]
    clientHeight: Optional[int]
    style: Styles

    @staticmethod
    def getContext(dimensions: str) -> TwoDContext: ...
    @staticmethod
    def click(): ...
    @staticmethod
    def getElementsByClassName(classname: str) -> "HTMLCollection": ...

class document:
    body: Element

    @staticmethod
    def getElementById(id: str) -> Element: ...

class Matches:
    matches: bool

class Event: ...

class LocalStorage:
    @staticmethod
    def getItem(key: str) -> Optional[str]: ...
    @staticmethod
    def setItem(key: str, value: str) -> None: ...

class window:
    devicePixelRatio: float
    localStorage: LocalStorage

    @staticmethod
    def matchMedia(media: str) -> Matches: ...
    @staticmethod
    def createEventListener(event: str, callable: JsCallable) -> None: ...

class Audio:
    volume: float

    @staticmethod
    def new(src: str) -> "Audio": ...
    @staticmethod
    def cloneNode(p: bool) -> "Audio": ...
    @staticmethod
    def play() -> None: ...

class HTMLCollection:
    @staticmethod
    def to_py() -> List[Element]: ...

class Image(Element):
    @staticmethod
    def new() -> "Image": ...

    src: str
    onload: Callable[[Event], None]
    onerror: Callable[[Event], None]

def clearInterval(id: int) -> None: ...
def setInterval(fn: JsCallable, period: int) -> int: ...
def setTimeout(fn: JsCallable, period: int) -> None: ...

class FontFace:
    @staticmethod
    def new(name: str, url: str): ...
    @staticmethod
    def load(): ...
