# Carnet de progression — plan du projet

Date : 14 octobre 2026. Statut : proposition de produit et de réalisation, sans implémentation ni déploiement.

## 1. Intention

Un site personnel pour piloter la progression de Narratif vers 1 000 de revenu mensuel récurrent (MRR), puis suivre d'autres projets avec leurs propres objectifs et historiques.

Pour un fondateur qui perd le fil de sa distribution au quotidien, le carnet rassemble les actions, les résultats et les apprentissages afin de choisir une prochaine action concrète. Sa valeur vient de la continuité : chaque journée enrichit le contexte des suivantes.

La promesse : **ouvrir le site et savoir où j'en suis, ce que j'ai appris et quoi faire maintenant**.

Hypothèses de départ : usage individuel, interface en français, saisie manuelle des résultats, accès privé, plusieurs projets possibles. MRR actuel, devise, tarifs réellement appliqués et échéance sont encore à renseigner. Aucune donnée commerciale fictive ne doit apparaître comme réelle.

## 2. Première minute et boucle quotidienne

À la première ouverture, créer Narratif avec un objectif de 1 000 de MRR et renseigner le MRR de départ, éventuellement à zéro. La cible, l'offre et le temps disponible peuvent être ajoutés progressivement. Le premier écran accepte immédiatement une note libre.

Exemple : « Aujourd'hui, j'ai contacté trois agences. Une m'a répondu et veut voir une démo. Je dois la relancer jeudi. »

Le texte original est sauvegardé avant tout traitement IA. L'IA propose ensuite des actions et résultats à rattacher au journal ; l'utilisateur valide ou corrige ces propositions. Une erreur ou une indisponibilité de l'IA ne doit jamais empêcher d'écrire.

La boucle :

1. Le matin : regarder le cap et sélectionner jusqu'à trois priorités.
2. Dans la journée : ajouter une note, une action ou un résultat.
3. Le soir : clôturer les actions faites et noter les enseignements.
4. À la prochaine ouverture : retrouver les actions restantes et une suggestion adaptée au contexte.

Objectif d'usage : un bilan quotidien en moins de deux minutes. Les détails restent facultatifs.

## 3. Les quatre espaces

### Aujourd'hui — l'écran principal

- Projet actif et progression vers l'objectif.
- Trois priorités maximum, choisies par l'utilisateur.
- Champ « Qu'est-ce que tu as fait ou appris ? ».
- Actions restantes et relances arrivées à échéance.
- Une suggestion principale : action, raison, temps estimé et résultat recherché.

### Journal — la mémoire du projet

- Entrées datées, éditables et consultables par semaine.
- Notes libres, retours clients, blocages et apprentissages.
- Liens vers les actions, expériences et résultats associés.
- Recherche simple dans l'historique.

### Actions — ce qui reste à faire

- Trois états : à faire, en cours, terminé.
- Titre, prochaine échéance facultative et canal facultatif.
- Résultat à renseigner après exécution, immédiatement ou plus tard.
- Une action terminée peut encore attendre une réponse ; son résultat peut donc évoluer.

### Progression — ce qui rapproche du cap

- Historique daté du MRR, objectif et écart restant.
- Clients payants actifs, nouveaux clients et résiliations.
- Résultats hebdomadaires de distribution par canal ou expérience.
- Bilan : ce qui a avancé, ce qui reste incertain et ce qu'il faut essayer ensuite.

Le sélecteur de projet est commun aux quatre espaces. Les historiques et suggestions restent propres à chaque projet.

## 4. Suivre les efforts et leurs résultats

| Niveau | Ce qu'on note | Ce qu'on veut comprendre |
| --- | --- | --- |
| Effort | Messages envoyés, publications, démos, relances | Ai-je exécuté les actions prévues ? |
| Réponse | Réponses obtenues, inscriptions, essais | Quel canal suscite un intérêt réel ? |
| Conversion | Clients payants, première utilisation utile | Cet intérêt débouche-t-il sur une utilisation et un paiement ? |
| Rétention | Retours d'usage, renouvellements, résiliations | Les clients continuent-ils à recevoir de la valeur ? |
| Revenu | MRR observé et évolution | Suis-je plus proche des 1 000 ? |

Une expérience de distribution regroupe un objectif, un canal, une action et un résultat. Exemple : « Contacter dix petites agences avec une proposition de démo ». Un contenu peut produire un résultat plusieurs jours après sa publication ; les résultats tardifs restent rattachables à l'expérience initiale.

On distingue les résultats explicitement rattachés par l'utilisateur des évolutions globales. Une hausse de MRR après une publication ne prouve pas que la publication l'a causée.

Le MRR correspond au revenu récurrent mensuel des abonnements actifs. Les paiements ponctuels sont séparés ; un abonnement annuel est ramené à son équivalent mensuel. Les variations sont présentées par rapport au relevé précédent, avec sa date. Un champ vide signifie « inconnu », pas zéro.

