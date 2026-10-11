from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"

class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.projects = []
        self.links = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a: self.ids.append(a["id"])
        if "data-project" in a: self.projects.append(a["data-project"])
        for name in ("href", "src"):
            if a.get(name): self.links.append(a[name])

def main():
    parser = SiteParser()
    parser.feed((DIST / "index.html").read_text(encoding="utf-8"))
    assert len(parser.ids) == len(set(parser.ids)), "Duplicate HTML IDs"
    assert parser.projects == ["kwena", "community", "farms", "bizrail", "agritech", "outgrower"], "Unexpected project hierarchy"
    app = (DIST / "app.js").read_text(encoding="utf-8")
    for key in parser.projects:
        assert key + ": {" in app, f"Missing project details: {key}"
    for link in parser.links:
        url = urlsplit(link)
        if url.scheme or url.netloc: continue
        if url.path:
            target = (DIST / url.path).resolve()
            assert target.is_relative_to(DIST.resolve()) and target.is_file(), f"Missing asset: {link}"
        if url.fragment: assert url.fragment in parser.ids, f"Missing anchor: {link}"
    for file in DIST.rglob("*"):
        assert not file.is_symlink(), "Symlink in public assets"
        if file.suffix == ".js": subprocess.run(["node", "--check", str(file)], check=True)
        if file.suffix == ".css":
            css = file.read_text(encoding="utf-8")
            assert css.count("{") == css.count("}"), f"Unbalanced CSS: {file}"
    print("PASS: HTML anchors/assets, six project details, JS syntax, CSS integrity")

if __name__ == "__main__": main()
