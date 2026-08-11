"""Host-side tests for protected remote-console credentials."""

import json
import os
from pathlib import Path
import tempfile
import unittest

from tools.device import (
    ToolError,
    create_network_credentials,
    network_credentials,
)


class RemoteConsoleCredentialTest(unittest.TestCase):
    """Verify creation, validation, and non-overwrite behavior."""

    def test_create_and_read_owner_only_credential(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "keys" / "core.json"

            created = create_network_credentials(str(path), "core-v1")
            identity, psk = network_credentials(str(created))
            document = json.loads(created.read_text(encoding="utf-8"))

            self.assertEqual(created, path)
            self.assertEqual(identity, "core-v1")
            self.assertEqual(len(psk), 32)
            self.assertEqual(len(document["psk"]), 64)
            if os.name != "nt":
                self.assertEqual(created.stat().st_mode & 0o777, 0o600)
            with self.assertRaises(ToolError):
                create_network_credentials(str(path), "core-v1")

    def test_reject_invalid_identity_and_secret(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "invalid.json"

            with self.assertRaises(ToolError):
                create_network_credentials(str(path), "identity with spaces")
            path.write_text(
                json.dumps({"identity": "core-v1", "psk": "00"}),
                encoding="utf-8",
            )
            if os.name != "nt":
                path.chmod(0o600)
            with self.assertRaises(ToolError):
                network_credentials(str(path))


if __name__ == "__main__":
    unittest.main()
