from battles import CodeBattles
from js import window
from pyscript.ffi import create_proxy

def run_game(battles: CodeBattles):
    window._startSimulation = create_proxy(battles._start_simulation)

__all__ = ["CodeBattles", "run_game"]