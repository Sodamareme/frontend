# Frontend Architecture Boundary

## Decision
Le frontend doit appeler le backend Nest comme source de verite principale pour le domaine metier.

Les routes Next dans `app/api` ne doivent pas heberger de logique Prisma metier duplicative. Elles sont reservees a des usages limites:
- proxy d'authentification ou d'integration externe
- adaptation de cookies/session specifique au frontend
- besoins edge ou secrets strictement lies au runtime Next

## Why
L'etat actuel melange deux frontieres:
- appels directs au backend Nest via `NEXT_PUBLIC_API_URL`
- routes Next locales qui accedent aussi a Prisma

Ce melange cree:
- des contrats API dupliques
- des comportements divergents entre local et prod
- des bugs plus difficiles a diagnostiquer
- une responsabilite metier partagee entre deux serveurs

## Target Boundary
- le backend Nest porte la logique metier, la validation et l'acces base de donnees
- le frontend consomme ces endpoints via les clients API dans `lib/api.ts` et assimilés
- les routes `app/api` frontend doivent etre l'exception, pas la norme

## Immediate Cleanup Applied
- suppression de la route dupliquee `app/api/modules/[id]/grades/route.ts`
- nettoyage de `lib/api/grades.ts` pour retirer les variantes concurrentes et le code placeholder

## Rules For New Work
- si une fonctionnalite touche un aggregate metier existant, ajouter/modifier l'endpoint dans le backend Nest
- ne pas ajouter de nouvelle route Prisma dans `frontend/app/api` pour un domaine deja servi par le backend
- si une route Next est necessaire, documenter pourquoi elle ne peut pas vivre dans le backend

## Existing Exceptions To Revisit
- `app/api/auth/login/route.ts` peut rester temporairement comme proxy de transition
- les autres routes Prisma dans `app/api/grades/*` et `app/api/modules/[id]/*` sont de la dette technique a migrer vers le backend

## Migration Path
1. garder le backend Nest comme contrat officiel
2. faire pointer les clients frontend vers ce contrat
3. supprimer progressivement les routes Prisma restantes dans `app/api`
4. retirer `lib/prisma.ts` du frontend une fois la migration terminee
