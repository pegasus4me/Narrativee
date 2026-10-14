# Pegasus

Landing minimale safoan.inc : une courte présentation de Pegasus et un lien vers
Narrativee, avec les logos Pegasus et Narrativee fournis. Fond blanc, sans hero. SF Pro via la police système Apple ;
les autres plateformes utilisent leur police sans-serif de remplacement.

Depuis la racine du monorepo :

```sh
pnpm --filter pegasus dev
```

Ouvrir http://localhost:3020.

Pour utiliser le port 6001 :

```sh
pnpm --filter pegasus dev --port 6001 --hostname 127.0.0.1
```

Next.js refuse le port 6000, réservé à X11.

```sh
pnpm --filter pegasus build
pnpm --filter pegasus check-types
```

Le build exporte le site statique dans `apps/pegasus/out/`.

## Vercel

Production : https://safoan-inc.vercel.app

Projet : `safoan-inc`, dans `billys-projects-66d05268`.
Le déploiement utilise l'export statique ; aucune connexion Git automatique.

Pour mettre à jour le site depuis la racine du monorepo :

```sh
pnpm --filter pegasus build
cp -R apps/pegasus/out/. output/pegasus/vercel-site/
npx vercel@64.0.2 deploy --cwd output/pegasus/vercel-site --prod --scope billys-projects-66d05268
```

Le dossier de déploiement et son lien Vercel sont conservés localement dans
`output/pegasus/vercel-site/` (ignoré par Git).
