import sys

from code_battles.utilities import GameCanvas, Alignment
from code_battles.battles import CodeBattles, is_web
from js import window
from pyscript.ffi import create_proxy


def run_game(battles: CodeBattles):
    """
    Binds the given code battles instance to the React code to enable all simulations.
    """

    if is_web:
        window._startSimulation = create_proxy(battles._start_simulation)
    else:
        battles._run_local_simulation()


__all__ = ["CodeBattles", "GameCanvas", "Alignment", "run_game"]
