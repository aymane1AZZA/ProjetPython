# Backend Python ULPSS

Ce dossier contient le moteur de calcul Python de l'application.

## Lancer le backend

```bash
python -m backend.main
```

Le serveur démarre sur `http://127.0.0.1:8000` et expose:

- `GET /api/health`
- `POST /api/solve`

L'interface React garde le même design et appelle ce backend via `/api/solve`.
Si le backend Python n'est pas lancé, l'application utilise encore le solveur TypeScript comme secours.
