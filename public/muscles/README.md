# public/muscles/

Ilustrações do mapa muscular usadas no card de treino (Hoje). Gere pelos prompts em
`docs/ai/asset-prompts-muscles.md` e salve aqui com **estes nomes exatos** (PNG, fundo
transparente, portrait 2:3):

| Arquivo | Treino |
|---|---|
| `empurrar.png` | Push (peito + ombro + tríceps) |
| `puxar.png` | Pull / Costas + bíceps |
| `peito.png` | Peito isolado |
| `costas.png` | Costas isolado |
| `ombros.png` | Ombro |
| `pernas.png` | Quadríceps / perna (anterior) |
| `gluteos.png` | Glúteo (foco) |
| `posterior.png` | Glúteo + posterior + panturrilha |
| `panturrilha.png` | Panturrilha |
| `corpo.png` | Full body / fallback |
| `abdomen.png` _(opcional)_ | Dia de abdômen / core |
| `bracos.png` _(opcional)_ | Dia de braços (bíceps + tríceps) |

O componente `MuscleArt` resolve a imagem pelos músculos do treino e cai para um
placeholder se o arquivo não existir — então pode subir aos poucos.
