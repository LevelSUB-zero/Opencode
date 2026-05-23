# Open Design on Hugging Face Spaces
#
# To fork this with your own changes, replace the repo URL and ref below
# with your own fork.

ARG NODE_IMAGE=docker.io/library/node:24-slim

FROM ${NODE_IMAGE} AS build

RUN apt-get update && apt-get install -y git python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /src
RUN git clone --depth 1 --branch main \
    https://github.com/LevelSUB-zero/Opencode.git .

RUN corepack enable && \
    corepack prepare pnpm@10.33.2 --activate && \
    pnpm install --frozen-lockfile

RUN pnpm --filter @open-design/daemon build && \
    pnpm --filter @open-design/web build && \
    pnpm --filter @open-design/daemon deploy --legacy --prod /src/deploy/daemon && \
    pnpm store prune && \
    rm -rf /root/.cache /root/.local/share/pnpm/store

FROM ${NODE_IMAGE}

RUN apt-get update && apt-get install -y tini poppler-utils && rm -rf /var/lib/apt/lists/* && \
    addgroup --system --gid 1001 open-design && \
    adduser --system --no-create-home --shell /bin/sh --uid 1001 --ingroup open-design open-design

# NVIDIA NIM is used as the primary agent (API-based, no CLI binary needed).
# Set NVIDIA_NIM_API_KEY as a HF Space Secret for it to work.

WORKDIR /app
COPY --from=build --chown=open-design:open-design /src/deploy/daemon ./apps/daemon
COPY --from=build --chown=open-design:open-design /src/apps/web/out ./apps/web/out
COPY --from=build --chown=open-design:open-design /src/skills ./skills
COPY --from=build --chown=open-design:open-design /src/design-systems ./design-systems
COPY --from=build --chown=open-design:open-design /src/craft ./craft
COPY --from=build --chown=open-design:open-design /src/prompt-templates ./prompt-templates
COPY --from=build --chown=open-design:open-design /src/assets/frames ./assets/frames
COPY --from=build --chown=open-design:open-design /src/assets/community-pets ./assets/community-pets
COPY --from=build --chown=open-design:open-design /src/plugins/_official ./plugins/_official

RUN mkdir -p /data/.od && chown -R open-design:open-design /data

# Entrypoint: generate a runtime API token, inject it into the frontend so
# API calls carry the Authorization header, fix /data volume permissions
# (HF Spaces mounts the persistent volume at /data with root ownership),
# then drop to the unprivileged open-design user and run the daemon.
RUN cat > /entrypoint.sh << 'SCRIPT'
#!/bin/sh
set -e
export OD_API_TOKEN=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")

# Determine the public origin URL for the isLocalSameOrigin bypass
# HF Spaces sets SPACE_SUBDOMAIN (e.g. kratoszeus-design) and SPACE_ID
SPACE_SUBDOMAIN="${SPACE_SUBDOMAIN:-kratoszeus-design}"
export OD_ALLOWED_ORIGINS="https://${SPACE_SUBDOMAIN}.hf.space"

echo "NVIDIA NIM: API-based agent (no binary required)"
echo "Allowed origins: ${OD_ALLOWED_ORIGINS}"

# Inject the API token into the frontend's index.html so all fetch calls
# to /api/* automatically include Authorization: Bearer <token>.
node -e "
var fs = require('fs');
var token = process.env.OD_API_TOKEN;
var html = fs.readFileSync('apps/web/out/index.html', 'utf8');
var script = '<script>window.__OD_API_TOKEN=' + JSON.stringify(token) + ';(function(){var f=window.fetch;window.fetch=function(u,o){o=o||{};var s=typeof u===\"string\"?u:u.toString();if(s.startsWith(\"/api/\")){o.headers=o.headers||{};o.headers[\"Authorization\"]=\"Bearer \"+window.__OD_API_TOKEN}return f.call(window,u,o)}})()</script>';
if (html.indexOf('</head>') !== -1) {
  html = html.replace('</head>', script + '</head>');
} else {
  html = script + html;
}
fs.writeFileSync('apps/web/out/index.html', html);
"

# Patch the compiled server.js at startup:
#   1) openProbePaths uses req.originalUrl (req.path is relative to /api mount)
#   2) Patch origin-validation.js so isLocalSameOrigin trusts same-origin requests
node -e "
var fs = require('fs');
var src = fs.readFileSync('apps/daemon/dist/server.js', 'utf8');
// 1) Fix openProbePaths: TSC splits 'if(...)return next()' across two lines
src = src.replace(
  'if (openProbePaths.has(req.path))\n                return next();',
  'if (openProbePaths.has(req.originalUrl))\n                return next();'
);
fs.writeFileSync('apps/daemon/dist/server.js', src);
// 2) Patch origin-validation.js so all isLocalSameOrigin call sites trust same-origin
var ovSrc = fs.readFileSync('apps/daemon/dist/origin-validation.js', 'utf8');
ovSrc = ovSrc.replace(
  'export function isLocalSameOrigin(req, port, env = process.env) {',
  'export function isLocalSameOrigin(req, port, env = process.env) { var origin=headerValue(req.headers?.origin);if(typeof origin===\"string\"&&origin.length>0){try{var u=new URL(origin);if(u.host===req.headers.host)return true}catch{}}var ref=headerValue(req.headers?.referer);if(typeof ref===\"string\"&&ref.length>0){try{var u=new URL(ref);if(u.host===req.headers.host)return true}catch{}}'
);
fs.writeFileSync('apps/daemon/dist/origin-validation.js', ovSrc);
console.log('Patched: openProbePaths + origin-validation');
"

mkdir -p /data/.od
chown -R open-design:open-design /data/.od
exec su -s /bin/sh open-design -c "node apps/daemon/dist/cli.js --no-open"
SCRIPT
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=384
ENV OD_BIND_HOST=0.0.0.0
ENV OD_PORT=7860
ENV OD_DATA_DIR=/data/.od

EXPOSE 7860

ENTRYPOINT ["/usr/bin/tini", "--", "/entrypoint.sh"]
