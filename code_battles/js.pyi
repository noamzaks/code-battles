"""
Basic type hints for JavaScript, used in Pyodide and PyScript.
A lot of properties are missing.
"""

from typing import Any, Callable, List, Literal, Optional

class JsCallable:
    pass

class CanvasRenderingContext2D:
    textAlign: Literal["left", "right", "center", "start", "end"]
    textBaseline: Literal[
        "top", "hanging", "middle", "alphabetic", "ideographic", "bottom"
    ]
    font: str
    fillStyle: str
    strokeStyle: str
    lineWidth: float

    @staticmethod
    def beginPath(): ...
    @staticmethod
    def arc(
        x: float,
        y: float,
        radius: float,
        startAngle: float,
        endAngle: float,
        counterclockwise=False,
    ): ...
    @staticmethod
    def moveTo(x: float, y: float): ...
    @staticmethod
    def lineTo(x: float, y: float): ...
    @staticmethod
    def stroke(): ...
    @staticmethod
    def fill(): ...
    @staticmethod
    def fillText(text: str, x: float, y: float): ...
    @staticmethod
    def fillRect(x: float, y: float, width: float, height: float): ...
    @staticmethod
    def drawImage(image: "Image", x: float, y: float, width: float, height: float): ...
    @staticmethod
    def clearRect(startX: float, endX: float, width: float, height: float): ...
    @staticmethod
    def rect(startX: float, endX: float, width: float, height: float): ...
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
    clientWidth: Optional[float]
    clientHeight: Optional[float]
    style: Styles

    @staticmethod
    def getContext(dimensions: str) -> CanvasRenderingContext2D: ...
    @staticmethod
    def click(): ...
    @staticmethod
    def getElementsByClassName(classname: str) -> "HTMLCollection": ...

class document:
    body: Element
    fonts: FontFaceSet

    @staticmethod
    def getElementById(id: str) -> Element: ...

class FontFaceSet:
    @staticmethod
    def add(font: FontFace) -> FontFaceSet: ...

class Matches:
    matches: bool

class Event: ...

class LocalStorage:
    @staticmethod
    def getItem(key: str) -> Optional[str]: ...
    @staticmethod
    def setItem(key: str, value: str) -> None: ...

class window(Any):
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
def setInterval(fn: JsCallable, period: float) -> int: ...
def setTimeout(fn: JsCallable, period: float) -> None: ...

class FontFace:
    @staticmethod
    def new(name: str, url: str): ...
    @staticmethod
    def load(): ...
