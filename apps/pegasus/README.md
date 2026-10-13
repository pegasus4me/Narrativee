# Pegasus

Landing personnelle safoan.inc : présentation de Pegasus et de Narrativee,
premier produit et priorité actuelle. Fond blanc, police Geist Mono locale, aucun logo.

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
