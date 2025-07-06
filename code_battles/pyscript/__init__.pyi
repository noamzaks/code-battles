from typing import Any, Literal

class PyWorker:
    def __init__(self, path: str, type: Literal["micropython", "pyodide"]): ...

sync: Any
workers: Any
