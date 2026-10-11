from pathlib import Path
import hashlib, importlib.util, io, json, tarfile, unittest, tempfile
from unittest.mock import patch
from types import SimpleNamespace

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("deployment", root / "deploy/server_deploy.py")
deployment = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deployment)
SHA = "a" * 40

def artifact(entries, hashes=None, commit=SHA):
    if hashes is None: hashes = {name: hashlib.sha256(data).hexdigest() for name, data in entries}
    output = io.BytesIO()
    with tarfile.open(fileobj=output, mode="w:gz") as archive:
        for name, data in entries + [(".deployment-manifest.json", json.dumps({"commit": commit, "files": hashes}).encode())]:
            info = tarfile.TarInfo(name)
            info.size = len(data)
            archive.addfile(info, io.BytesIO(data))
    return output.getvalue()

class ArtifactTests(unittest.TestCase):
    def test_valid_payload(self):
        data, manifest = deployment.unpack(artifact([("index.html", b"portfolio")]), SHA)
        self.assertEqual(data["index.html"], b"portfolio")
    def test_traversal_rejected(self):
        with self.assertRaises(ValueError): deployment.unpack(artifact([("../authorized_keys", b"bad")]), SHA)
    def test_duplicate_rejected(self):
        with self.assertRaises(ValueError): deployment.unpack(artifact([("index.html", b"a"), ("index.html", b"b")]), SHA)
    def test_checksum_rejected(self):
        with self.assertRaises(ValueError): deployment.unpack(artifact([("index.html", b"a")], {"index.html": "0" * 64}), SHA)
    def test_wrong_commit_rejected(self):
        with self.assertRaises(ValueError): deployment.unpack(artifact([("index.html", b"a")], commit="b" * 40), SHA)
    def test_symlink_rejected(self):
        output = io.BytesIO()
        with tarfile.open(fileobj=output, mode="w:gz") as archive:
            info = tarfile.TarInfo("index.html")
            info.type = tarfile.SYMTYPE
            info.linkname = "/etc/passwd"
            archive.addfile(info)
        with self.assertRaises(ValueError): deployment.unpack(output.getvalue(), SHA)

class ActivationTests(unittest.TestCase):
    def run_case(self, failure, head=SHA):
        with tempfile.TemporaryDirectory() as directory:
            site = Path(directory)
            (site / "releases/previous").mkdir(parents=True)
            (site / "current").symlink_to("releases/previous", target_is_directory=True)
            opener = SimpleNamespace(open=lambda *args, **kwargs: io.BytesIO(json.dumps({"object": {"sha": head}}).encode()))
            patches = [patch.object(deployment, "ROOT", site), patch.object(deployment, "build_opener", return_value=opener), patch.object(deployment, "verify", side_effect=failure), patch.object(deployment.sys, "stdin", SimpleNamespace(buffer=io.BytesIO(artifact([("index.html", b"new")])))), patch.dict(deployment.os.environ, {"SSH_ORIGINAL_COMMAND": "deploy " + SHA}), patch.dict(deployment.sys.modules, {"fcntl": SimpleNamespace(LOCK_EX=2, flock=lambda *args: None)})]
            from contextlib import ExitStack
            with ExitStack() as stack:
                for item in patches: stack.enter_context(item)
                with self.assertRaises((RuntimeError, ValueError)): deployment.main()
            self.assertEqual(deployment.os.readlink(site / "current"), "releases/previous")
            self.assertFalse((site / "deployment.json").exists())
    @unittest.skipIf(deployment.os.name == "nt", "Windows symlink creation requires privileges; run on Ubuntu CI")
    def test_failed_health_check_restores_previous_release(self):
        self.run_case(RuntimeError("health check failed"))
    @unittest.skipIf(deployment.os.name == "nt", "Windows symlink creation requires privileges; run on Ubuntu CI")
    def test_stale_commit_never_activates(self):
        self.run_case(None, head="b" * 40)

if __name__ == "__main__": unittest.main()
