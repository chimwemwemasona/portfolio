# Ubuntu hosting

Target server: 95.217.214.201, which already hosts Twin Palm.
Status: prepared locally; server access and portfolio hostname are pending. Nothing has been installed on the server.

## Payload

Publish only the files in `dist/`. This site needs no build, Node service, database, or CMS. The local `.cache/portfolio-static.zip` contains those files at the archive root. Git metadata, hosting credentials, and other repository files are excluded.

## Server inspection before installation

Use the confirmed SSH account and port. Check the OS, available disk space, listening ports, web server processes, active virtual hosts, firewall, and the existing Twin Palm route. If Nginx is already used, inspect its configuration before adding a dedicated host. If Apache, Caddy, or a container proxy owns the ports, adapt to that setup rather than installing a competing listener.

## Intended layout

- Versioned static releases under `/var/www/chimwemwe-portfolio/releases/<commit>/`.
- A `current` symlink points to the active release.
- A dedicated hostname and virtual host route to that directory.
- `deploy/portfolio.nginx.conf.example` is an HTTP Nginx template; its hostname must be replaced. It is not installed or tested against the server yet.
- DNS for the chosen hostname must resolve to the server. Set an AAAA record only if the server's IPv6 address is confirmed.
- Configure HTTPS with the existing certificate tooling after hostname and DNS verification.
- For an IP-only preview, choose a confirmed free port and adjust the listener/firewall; do not reuse Twin Palm's IP route on port 80.

## Activation and verification

1. Upload and extract the static payload into a new release directory. Make files readable by the existing web server account.
2. Record the previous release target and back up any portfolio host configuration before updating it.
3. Point `current` to the new release. Add only the dedicated portfolio host configuration.
4. Validate the web server configuration, for example `sudo nginx -t`, then reload using the server's existing service/container workflow.
5. Check the portfolio HTML and every asset, the chosen hostname, HTTPS, project dialogs, themes, and mobile layout. Confirm Twin Palm still responds at its existing address.
6. Record the deployed commit, live URL, release path, and rollback target.

Rollback switches `current` to the previous portfolio release. A first deployment can be rolled back by disabling only the newly added portfolio host and validating/reloading the existing web server. Do not remove or rewrite Twin Palm configuration.

References: https://nginx.org/en/docs/http/server_names.html and https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files
