import sys

from code_battles.utilities import GameCanvas, Alignment, is_web, is_worker
from code_battles.battles import CodeBattles


def run_game(battles: CodeBattles):
    """
    Binds the given code battles instance to the React code to enable all simulations.
    """

    if is_web():
        from js import window
        from pyscript.ffi import create_proxy

        window._startSimulation = create_proxy(battles._start_simulation)
        window._startSimulationFromFile = create_proxy(
            battles._start_simulation_from_file
        )
    elif is_worker():
        setattr(
            sys.modules["__main__"],
            "_run_webworker_simulation",
            battles._run_webworker_simulation,
        )
        setattr(sys.modules["__main__"], "__export__", ["_run_webworker_simulation"])
    else:
        battles._run_local_simulation()


__all__ = ["CodeBattles", "GameCanvas", "Alignment", "run_game"]
