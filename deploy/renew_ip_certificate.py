#!/usr/bin/env python3
"""Renew the portfolio IP certificate and activate verified certificate pairs.

Installed outside the public root. Never package ACME state or private keys.
"""
from pathlib import Path
import argparse, fcntl, hashlib, json, os, shutil, ssl, subprocess, tempfile
from datetime import datetime, timezone
from urllib.request import build_opener, ProxyHandler

STATE = Path('/home/chimwemwe/apps/portfolio-acme')
TLS = Path('/home/chimwemwe/apps/chimwemwe-portfolio-tls')
WEBROOT = Path('/home/chimwemwe/apps/tpbc_web/frontend/dist')
CONTAINER = 'chimwemwe-portfolio-tls'
IMAGE = 'certbot/certbot@sha256:f70ad0adbb7e117f0fe42a63c553f28ea451edabc0148757b6efcd9735acaa20'
NGINX_IMAGE = 'nginx@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed43071545afa9d2e27d94'
IP = '95.217.214.201'

def run(cmd):
    result = subprocess.run(cmd, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError('Command failed: ' + ' '.join(cmd) + '\n' + result.stdout + result.stderr)
    return result.stdout

def certbot(dry_run=False):
    (WEBROOT / '.well-known/acme-challenge').mkdir(parents=True, exist_ok=True)
    production = STATE / 'production'
    args = ['/usr/bin/docker', 'run', '--rm', '--user', f'{os.getuid()}:{os.getgid()}', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges']
    for folder, dest in [('config','/etc/letsencrypt'),('work','/var/lib/letsencrypt'),('logs','/var/log/letsencrypt')]:
        args += ['-v', str(production / folder) + ':' + dest]
    args += ['-v', str(WEBROOT) + ':/webroot', IMAGE, 'renew', '--non-interactive', '--cert-name', 'portfolio-ip']
    if dry_run: args.append('--dry-run')
    print(run(args), flush=True)

def activate():
    lineage = STATE / 'production/config/live/portfolio-ip'
    # Validate the trusted chain, expiry, IP name and private-key match before installation.
    run(['openssl','verify','-purpose','sslserver','-CApath','/etc/ssl/certs','-untrusted',str(lineage/'chain.pem'),str(lineage/'cert.pem')])
    run(['openssl','x509','-in',str(lineage/'cert.pem'),'-noout','-checkend','86400'])
    run(['openssl','x509','-in',str(lineage/'cert.pem'),'-noout','-checkip',IP])
    cert_pub = run(['openssl','x509','-in',str(lineage/'cert.pem'),'-pubkey','-noout'])
    key_pub = run(['openssl','pkey','-in',str(lineage/'privkey.pem'),'-pubout'])
    if cert_pub != key_pub: raise ValueError('Certificate and key do not match')
    cert = (lineage/'fullchain.pem').read_bytes()
    fingerprint = hashlib.sha256(cert).hexdigest()
    versions = TLS / 'versions'; versions.mkdir(exist_ok=True); versions.chmod(0o750)
    target = versions / fingerprint
    if not target.exists():
        temp = Path(tempfile.mkdtemp(prefix='.pending-',dir=versions));temp.chmod(0o750)
        for name, mode in [('fullchain.pem',0o644),('privkey.pem',0o640)]:
            shutil.copyfile(lineage/name,temp/name);(temp/name).chmod(mode)
        temp.rename(target)
    active = TLS/'active'
    old_target = os.readlink(active) if active.is_symlink() else None
    if old_target == 'versions/' + fingerprint:
        print('Active certificate is current; no reload required.', flush=True)
        return
    next_link = TLS/'active.next'
    if next_link.is_symlink(): next_link.unlink()
    next_link.symlink_to('versions/' + fingerprint)
    os.replace(next_link,active)
    try:
        run(['/usr/bin/docker','exec',CONTAINER,'nginx','-t'])
        run(['/usr/bin/docker','exec',CONTAINER,'nginx','-s','reload'])
        # Verify with the operating system trust store, without a certificate bypass.
        import time
        opener=build_opener(ProxyHandler({}))
        for attempt in range(10):
            try:
                with opener.open('https://' + IP + '/',timeout=15) as response:
                    if response.status != 200: raise ValueError('HTTPS health check failed')
                break
            except Exception:
                if attempt==9: raise
                time.sleep(.5)
    except Exception:
        if old_target is not None:
            restore=TLS/'active.restore';restore.symlink_to(old_target);os.replace(restore,active)
            run(['/usr/bin/docker','exec',CONTAINER,'nginx','-s','reload'])
        raise
    status={'renewed_at':datetime.now(timezone.utc).isoformat(),'fingerprint_sha256':fingerprint,'certificate':run(['openssl','x509','-in',str(lineage/'cert.pem'),'-noout','-issuer','-enddate']).strip()}
    (STATE/'certificate-status.json').write_text(json.dumps(status,indent=2))
    print('Trusted certificate activated and HTTPS verified.',flush=True)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--dry-run',action='store_true');parser.add_argument('--deploy-only',action='store_true');args=parser.parse_args()
    STATE.mkdir(exist_ok=True);STATE.chmod(0o700)
    with (STATE/'renew.lock').open('w') as lock:
        try: fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError: return
        if not args.deploy_only: certbot(args.dry_run)
        # Dry runs must never activate staging certificates.
        if not args.dry_run: activate()
if __name__=='__main__':main()
