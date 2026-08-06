# Minimal image for the ECS task's edge/routing container.
#
# Uses deploy/edge.nginx.conf — the SAME hostname-based-upstream config as
# local docker-compose, not the 127.0.0.1 variant (edge.ecs.nginx.conf, now
# unused/kept only as a record of the awsvpc approach that didn't work). The
# task definition uses `bridge` network mode with Docker `links`, which gives
# containers within one task real hostname resolution the same way Compose's
# bridge network does — this was switched FROM `awsvpc` mode because awsvpc
# gives each task its own ENI, completely separate from the EC2 instance's own
# network interface, so the instance's Elastic IP could never reach it without
# an ALB/NLB in front (the thing this whole single-task design exists to avoid).
#
# Build from the repo root so the COPY path below resolves:
#   docker build -f deploy/ecs/edge.Dockerfile -t prolign/edge deploy/

FROM nginx:1.27-alpine
COPY edge.nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