Les chiffres d'un entonnoir doivent concerner la même expérience ou le même groupe suivi. Des totaux hebdomadaires indépendants ne suffisent pas à établir un taux de conversion.

Paliers proposés, modifiables : premier client payant, 100, 250, 500, 750, 1 000 de MRR. Les montants utilisent la devise choisie. Le nombre de clients nécessaire dépend du revenu mensuel moyen par client ; par exemple, 50 par mois donne 20 clients pour 1 000, à prix constant.

## 5. Le rôle de l'IA

L'IA reçoit le contexte du projet, ses objectifs, ses relevés, ses notes récentes, les apprentissages utiles et les actions ouvertes. Elle utilise un véritable appel serveur à un modèle ; des règles fixes ou du contenu de démonstration ne doivent pas être présentés comme de l'IA.

Trois capacités pour la première version :

1. **Structurer une note** : proposer les actions, résultats et blocages détectés, à confirmer.
2. **Proposer la prochaine action** : une priorité principale et au maximum deux alternatives.
3. **Préparer le bilan hebdomadaire** : citer les notes ou résultats qui soutiennent les conclusions et signaler les informations manquantes.

Chaque suggestion comprend : une action concrète, sa justification, les entrées utilisées, une durée indicative et le signal à observer. Les durées et résultats attendus sont des estimations, jamais des faits acquis.

Exemple : « Relance les deux agences qui ont demandé une démo. Le journal indique un intérêt explicite et aucune relance enregistrée. Prévois environ vingt minutes ; observe combien acceptent un rendez-vous. »

L'utilisateur peut accepter une suggestion pour créer une action, la modifier ou l'écarter. L'IA ne contacte personne et ne publie rien automatiquement. Les clés restent côté serveur. Le projet sélectionné détermine strictement le contexte transmis au modèle.

## 6. Périmètre de la première version

La première version comprend : projets multiples, objectif MRR, journal, actions, expériences simples, saisie des résultats, progression, suggestions IA et bilan hebdomadaire à la demande. Les données persistent entre les sessions et appareils après connexion. Un export permet de récupérer les notes et résultats.

Les ajouts suivants attendront un besoin observé : synchronisation de facturation, données des réseaux sociaux, rappels automatiques, notes vocales et collaboration. Le bilan hebdomadaire est déclenché depuis l'application dans cette version ; aucune automation n'est nécessaire pour commencer.

## 7. Plan de réalisation

| Étape | Livrable | Critère de passage |
| --- | --- | --- |
| 1. Cadrage et parcours | Contexte initial de Narratif, maquette des quatre espaces et parcours quotidien | On peut noter une journée et retrouver la prochaine action sans explication |
| 2. Carnet utilisable | Accès privé, projets, notes, actions et sauvegarde | Les données sont retrouvées après fermeture et connexion sur un autre appareil |
| 3. Progression | Relevés MRR, résultats, expériences et vue hebdomadaire | Chaque chiffre est daté et les données inconnues sont visibles |
| 4. Assistance IA | Extraction à confirmer, suggestions et bilan | Les propositions s'appuient sur des entrées réelles et une panne IA préserve la saisie |
| 5. Validation en usage | Sept jours de travail réel sur Narratif et corrections | Le carnet reste assez rapide pour être utilisé quotidiennement |

L'architecture détaillée et l'estimation de réalisation seront établies après l'étape 1. Le dépôt dispose déjà d'un frontend Next.js/React et d'un backend TypeScript avec un client de modèle ; leur réutilisation doit être évaluée avant d'ajouter des dépendances. Le plan propose un espace personnel privé, réutilisable entre projets. Son emplacement exact dans le produit ou dans une application dédiée reste à décider lors du cadrage.

Le stockage doit conserver les projets, notes, actions, expériences, relevés et suggestions acceptées avec leurs dates et liens. Le modèle de base de données et les migrations seront définis lors de l'implémentation, après vérification des conventions existantes.

## 8. Vérification et succès

Avant livraison, vérifier les parcours essentiels : créer deux projets, sauvegarder et modifier une note, terminer une action, ajouter un résultat tardif, enregistrer un relevé et accepter une suggestion. Vérifier également l'accès privé, l'isolation du contexte entre projets, l'export, le comportement sur mobile et la récupération après une erreur de sauvegarde ou d'IA.

Après sept jours, seuils proposés pour décider des améliorations : au moins cinq bilans saisis, un temps de saisie habituel inférieur à deux minutes, au moins deux suggestions jugées utiles et exécutées, et une expérience suivie jusqu'à un résultat observé. Une suggestion acceptée n'est pas nécessairement une suggestion exécutée ; les deux événements restent distincts.

Ces seuils évaluent l'utilité du carnet. La croissance du MRR reste le résultat commercial à suivre dans la durée ; l'outil ne garantit ni les 1 000 ni un délai pour les atteindre.

Pour démarrer la réalisation, renseigner le MRR actuel, la devise, les prix effectivement pratiqués, la cible prioritaire, les canaux déjà essayés et le temps hebdomadaire disponible. Une échéance pour les 1 000 reste facultative.
