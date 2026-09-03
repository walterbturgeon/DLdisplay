# DRAGLOG_webapp — la page, une seule fois

Cette page est la **source unique** de la PWA de configuration. Elle sert
**trois appareils** : DLPT2, DLPT3 et DLAP.

Elle vit **hors** de `Documents\Arduino\` volontairement. Ce n'est pas un
sketch : un dossier sans `.ino` dans le repertoire des sketches fait rouspeter
l'IDE Arduino a chaque ouverture.

## La regle

**Une seule copie.** Toute modification se fait ici, et nulle part ailleurs.

Le 26 aout 2026, **sept** copies de `index.html` coexistaient, une par dossier
de sketch, et deux d'entre elles etaient vivantes ET differentes :

| Dossier | Cache | Etat |
|---|---|---|
| `DRAGLOG_v7/webapp` | `draglog-prod-v97` | production, DIFFERENTE de la dev |
| `DRAGLOG_PT2/webapp` | `draglog-dev-v102` | version de travail, gelee avec PT2 |
| `DRAGLOG_v5/v6/v6_5/v8` | divers | historiques, gelees |

Les copies des dossiers geles restent la comme instantanes. On n'y touche pas,
et on n'y reprend rien.

## Comment un seul fichier sert trois appareils

### 1. Un service BLE commun

DRAGLOG et DLAP annoncent tous deux `7a1e0000-9f2b-4b8e-8f21-3d6c9a1e0000`.
La page filtre sur ce service. Les noms distinguent les appareils : `DLAP`
d'un cote, `DL_xxxxx` de l'autre.

### 2. Une seule caracteristique obligatoire

| Caracteristique | DRAGLOG | DLAP |
|---|---|---|
| `…0003` CONFIG | oui | **oui** |
| `…0001` TELEMETRY | oui | non |
| `…0002` STATE | oui | non |
| `…0004` COMMAND | oui | non |
| `…0005` DUMP | oui | non |

La page reclame CONFIG et rend les quatre autres optionnelles. Les reclamer
toutes faisait echouer la connexion des la premiere absente.

### 3. ⚠ La decouverte se fait par les CLES, jamais par le numero de version

C'est la regle centrale. Sur ce projet, `fw=v7.9.00` a couvert **trois** builds
fonctionnellement differents. Une cle presente est une preuve, un numero non.

La table `CAPS` dans `index.html` associe chaque groupe de reglages a une cle
temoin du JSON de configuration. Cle absente, groupe masque, et une banniere
liste ce qui manque.

Le DLAP, lui, se declare par `"dev":"DLAP"` et bascule toute la page.
⚠ Le DRAGLOG n'envoie AUCUN champ `dev` : c'est l'absence qui vaut
« DRAGLOG ». Cela tient a deux appareils. Un troisieme produit obligera
chacun a se nommer explicitement.

## Theme clair et sombre

Trois etats, pas deux. Le bouton en haut a droite fait tourner
**auto → clair → sombre → auto**. « Auto » suit le telephone et reste le
defaut.

Toute couleur passe par une variable CSS, jamais par une valeur en dur —
le graphique compris, qui lit les variables au moment de dessiner puisqu'un
canvas ne sait pas resoudre `var()`.

⚠ **L'etat du theme vit en memoire, pas dans `localStorage`.** Le stockage
ne sert qu'a se souvenir d'une visite a l'autre. En navigation privee il
leve a la LECTURE comme a l'ecriture : une version qui le relisait a chaque
appui recevait toujours « auto » et refaisait toujours le premier pas. Le
mode sombre etait alors inatteignable, sans le moindre message.

En ajoutant une couleur, la definir dans les TROIS blocs : `:root`, le
`@media (prefers-color-scheme:dark)` et `:root[data-theme=dark]`. Une
couleur definie seulement dans un bloc conditionnel ne s'applique jamais
dans l'etat « auto » non marque.

## Historique des passages, servi par le DLAP

Le DLAP garde le **resume** des cent derniers passages qu'il a deposes sur
GitHub : heure, voiture, quatre jalons et vitesses trap. Quarante octets par
passage, en NVS.

⚠ Il ne garde PAS les runs. Le run complet est sur GitHub, qui est fait pour
ca. Le resume sert a repondre a « qu'est-ce que j'ai roule aujourd'hui »
sans ouvrir un navigateur.

Le DLAP expose pour cela les MEMES caracteristiques que le DLPT --
`…0004` COMMAND et `…0005` DUMP -- et le meme protocole : on ecrit
`dumpble`, le flux arrive par blocs, et se termine par `[BLE_DUMP_END]`.
La page reutilise donc `fetchRunsBle()` sans rien changer ; seul le format
du texte differe.

⚠ **Le marqueur `[BLE_DUMP_END]` doit partir dans une notification SEULE.**
Colle a la fin du dernier bloc, il serait noye dans le texte et la page
attendrait vingt secondes avant d'annoncer un delai depasse -- sur un
historique pourtant arrive en entier.

Format, une ligne par passage :

    H,seq,date,heure,unit,statut,t60,t330,v330,t660,v660,t1320,v1320

Temps en millisecondes, vitesses en km/h x100, `0` = jalon non atteint.
`unit` est le nom BLE de l'unite, donc la voiture.

⚠ La `date` est celle du DEPOT, pas du passage : le dump d'un DLPT porte
`heure=HH:MM:SS` et rien de plus. L'ecart se compte en minutes.

Le panneau ne s'affiche que si le module est un DLAP **et** qu'il expose
DUMP. Un DLAP d'avant la version 2.0 n'a pas la caracteristique, et un
bouton qui ne repond jamais vaut moins que pas de bouton.

## Ajouter un reglage — la marche a suivre

1. Ajouter la cle cote firmware, dans les trois endroits : NVS, JSON sortant,
   parseur JSON entrant.
2. Ajouter le champ dans `index.html`.
3. Ajouter une entree dans `CAPS` avec la cle temoin. Le masquage automatique
   devant un firmware plus ancien vient gratuitement.
4. **Incrementer `CACHE` dans `service-worker.js` ET le numero affiche en
   haut de `index.html`.** Les deux vont ensemble : le premier force le
   rafraichissement, le second permet de VERIFIER d'un coup d'oeil quelle
   version le navigateur sert vraiment. Le 27 aout 2026, une heure a ete
   perdue a chercher un defaut de firmware alors que la page affichee
   datait de trois versions plus tot. Sans ca, les telephones
   qui ont deja installe la PWA gardent l'ancienne page, et on cherche
   pourquoi le nouveau reglage n'apparait pas.

## ⚠ Bogue connu, non corrige : la production efface le cache de la dev

`walterbturgeon.github.io/BPS_GPS/` (production) et `.../BPS_GPS_DEV/`
(travail) sont des pages de PROJET : meme schema, meme hote, meme port, donc
**meme origine**. Or `caches.keys()` liste les caches de toute l'origine.

La version de travail a ete corrigee — un `PREFIX` par PWA, et elle ne
nettoie que ses propres versions. **`DRAGLOG_v7/webapp` porte encore l'ancien
filtre** (`const CACHE = 'draglog-prod-v97'`, sans prefixe) : elle continue
donc d'effacer le cache de la dev a chaque activation, ce qui rend le mode
hors ligne imprevisible — precisement ce qui sert en piste.

Les deux doivent recevoir la correction pour que le probleme disparaisse.

## Reste a faire pour le DLPT3

Neuf elements du firmware PT3 n'ont aucun controle dans la page :

| Cle | Reglage |
|---|---|
| `dren` | trame de derive : marche / arret |
| `drid` | identifiant CAN de la trame |
| `drlag` | retard applique au cap de caisse, ms |
| `drcg` | centre de gravite -> essieu arriere, cm |
| `drtk` | souplesse du train arriere, dixiemes de deg/G |
| `drbf` | plein gain sous cet angle attendu |
| `drbz` | gain nul au-dessus |
| `drmg` | plafond de validite du modele, centiemes de G |
| `yawMan` | lacet declare a la main (commandes `yaw:<deg>` et `yawauto`) |

Cles temoins suggerees pour `CAPS` : `dren` pour le groupe « trame de
derive », `drcg` pour le groupe « modele vehicule ».

## Ecran divise du DLdisplay (page v109)

Le DLdisplay est une carte Waveshare AMOLED ronde qui fait tourner un
firmware `DLD.x.xx`. Son ecran est partage : les jalons a droite, **deux
valeurs du bus CAN en direct** a gauche. La page les configure.

| Cle | Reglage |
|---|---|
| `dsp0` | valeur de gauche, en haut |
| `dsp1` | valeur de gauche, en bas |

**Une seule cle par valeur, pas onze.** Chacune porte une chaine compacte :

```
en,id,ext,octet,taille,format,boutiste,facteur,decalage,decimales,nom
1,1252,0,2,2,0,1,0.250000,0.000,0,RPM
```

Raison : onze champs par valeur auraient fait **vingt-deux cles de plus**
dans le JSON de configuration. Ce projet a deja perdu des heures sur un
JSON qui depassait la limite BLE et cessait de partir **sans erreur**.

Cle temoin `CAPS` : **`dsp0`**, avec le drapeau **`materiel: true`**.

⚠ `materiel: true` veut dire que l'absence de la cle n'est PAS un manque de
firmware, c'est une carte sans ecran. Sans ce drapeau, **tous** les DRAGLOG
normaux afficheraient en permanence une alerte « firmware plus ancien » pour
une fonction qu'ils n'auront jamais — et une alerte permanente cesse d'etre
lue.

Le firmware **REFUSE la configuration ENTIERE** sur une valeur invalide, pas
seulement le champ fautif. `dspErreur()` reprend donc mot pour mot les
controles du firmware et bloque l'envoi avec un message qui nomme la valeur
en cause. Si tu changes un controle d'un cote, change l'autre dans le meme
geste.
