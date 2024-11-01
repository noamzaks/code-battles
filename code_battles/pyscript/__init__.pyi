from typing import Literal

class PyWorker:
    def __init__(self, path: str, type: Literal["micropython", "pyodide"]): ...
