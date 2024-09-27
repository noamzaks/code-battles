from code_battles.utilities import GameCanvas, Alignment
from code_battles.battles import CodeBattles
from js import window
from pyscript.ffi import create_proxy


def run_game(battles: CodeBattles):
    """Binds the given code battles instance to the React code to enable all simulations."""

    window._startSimulation = create_proxy(battles._start_simulation)


__all__ = ["CodeBattles", "GameCanvas", "Alignment", "run_game"]
