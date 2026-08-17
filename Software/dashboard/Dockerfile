FROM ghcr.io/cirruslabs/flutter:3.32.8

WORKDIR /workspace
ENV PUB_CACHE=/pub-cache

# Seed pub get so the image is usable before a bind-mount; compose overlays source.
COPY packages/dashboard_domain /workspace/packages/dashboard_domain
COPY packages/dashboard_host /workspace/packages/dashboard_host
COPY app/pubspec.yaml app/analysis_options.yaml /workspace/app/
RUN cd /workspace/packages/dashboard_domain && dart pub get \
 && cd /workspace/packages/dashboard_host && dart pub get \
 && cd /workspace/app && flutter pub get

COPY . /workspace
