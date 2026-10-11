# Ubuntu hosting

Live portfolio: http://95.217.214.201:8081/
Deployment date: 11 October 2026
Static source snapshot: `25ac8cd800688fdc1e84fda61ee9c7d040a8bc3c`

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

This deployment uses HTTP on a separate port. A custom domain and HTTPS have not been configured.

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
curl -I http://127.0.0.1:8081/
curl -I http://127.0.0.1/
```

## Rollback

For later releases, atomically switch `current` to the recorded previous release and recheck the public assets. To take this initial portfolio deployment offline, use `docker stop chimwemwe-portfolio`; the `unless-stopped` policy keeps it stopped. `docker start chimwemwe-portfolio` restores it. Neither command affects Twin Palm.

## Domain and HTTPS follow-up

Choose a hostname and point its DNS A record to `95.217.214.201`. Then add a dedicated virtual host to the existing host Nginx, proxying only that hostname to `127.0.0.1:8081`, and provision HTTPS with the server's certificate tooling. Root-owned host configuration requires an interactive sudo step with the current account. After HTTPS is verified, the container can be recreated with its published port bound to loopback. Inspect existing virtual hosts and validate Nginx before any reload.

The original `deploy/portfolio.nginx.conf.example` remains an alternative template for serving files directly through host Nginx. It is not the configuration used by this deployment.

References: https://hub.docker.com/_/nginx and https://docs.docker.com/engine/containers/run/
