# Plantengids

Een catalogus van tuinplanten om te zoeken, filteren en categoriseren op standplaats (zon, halfschaduw,
schaduw), hoogte, bloeikleur en bloeimaand, bladkleur, soort plant, levensduur (vast, een- of tweejarig),
vochtigheid van de grond, inheems of niet en ecologische waarde (bijen, vlinders, vogels, insecten).

- Iedereen kan bladeren en filteren; filters staan in de URL, dus een selectie is te delen.
- Ingelogde gebruikers voegen planten toe, bewerken ze en uploaden foto's.
- Beheerders beheren accounts en importeren planten uit een CSV- of JSON-bestand.
- Het eerste account dat wordt aangemaakt, wordt beheerder.

## Opbouw

| Map | Inhoud |
| --- | --- |
| `frontend/` | React 19, Vite, Tailwind CSS v4 en shadcn/ui-componenten |
| `backend/` | Go-server: API onder `/api`, serveert ook de gebouwde frontend |
| `k8s/` | Deployment, service, route en een PostgreSQL-database via CloudNativePG (met dagelijkse back-up) |
| `.basable/` | Omgevingsconfiguratie en `verify.sh`, de volledige build- en testcontrole |

Foto's staan in de publieke bucket van de omgeving. De startset (139 planten) wordt bij de eerste start
geladen uit `backend/seed.json`, met foto's van Wikimedia Commons; maker en licentie staan bij elke foto.

## Importeren

Onder het accountmenu: *Planten importeren*. Een plant wordt herkend aan de botanische naam: bestaande
planten worden bijgewerkt, nieuwe toegevoegd. **Alleen kolommen die in het bestand staan worden
overschreven**, dus handmatige indeling blijft bij een herimport behouden.

Herkende kolommen (hoofdletters, `_` en `-` maken niet uit): `naam`, `botanische naam`, `soort`,
`levensduur`, `standplaats`, `hoogte` (of `hoogte min`/`hoogte max`), `breedte`, `bloeikleur`, `bladkleur`,
`bloeimaanden` (`6-8`, `juni t/m augustus`), `inheems`, `ecowaarde`, `bijvriendelijk`,
`vlindervriendelijk`, `groenblijvend`, `winterhard`, `vochtigheid`, `giftig`, `geurend`, `eetbaar`,
`beschrijving`, `foto url`, `foto bron` en `bron url`. Een Magento-productexport werkt ook: `name`,
`categories`, `base_image`, `url_key`, `description` en de kenmerken in `additional_attributes`.
De export (*Exporteren als CSV*) gebruikt hetzelfde formaat.

## Lokaal draaien

```sh
docker run -d --name plantengids-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=plantengids -p 5432:5432 postgres:17-alpine
(cd frontend && npm install && npm run build)
(cd backend && COOKIE_INSECURE=1 STATIC_DIR=../frontend/dist go run .)
```

De site draait dan op http://localhost:8080. Voor frontendwerk: `npm run dev` in `frontend/` (stuurt `/api`
door naar poort 8080). Controleer alles voor een push met `bash .basable/verify.sh`.
