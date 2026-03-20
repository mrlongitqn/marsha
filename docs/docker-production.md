# Docker production for Marsha

This repository now includes a production-oriented compose file:

- `docker-compose.prod.yml`
- `env.d/production.dist`
- `env.d/peertube_runner.production.dist`
- `nginx/conf.d/marsha.conf`

## 1. Prepare env files

```bash
cp env.d/production.dist env.d/production
cp env.d/peertube_runner.production.dist env.d/peertube_runner.production
```

Update the secrets and MinIO values in both files.

Important:

- `DJANGO_SCW_EDGE_SERVICE_DOMAIN` is the public object domain used in generated playback URLs.
- It must expose the Marsha bucket at the root path.
- If your MinIO is only reachable as `https://s3.udn.vn/<bucket>/...`, generated media URLs will not match Marsha's storage code.
- `DJANGO_ALLOWED_HOSTS` must include every hostname used by the runner websocket connection.
- If the runner connects to `http://nginx:8080`, add `nginx`.
- If the runner connects to `http://172.30.15.105:8060`, add `172.30.15.105`.

## 2. Create data directories

```bash
mkdir -p db redis app/static ws celery nginx peertube-runner
```

On Windows, create the same folders next to `docker-compose.prod.yml`.

## 3. Build and start

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

## 4. Initialize Django

Run migrations:

```bash
docker compose -f docker-compose.prod.yml exec app python manage.py migrate
```

Collect static files into `./app/static`:

```bash
docker compose -f docker-compose.prod.yml exec app python manage.py collectstatic --noinput
```

Create the admin user:

```bash
docker compose -f docker-compose.prod.yml exec app python manage.py createsuperuser
```

Set Django's current site domain:

```bash
docker compose -f docker-compose.prod.yml exec app python manage.py shell -c "from django.contrib.sites.models import Site; Site.objects.update_or_create(id=1, defaults={'domain': 'videos.udn.vn', 'name': 'videos.udn.vn'})"
```

## 5. Register the production peertube runner

Create a runner registration token and a runner entry matching `env.d/peertube_runner.production`:

```bash
docker compose -f docker-compose.prod.yml exec app python manage.py shell -c "from django_peertube_runner_connector.models import Runner, RunnerRegistrationToken; reg,_=RunnerRegistrationToken.objects.get_or_create(registrationToken='replace-with-registration-secret'); Runner.objects.update_or_create(name='production_peertube_runner', defaults={'runnerRegistrationToken': reg, 'runnerToken': 'replace-with-runner-token', 'lastContact': '2024-01-01T00:00:00Z', 'ip': '127.0.0.1'})"
```

After that, restart the runner:

```bash
docker compose -f docker-compose.prod.yml restart peertube-runner
```

If the runner logs `Unexpected server response: 403` on `/socket.io/`, the most common cause is:

- the runner connects to a host not listed in `DJANGO_ALLOWED_HOSTS`
- or the runner is using an external IP when it should use the internal compose URL

Preferred setting:

```bash
PEERTUBE_RUNNER_production_peertube_runner_REGISTERED_INSTANCE_URL=http://nginx:8080
```

## 6. External reverse proxy

Your host nginx on `172.30.15.3` should proxy:

- `videos.udn.vn` -> `127.0.0.1:8061`

It must forward:

- `Host`
- `X-Forwarded-For`
- `X-Forwarded-Proto https`
- websocket upgrade headers

## 7. MinIO requirements

The MinIO side must provide:

- a bucket matching `DJANGO_STORAGE_S3_BUCKET_NAME`
- CORS allowing `https://videos.udn.vn`
- a public domain matching `DJANGO_SCW_EDGE_SERVICE_DOMAIN`
- public read access for delivered media objects

## Scope

This compose is suitable for:

- VOD upload
- transcoding through PeerTube runner
- documents
- deposits
- markdown

It does not enable by default:

- BBB integration
- XMPP live chat
- P2P tracker
- AWS live raw pipeline
