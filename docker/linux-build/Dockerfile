# Image used to build the Linux packages (deb, AppImage) from any host OS.
# Usage: `npm run build:linux:docker` (see docker/linux-build/compose.yml).
FROM node:22-bookworm

# fakeroot/dpkg: deb packaging; rpm: lets `--linux rpm` work too.
# electron-builder downloads its own fpm and appimagetool at build time.
RUN apt-get update \
   && apt-get install -y --no-install-recommends fakeroot dpkg rpm \
   && rm -rf /var/lib/apt/lists/*

# Skip husky's git hooks setup (`prepare` script) inside the container.
ENV HUSKY=0 \
   ELECTRON_CACHE=/cache/electron \
   ELECTRON_BUILDER_CACHE=/cache/electron-builder \
   npm_config_cache=/cache/npm

COPY entrypoint.sh /usr/local/bin/antares-build
RUN chmod +x /usr/local/bin/antares-build \
   && git config --system --add safe.directory /project

WORKDIR /project
ENTRYPOINT ["antares-build"]
