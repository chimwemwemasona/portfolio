# Ubuntu hosting

Live portfolio: https://95.217.214.201/
HTTP portfolio: http://95.217.214.201:8081/ redirects to HTTPS.
Trusted IP certificate activated: 12 October 2026.

## Server and services

Ubuntu 24.04.4 LTS at `95.217.214.201`, SSH user `chimwemwe`, port 22. SSH credentials, ACME account keys, and TLS private keys are excluded from Git.

Host Nginx serves Twin Palm on port 80. Portfolio containers `chimwemwe-portfolio` (host 8081/container 8080) and `chimwemwe-portfolio-tls` (host 443/container 8443) serve a shared static root. Both use `unless-stopped` restart policies. The Nginx image is pinned:

`nginx@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed43071545afa9d2e27d94`

Nginx runs as UID/GID 101 with supplementary group 1000, a read-only root filesystem and site/config mounts, a writable `/tmp`, dropped capabilities, and resource/log limits. Site root: `/home/chimwemwe/apps/chimwemwe-portfolio/current`, an atomic symlink to a versioned static release. `deployment.json` records the active GitHub commit.

The common configuration includes `/certs/*.nginx.conf`. Only the TLS container mounts `/home/chimwemwe/apps/chimwemwe-portfolio-tls` as `/certs`. HTTP requests on port 8081 redirect to the same IP over HTTPS; port 80 continues serving Twin Palm.

## Trusted IP certificate

Let's Encrypt issued a publicly trusted certificate with `IP:95.217.214.201` as its subject alternative name. No visitor trust-store setup or domain purchase is required. The first certificate expires at `2026-10-19T03:40:34Z`; subsequent expiry dates are recorded in the server's `certificate-status.json`.

Certbot 5.8.0 is pinned to:

`certbot/certbot@sha256:f70ad0adbb7e117f0fe42a63c553f28ea451edabc0148757b6efcd9735acaa20`

ACME state resides at `/home/chimwemwe/apps/portfolio-acme`, mode 700. Production and staging account/config/work/log directories are separate. HTTP-01 validation writes temporary challenge files to Twin Palm's existing web root, `frontend/dist/.well-known/acme-challenge`. No host Nginx configuration change or shutdown is required.

The TLS root contains `versions/<certificate-sha256>/fullchain.pem` and `privkey.pem`. Directories are mode 750, private keys 640 and public certificates 644, owned by UID/GID 1000. The TLS container's supplementary group can read the private key. `/certs/active` atomically selects one complete certificate pair. Nginx loads the full certificate chain and matching key from this symlink.

The original self-signed pair remains on the server for recovery. It is no longer served or used as the Actions verifier's trust anchor. No certificate copy is required in the repository.

## Automatic renewal

IP certificates use Let's Encrypt's `shortlived` profile and are valid for approximately six days. The user crontab checks every four hours:

```cron
17 */4 * * * /usr/bin/python3 /home/chimwemwe/apps/portfolio-acme/renew_ip_certificate.py >> /home/chimwemwe/apps/portfolio-acme/renewal.log 2>&1
```

The helper obtains an exclusive lock, runs Certbot renewal as UID/GID 1000, validates the trusted chain, expiry, IP address and key match, and stages a complete new pair. It atomically switches `active`, validates Nginx, reloads the TLS container and checks public HTTPS with normal trust. On activation failure it restores the prior pair. An unchanged certificate does not require a reload. Staging dry runs never activate staging certificates.

```sh
# Test validation and renewal without changing the production certificate:
python3 /home/chimwemwe/apps/portfolio-acme/renew_ip_certificate.py --dry-run
# Run the same renewal-and-activation procedure as cron:
python3 /home/chimwemwe/apps/portfolio-acme/renew_ip_certificate.py
# Activate an already issued certificate:
python3 /home/chimwemwe/apps/portfolio-acme/renew_ip_certificate.py --deploy-only
crontab -l
tail -n 30 /home/chimwemwe/apps/portfolio-acme/renewal.log
cat /home/chimwemwe/apps/portfolio-acme/certificate-status.json
```

Failures return a nonzero status and are logged. Check the renewal log and current expiry when maintaining the server. Do not remove ACME state, the pinned image or the renewal schedule. Changing the server IP requires obtaining a certificate for the new IP.

## GitHub deployment and service checks

See [CI/CD](CI_CD.md). Pushes to main validate and deploy only static site assets through a restricted SSH command. The installed `/home/chimwemwe/apps/chimwemwe-portfolio/server_deploy.py` uses the operating system's trusted CAs, verifies all asset bytes and checks Twin Palm. Certificate management is independent of content deployment.

```sh
docker ps --filter name=chimwemwe-portfolio
docker exec chimwemwe-portfolio-tls nginx -t
curl -I https://95.217.214.201/
curl -I http://95.217.214.201:8081/
curl -I http://95.217.214.201/
```

## Verification and recovery

Staging and production issuance succeeded. Public HTTPS, IP hostname validation and every static asset passed without `--insecure`, `--cacert` or custom trust. HTTP redirection and Twin Palm/API availability passed. Renewal is tested separately before enabling the cron schedule.

Certificate/config backups are under `/home/chimwemwe/apps/portfolio-acme/backups`. To recover a previous trusted pair, point `active` to the prior version, run `nginx -t` inside the TLS container, and reload it. Avoid reverting to self-signed TLS except as a temporary emergency measure, since visitor trust warnings would return.

Content rollback remains independent: atomically restore `current` to the previous recorded release. Keep earlier releases for recovery. Infrastructure/config updates require administrative SSH access and are not applied by the restricted Actions key.

References: https://letsencrypt.org/2026/03/11/shorter-certs-certbot.html and https://eff-certbot.readthedocs.io/en/stable/using.html

## Additional HTTPS services

Bizrail Africa is served separately at https://95.217.214.201:8444/ by `bizrail-africa-proxy`, with the same trusted IP certificate mounted read-only. The renewal helper reads `/home/chimwemwe/apps/portfolio-acme/tls-consumers.json`, an array of `{container, url}` entries. Its current Bizrail entry checks `/healthz`. When a new certificate is activated, both active TLS services validate, reload and undergo normal HTTPS checks. Stopped or absent additional consumers are skipped and read the active pair on their next startup. Remove a service's entry when retiring it permanently.

The hosted app has its own origin, database and Redis volumes; its sample-business scope and operational instructions are in the Bizrail repository's `docs/hosted-demo.md`. The portfolio's card and project detail dialog both link to the public demo.
