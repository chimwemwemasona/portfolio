from pathlib import Path
import hashlib, io, json, re, sys, tarfile

ROOT = Path(__file__).resolve().parents[1]

def package(sha, destination):
    if not re.fullmatch(r"[0-9a-f]{40}", sha): raise ValueError("Invalid commit SHA")
    dist = ROOT / "dist"
    files = sorted(f for f in dist.rglob("*") if f.is_file())
    if any(f.is_symlink() for f in dist.rglob("*")): raise ValueError("Symlink in assets")
    manifest = {"commit": sha, "files": {f.relative_to(dist).as_posix(): hashlib.sha256(f.read_bytes()).hexdigest() for f in files}}
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(destination, "w:gz") as archive:
        for file in files: archive.add(file, arcname=file.relative_to(dist).as_posix(), recursive=False)
        data = json.dumps(manifest, sort_keys=True).encode()
        info = tarfile.TarInfo(".deployment-manifest.json")
        info.size = len(data)
        info.mode = 0o644
        archive.addfile(info, io.BytesIO(data))
    print(f"Packaged {len(files)} assets for {sha}")

if __name__ == "__main__": package(sys.argv[1], sys.argv[2])
