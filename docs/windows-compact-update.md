# Mise à niveau Windows — Mon Magasin 1.0.1

Version portable de validation, basée sur la branche principale publiée. Widget compact, météo activée, heure marocaine, prochaine prière. Les améliorations non fusionnées ne sont pas incluses.

1. Avant toute utilisation, faites une sauvegarde vérifiée de votre base PostgreSQL avec l'outil de sauvegarde habituel. Ne réinitialisez pas la base et ne lancez aucune migration.
2. Décompressez cette archive dans un **nouveau dossier**, distinct du dossier d'installation actuel. Ne désinstallez pas l'ancienne version.
3. Exécutez le script `Conserver-Configuration.ps1` dans PowerShell (il copie uniquement les fichiers de configuration existants, sans écraser les fichiers déjà présents, sans afficher les identifiants et sans écrire dans la base). Si la configuration n'est pas détectée, arrêtez la mise à niveau.
4. Fermez l'ancienne application, lancez `Mon Magasin/Mon Magasin.exe` et comparez les données affichées avant toute nouvelle saisie. Si le widget est absent, si le port est occupé, si la connexion échoue ou si les compteurs diffèrent, fermez la nouvelle version et revenez à l'ancienne. Ne changez pas l'adresse de la base.
5. Une fois validée, créez éventuellement un raccourci Windows vers la nouvelle version. L'ancienne reste disponible.

La version portable est non signée : contrôlez son origine GitHub et l'empreinte SHA-256 fournie. Aucun mot de passe n'est inclus volontairement dans le package. Les fichiers de configuration copiés restent sur votre ordinateur. L'ancien identifiant de base exposé dans l'historique doit être renouvelé et la configuration locale mise à jour de façon coordonnée.
