# Agora — Feuille de route IA

_Dernière mise à jour : 2026-06-09_

---

## Fonctionnalités déjà en production

| Fonctionnalité | Modèle | Fichier |
|---|---|---|
| Recherche en langage naturel | Claude Haiku | `src/lib/claude.ts` + `src/app/api/search/route.ts` |

---

## Priorité 1 — Haute valeur, faisable immédiatement

### 1. Recommandations personnalisées
**Description** : Section "Pour vous" sur la home page. Claude analyse les catégories d'intérêt, la ville et l'historique (claims/saves) du consommateur connecté pour recommander les meilleures offres actives.

- **Où** : `src/app/[locale]/page.tsx` + nouvelle API `src/app/api/ai/recommendations/route.ts`
- **Modèle** : Claude Haiku (rapide, peu coûteux)
- **Données d'entrée** : intérêts consommateur, ville, historique claims/saves, offres actives
- **Condition** : uniquement si consommateur connecté, sinon section masquée
- **Statut** : ☐ À faire

---

### 2. Génération automatique de description d'offre
**Description** : Bouton "✨ Générer" dans le formulaire de création d'offre du marchand. À partir du titre et du % de réduction, Claude génère une description commerciale accrocheuse.

- **Où** : `src/app/[locale]/dashboard/offers/new/page.tsx` + API `src/app/api/ai/generate-description/route.ts`
- **Modèle** : Claude Haiku
- **Données d'entrée** : titre de l'offre, % de réduction, catégorie du marchand
- **UX** : bouton sous le champ description, streaming optionnel
- **Statut** : ☐ À faire

---

### 3. Chatbot assistant consommateur
**Description** : Chat flottant sur la home page. Le consommateur pose une question en langage naturel (*"J'ai 20€, je cherche un cadeau à Lyon"*) et Claude répond avec les meilleures offres/produits correspondants, directement en texte conversationnel.

- **Où** : composant `src/components/AiChat.tsx` + API `src/app/api/ai/chat/route.ts`
- **Modèle** : Claude Haiku avec streaming (réponse en temps réel)
- **Données d'entrée** : message utilisateur + offres/produits actifs + ville du consommateur
- **UX** : bulle flottante en bas à droite, s'ouvre en overlay
- **Statut** : ☐ À faire

---

## Priorité 2 — Valeur moyenne, plus complexe

### 4. Score de pertinence sur les résultats de recherche
**Description** : Améliorer la recherche actuelle — Claude attribue un score 0-100 à chaque résultat et fournit une explication courte (*"Cette offre correspond car elle est à Paris et expire cette semaine"*).

- **Où** : `src/lib/claude.ts` (modifier `searchWithClaude`) + `src/app/[locale]/(public)/search/page.tsx`
- **Modèle** : Claude Haiku (modifier le prompt existant)
- **UX** : badge de score + tooltip d'explication sur chaque résultat
- **Statut** : ☐ À faire

---

### 5. Génération automatique de description marchand
**Description** : À l'inscription ou dans le profil marchand, Claude génère une description professionnelle à partir du nom, de la catégorie et de la ville.

- **Où** : `src/app/[locale]/register/page.tsx` + `src/app/[locale]/dashboard/` (profil) + API `src/app/api/ai/generate-bio/route.ts`
- **Modèle** : Claude Haiku
- **Données d'entrée** : businessName, category, city, services optionnels
- **Statut** : ☐ À faire

---

### 6. Analyse des tendances — Dashboard marchand
**Description** : Section "Insights IA" dans le dashboard marchand. Claude analyse les données de claims, les offres les plus populaires, et donne des recommandations actionnables (*"Tes offres > 30% ont 3x plus de claims — essaie d'augmenter la remise"*).

- **Où** : `src/app/[locale]/dashboard/page.tsx` + API `src/app/api/ai/insights/route.ts`
- **Modèle** : Claude Sonnet (analyse plus profonde)
- **Données d'entrée** : toutes les offres du marchand + nombre de claims + dates + discounts
- **Condition** : uniquement si le marchand a au moins 3 offres avec des claims
- **Statut** : ☐ À faire

---

## Suivi

| # | Fonctionnalité | Priorité | Statut | PR |
|---|---|---|---|---|
| 1 | Recommandations personnalisées | P1 | ✅ Livré | PR #17 |
| 2 | Génération description offre | P1 | ✅ Livré | PR #17 |
| 3 | Chatbot assistant | P1 | ✅ Livré | PR #17 |
| 4 | Score de pertinence recherche | P2 | ☐ À faire | — |
| 5 | Génération description marchand | P2 | ☐ À faire | — |
| 6 | Analyse des tendances marchand | P2 | ☐ À faire | — |
