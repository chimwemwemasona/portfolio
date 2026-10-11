# Ubuntu hosting

Live portfolio: https://95.217.214.201/
HTTP portfolio: http://95.217.214.201:8081/ redirects to HTTPS
Deployment date: 11 October 2026
Initial static snapshot: `25ac8cd800688fdc1e84fda61ee9c7d040a8bc3c`. The server-side `deployment.json` records later releases.

## Server and service

Ubuntu 24.04.4 LTS at `95.217.214.201`. SSH user `chimwemwe`, port 22. Authentication uses a local SSH key; credentials and private keys are excluded from Git.

The existing host Nginx continues serving Twin Palm on port 80. The portfolio runs in the separate Docker container `chimwemwe-portfolio`, publishing host port 8081 to container port 8080. Docker is enabled at boot and the container uses `unless-stopped` restart policy.

Deployment root: `/home/chimwemwe/apps/chimwemwe-portfolio`.

- `releases/25ac8cd800688fdc1e84fda61ee9c7d040a8bc3c/`: the eight static files from `dist/`.
- `current`: relative symlink to the active release.
- `portfolio-container.nginx.conf`: deployed configuration, sourced from `deploy/portfolio-container.nginx.conf`.
- `portfolio-static.zip` and `portfolio-checksums.json`: the uploaded artifact and verified SHA-256 manifest.

Image: `nginx@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed43071545afa9d2e27d94`.

Nginx runs as UID/GID 101, with a read-only root filesystem and read-only site/config mounts. A writable 16 MB `/tmp` supports PID/cache files. The container drops all Linux capabilities, enables no-new-privileges, limits memory to 64 MB, CPU to 0.25 and processes to 64, and rotates logs at 10 MB with three files. A health check requests `/` every 30 seconds.

## Verification performed

- Nginx configuration validation passed inside the pinned image.
- Uploaded release files matched the local SHA-256 manifest.
- All eight assets returned HTTP 200 from the public address with the expected content types and exact local-file checksums.
- Container reported healthy.
- Twin Palm returned HTTP 200 on its existing address before and after deployment. Its application and host configuration were not edited.
- Browser visual/interaction checks remain pending due to the local browser limitation.

HTTPS is served by a separate `chimwemwe-portfolio-tls` container on host port 443 to container port 8443. The original container on port 8081 redirects visitors to HTTPS. Both use the same read-only site root and automatically restart.

The common Nginx configuration includes `/certs/*.nginx.conf` when present. Only the TLS container mounts `/home/chimwemwe/apps/chimwemwe-portfolio-tls` at `/certs`; the HTTP container has no certificate mount. The TLS container adds supplementary group 1000 to read the key. The directory is mode 750 and key mode 640. The private key stays on the server, outside the public site.

The certificate is self-signed, with `IP:95.217.214.201` in its subject alternative name. It expires on 11 October 2027. Browsers show a trust warning until the public certificate is explicitly trusted. The public certificate is provided at `deploy/portfolio-certificate.crt`; its private key is never committed. A custom domain is not configured.

Nginx has been validated in both containers. Public HTTPS checks verified every asset against local SHA-256 checksums while trusting this certificate and validating its IP name. HTTP redirect and Twin Palm availability checks passed. The stopped/replacement container approach was rejected by automatic approval review, so HTTPS was added without replacing the original container.

## Automatic deployment

See [CI_CD.md](CI_CD.md) for the GitHub Actions workflow and one-time secret setup. A successful push to main deploys static content through the restricted SSH handler. The procedure below remains available for administrative updates.

## Future content updates

1. Commit the portfolio changes to GitHub and package only `dist/` with a SHA-256 manifest.
2. Upload the archive and manifest over SSH/SCP. Extract them into a new, uniquely named directory under `releases/`, and verify every checksum before activation.
3. Record the old `current` target. Create a temporary relative symlink to the new release, then atomically rename it to `current`. The container mounts the parent deployment root, so it sees this change without being recreated.
4. Check the public HTML/assets and the existing Twin Palm address. Record the new release SHA in `deploy/ubuntu-deployment.json`.
5. Keep the previous release for rollback. Asset filenames are stable, so Nginx sends `Cache-Control: no-cache` to request revalidation.

For configuration changes, validate the new configuration using the pinned image before replacing the server file and reloading the portfolio container. Do not change the host Nginx to update portfolio content.

## Service checks

Run these on the server:

```sh
docker ps --filter name=chimwemwe-portfolio
docker logs --tail 30 chimwemwe-portfolio
docker exec chimwemwe-portfolio nginx -t
docker exec chimwemwe-portfolio-tls nginx -t
curl --cacert /home/chimwemwe/apps/chimwemwe-portfolio-tls/portfolio.crt -I https://95.217.214.201/
curl -I http://95.217.214.201:8081/
curl -I http://127.0.0.1/
```

## Rollback

For later releases, atomically switch `current` to the recorded previous release and recheck the public assets. To take the portfolio offline, stop both `chimwemwe-portfolio` and `chimwemwe-portfolio-tls`; the `unless-stopped` policy keeps them stopped. Starting those two containers restores it. These commands do not affect Twin Palm.

## Certificate renewal and domain follow-up

Before 11 October 2027, issue a new self-signed certificate/key on the server with the IP SAN, preserve the 750 directory/640 key permissions, write files in place, validate and reload only the TLS container. Retain the old pair for recovery. Update the public certificate in this repository and any client trust stores. The deployment handler reads the server certificate as its trust anchor.

For a publicly trusted certificate, choose a domain and DNS A record pointing to the server, then configure that name and a CA-issued certificate. Inspect the existing listener on 443 before changing routing. Host Nginx remains responsible for Twin Palm on port 80.

The `deploy/portfolio.nginx.conf.example` file is an alternative host-Nginx template; it is not active. Current configs are `deploy/portfolio-container.nginx.conf` and `deploy/portfolio-https.nginx.conf`.

References: https://hub.docker.com/_/nginx and https://docs.docker.com/engine/containers/run/
