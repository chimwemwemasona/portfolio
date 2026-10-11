"""Installed out of the public root; invoked by a restricted SSH key."""
from pathlib import Path, PurePosixPath
import hashlib, io, json, os, re, ssl, sys, tarfile, time
from urllib.request import build_opener, HTTPSHandler, ProxyHandler, Request

ROOT = Path("/home/chimwemwe/apps/chimwemwe-portfolio")
CERT = Path("/home/chimwemwe/apps/chimwemwe-portfolio-tls/portfolio.crt")
URL = "https://95.217.214.201"
MAX_BYTES = 20 * 1024 * 1024

def unpack(payload, sha):
    if len(payload) > MAX_BYTES: raise ValueError("Artifact too large")
    with tarfile.open(fileobj=io.BytesIO(payload), mode="r:gz") as archive:
        members = archive.getmembers()
        if len(members) > 500: raise ValueError("Too many files")
        names = [m.name for m in members]
        if len(names) != len(set(names)): raise ValueError("Duplicate paths")
        total = 0
        data = {}
        for member in members:
            path = PurePosixPath(member.name)
            if not member.isfile() or path.is_absolute() or ".." in path.parts or "\\" in member.name:
                raise ValueError("Unsafe artifact entry")
            if path.as_posix() != member.name: raise ValueError("Non-canonical path")
            if member.name != ".deployment-manifest.json" and any(part.startswith(".") for part in path.parts):
                raise ValueError("Hidden asset")
            total += member.size
            if total > MAX_BYTES: raise ValueError("Expanded artifact too large")
            data[member.name] = archive.extractfile(member).read()
    manifest = json.loads(data.pop(".deployment-manifest.json"))
    if manifest["commit"] != sha or set(manifest["files"]) != set(data): raise ValueError("Manifest mismatch")
    if "index.html" not in data: raise ValueError("Missing index")
    for name, contents in data.items():
        if hashlib.sha256(contents).hexdigest() != manifest["files"][name]: raise ValueError("Checksum mismatch")
    return data, manifest

def point_to(target):
    temp = ROOT / "current.next"
    if temp.is_symlink(): temp.unlink()
    os.symlink(target, temp)
    os.replace(temp, ROOT / "current")

def verify(data):
    opener = build_opener(ProxyHandler({}), HTTPSHandler(context=ssl.create_default_context(cafile=str(CERT))))
    for name, expected in data.items():
        from urllib.parse import quote
        with opener.open(URL + "/" + quote(name), timeout=10) as response:
            if response.status != 200 or response.read() != expected: raise RuntimeError("Live asset mismatch: " + name)
    # Guard the existing community site as well.
    with opener.open("http://95.217.214.201/", timeout=10) as response:
        if response.status != 200: raise RuntimeError("Twin Palm availability check failed")

def main():
    import fcntl
    command = os.environ.get("SSH_ORIGINAL_COMMAND", "")
    match = re.fullmatch(r"deploy ([0-9a-f]{40})", command)
    if not match: raise ValueError("Only deploy <commit-sha> is permitted")
    sha = match.group(1)
    payload = sys.stdin.buffer.read(MAX_BYTES + 1)
    data, manifest = unpack(payload, sha)
    with (ROOT / ".deploy.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        opener = build_opener(ProxyHandler({}))
        req = Request("https://api.github.com/repos/chimwemwemasona/portfolio/git/ref/heads/main", headers={"User-Agent": "portfolio-deployment"})
        with opener.open(req, timeout=15) as response: head = json.load(response)["object"]["sha"]
        if sha != head: raise ValueError("Stale deployment: commit is no longer main")
        release = ROOT / "releases" / sha
        if release.exists():
            for name, contents in data.items():
                if (release / name).read_bytes() != contents: raise ValueError("Existing release differs")
        else:
            release.mkdir(mode=0o755)
            for name, contents in data.items():
                file = release / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_bytes(contents)
                file.chmod(0o644)
        previous = os.readlink(ROOT / "current")
        point_to("releases/" + sha)
        try:
            verify(data)
        except Exception:
            point_to(previous)
            raise
        record = {"commit": sha, "previous": previous, "url": URL, "timestamp": int(time.time())}
        (ROOT / "deployment.json").write_text(json.dumps(record, indent=2) + "\n")
        print("Deployed and verified " + sha + " to " + URL)

if __name__ == "__main__": main()
