from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Dict, List

from battles import CodeBattles, Simulation
from pytest import MonkeyPatch


def snapshot_test(
    monkeypatch: MonkeyPatch,
    battles: CodeBattles,
    seed: int,
    parameters: Dict[str, str],
    bots: List[str],
    name: str,
    tmp_path: Path,
):
    output_path = tmp_path / "output.btl"
    test_path = Path("__snapshots__") / (name + ".snapshot.btl")
    with monkeypatch.context() as m:
        m.setattr(
            sys,
            "argv",
            [
                "code-battles",
                "simulate",
                str(seed),
                str(output_path),
                json.dumps(parameters),
            ]
            + [os.path.abspath(bot) for bot in bots],
        )

        battles._run_local_simulation()
        assert output_path.exists()
        output_simulation = output_path.read_text()
        simulation = Simulation.load(output_simulation)
        assert simulation.seed == seed
        assert simulation.parameters == parameters

        if not test_path.exists():
            os.makedirs(test_path.parent, exist_ok=True)
            test_path.write_text(output_simulation)
        else:
            assert (
                simulation.decisions == Simulation.load(test_path.read_text()).decisions
            ), "Wrong decisions!"
