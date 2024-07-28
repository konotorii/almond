# almond
Electron updating server made to be super light-weight and easy to use and deploy, written in TypeScript!

## Roadmap
- Webhook integration
- Multi-repo capability
- Admin panel
- DB to track downloads and misc data
- Run serverless (haven't tried)

## Deploy with docker-compose
1. Rename the file ``docker-compose.yml.sample`` to ``docker-compose.yml`` and fill out all the env variables.
2. Run the command ``docker compose up -d``. This will automatically fetch the latest version if you haven't already pulled the image.
   1. If you already pulled an image, to update to the latest run ``docker compose pull && docker compose up -d``
   2. To view logs run ``docker compose logs -f``
3. To shut down, ``docker compose down``
 