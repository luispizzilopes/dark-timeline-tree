# Dark — A Árvore do Tempo · Documentação técnica

Visualizador interativo da genealogia da série *Dark* (Netflix): grafo familiar por mundo, análise de parentesco, detecção de ciclos genealógicos (paradoxos de bootstrap) e rastro verificável de cada conclusão até o vínculo do JSON que a sustenta.

## 1. Stack e comandos

| Item | Tecnologia |
|---|---|
| UI | React 18 (JSX, sem TypeScript) |
| Build/dev | Vite 5 + `@vitejs/plugin-react` |
| Estilo | CSS puro (sem framework) |
| Dados | Um único JSON estático, importado em build |
| Geração dos dados | Script Python (`scripts/`) |

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção em dist/
npm run preview   # serve o build

python3 scripts/build_dark_genealogy.py   # regenera src/data/dark-genealogia.json
```

Não há testes automatizados nem backend. Tudo roda no navegador.

## 2. Estrutura de pastas

```
index.html
scripts/
  build_dark_genealogy.py     gera o JSON (relações declaradas uma vez; o resto é derivado)
  images.json                 URLs das fotos
src/
  main.jsx                    ponto de entrada
  App.jsx                     composição da tela
  data/                       dados e adaptação para a UI
  domain/                     lógica pura, sem React
    kinship/                  motor de parentesco
    layout/                   layout do grafo
    highlight.js              regra de destaque
  hooks/                      estado e efeitos
  components/
    brand/ common/ layout/ graph/ panels/ kinship/
  styles/                     CSS dividido por área
```

Regra de dependência: `components → hooks → data/domain`. A pasta `domain/` não importa React nem `data/`, o que permite testá-la em Node puro.

## 3. Modelo de dados (`src/data/dark-genealogia.json`)

Chaves de topo: `meta`, `worlds`, `families`, `characters`, `relationships`, `identities`, `paradoxes`, `familyTrees`, `crossWorldConnections`.

- **`worlds`** (3): `origin_world`, `jonas_world`, `martha_world`, com `color`, `status` e `survivesFinalResolution`.
- **`characters`** (108): uma entrada por *versão* de cada pessoa em cada mundo. Versões equivalentes compartilham `canonicalSlug`. Campos relevantes: `worldId`, `gender`, `birth`, `photo`, `timeTravel`, `bootstrapParadox`, `knotDependence`, `existsAfterFinalResolution`, `temporalVersions`, `counterparts`.
- **`relationships`** (197): **fonte de verdade da genealogia.** Tipos: `parent_child` (119), `spouse` (32), `partner` (18), `sibling` (25), `derived_kinship` (3). Cada uma traz `certainty` (`confirmed` > `high` > `medium` > `low`), `evidence`, `worldId` (ou `cross_world`) e, para `parent_child`, `kind` (`biological`, `adoptive`, `step`, `unknown_nature`).
- **`identities`**: cadeias de nomes (ex.: um viajante que assume outro nome).
- **`paradoxes`** (8): ciclos catalogados, com `relationshipIds`, `participants` e `brokenByResolution`.
- **`familyTrees`**: árvores prontas por mundo; `consolidated` agrupa as versões (`cg_<slug>`) para a visão "Os Três Mundos".
- **`crossWorldConnections.counterpartGroups`**: grupos de versões equivalentes (não são a mesma pessoa).

O script Python declara cada relação **uma vez**; `parents/children/partners/siblings` dos personagens e as árvores são derivados, garantindo simetria e integridade referencial.

## 4. Camada de dados da UI (`src/data/`)

| Arquivo | Responsabilidade |
|---|---|
| `dataset.js` | Importa o JSON e exporta índices: `DATA`, `CH` (personagens por id), `WORLD`, `PARADOX`, `GROUP_BY_SLUG` e `KG` (grafo de parentesco) |
| `views.js` | Lista de visões (`VIEWS`) e `CONSOLIDATED_VIEW` |
| `buildView.js` | `buildView(viewId)` → `{ nodes, edges, spouses, partners }` para o grafo |
| `labels.js` | Rótulos em português (certeza, tipos de paradoxo) |
| `names.js` | `shortName` |

Na visão consolidada, cada nó é um grupo de versões (`cg_<slug>`) e as arestas vêm de `familyTrees.consolidated`. Nas demais, nós e arestas são filtrados por `worldId` (`cw_unknown` aparece em Jonas e Martha).

## 5. Motor de parentesco (`src/domain/kinship/`)

Dirigido 100% pelos dados: nenhuma regra cita um personagem específico. Novas entradas no JSON são analisadas sem alterar o código. A API pública está em `index.js`.

**Grafo** (`graphBuilder.js`): `buildKinshipGraph(raw)` cria mapas `up`/`down` (arestas pai→filho, `{ rel, parent, child, kind }`), além de `spouses`, `partners`, `siblingRels`, `derivedRels` e `identities`. `withMinCertainty(g, rank)` devolve uma visão filtrada por certeza mínima; toda análise posterior respeita o corte.

**Texto como partes**: todo texto gerado é uma lista de strings e `{ id, text }` (referência a personagem). A UI renderiza o nome clicável; `partsToText` achata para texto puro.

| Módulo | Responsabilidade |
|---|---|
| `constants.js`, `labels.js`, `utils.js` | Constantes, tabelas em PT e helpers (`uniq`, `plural`, `pick`, `listPt`, `yearOf`) |
| `naming.js` | `displayName`, gênero, `nm` (desambigua homônimos de outro mundo com o nome do mundo) |
| `titles.js` | Títulos de parentesco: avô/bisavô, tio/primo de n-º grau, etc. |
| `evidence.js` | Mundos da aresta, certeza mais fraca, inversão cronológica, `traceSteps` (rastro) |
| `traversal.js` | `walk`: enumera caminhos **simples** subindo/descendo, com trava `MAX_EXPANSIONS`; `reached` agrupa por profundidade |
| `cycles.js` | SCC (Tarjan, com cache) para saber quem pode estar em ciclo; `findCycles` lista os ciclos simples por personagem |
| `cycleNarrative.js` | Narrativa do ciclo, cláusulas de identidade e notas de viajante |
| `directKin.js` | Pais, filhos, cônjuges, parceiros e irmãos (registrados + derivados de pais em comum) |
| `lineFinding.js` | Achado de linha direta (ancestral/descendente) |
| `collateral.js` | Ancestral comum mais próximo → tio, primo, meio-irmão |
| `relate.js` | Relação entre duas pessoas (achados + resumo) |
| `unusualRelations.js` | Parceiro que é parente, parentesco derivado registrado, ancestral em duas gerações |
| `crossWorldLinks.js`, `generations.js`, `summary.js` | Vínculos entre mundos, agrupamento por geração, frase-resumo |
| `analyze.js` | Orquestra tudo para um personagem |

`analyze(g, id, { depth })` retorna `{ id, depth, summary, direct, ancestors, descendants, totals, cycles, unusual, crossWorld, counterparts }`.

Conceitos importantes:
- **Linhagem** = vínculos `biological` e `adoptive` (`ANCESTRY_KINDS`). Ciclo *genético* é o composto só por vínculos biológicos.
- **Rastro**: cada passo traz `relId`, tipo, mundos, certeza, fonte e nota, permitindo conferir a conclusão no JSON.
- **Inversão cronológica**: pai nascido depois do filho é tratado como indício de viagem no tempo.

## 6. Layout do grafo (`src/domain/layout/`)

`layout(nodes, edges, spouses)` → `{ pos: Map(id → {x, y, layer}), back, width, height }`. Funciona em grafos **com ciclos**:

1. `backEdges.js` — DFS marca as arestas de retorno (as que fecham ciclos); elas são desenhadas como curvas.
2. `depths.js` — profundidade por caminho mais longo nas arestas diretas; raízes descem até logo acima do primeiro filho ou ao lado do cônjuge; casais são alinhados na mesma camada (exceto quando um é ancestral do outro).
3. `layerOrdering.js` — ordenação por baricentro (8 varreduras) e colagem dos casais.
4. `layoutGraph.js` — converte camadas em coordenadas (`COL_W`, `LAYER_H` em `constants.js`).

`neighborsClosure.js` calcula o fecho de ancestrais/descendentes usado no destaque.

## 7. Estado e hooks (`src/hooks/`)

- **`useExplorer`** — controlador da aplicação: mundo atual, seleção, aba, foco (`up`/`down`/`both`), paradoxo ativo, overlay, busca, centralização e painel recolhível. Expõe `select`, `onGo` (troca de mundo se o personagem não está na visão), `openVersion`, `changeView`, `onParadox`, `pickOverlay`, `clearAll`.
- **`useHighlight`** — memoiza `computeHighlight` (`domain/highlight.js`). Prioridade: **paradoxo > foco de linhagem > seleção > overlay**; a busca restringe o resultado. Devolve `{ lit, litEdges }`.
- **`useViewport`** — pan (arrasto), zoom (roda e botões), ajuste à tela e centralização em um nó.
- **`useIntro`**, **`useEscapeKey`** (Esc limpa a seleção), **`useLineVisibility`** (liga/desliga tipos de linha).

## 8. Componentes (`src/components/`)

| Pasta | Conteúdo |
|---|---|
| `brand/` | `Triquetra` (logo SVG) |
| `common/` | `Chip`, `Row`, `Cert`, `Photo`, `Seg` (seletor segmentado) |
| `layout/` | `Header`, `Toolbar`, `Footer` (legenda), `SidePanel`, `IntroOverlay` |
| `graph/` | `GraphView`, `GraphDefs`, `GraphNode`, `ParentEdge`, `RelationEdges` (casamento/parceria), `ZoomControls`, `geometry.js` |
| `panels/` | `PersonPanel` (composto por `PersonHeader`, `FocusControls`, `FamilySection`, `TimeSection`, `VersionsSection`, `IdentitiesSection`, `CounterpartsSection`), `GroupPanel`, `ParadoxPanel`, `AboutPanel` |
| `kinship/` | `KinshipSection` (análise), `CycleCard`, `UnusualRelations`, `Generations`, `KinChip`, `CrossWorldSection`, `RelateTool`, `Parts`, `Meta`, `Trace` |

Fluxo: `App` usa `useExplorer` e distribui estado e callbacks por props para `Header`, `Toolbar`, `GraphView`, `SidePanel` e `Footer`. `GraphView` calcula o layout (memoizado por `view`) e delega pan/zoom a `useViewport`.

## 9. Estilos (`src/styles/`)

`index.css` importa, nesta ordem (a ordem importa na cascata): `layout.css` (variáveis, app, cabeçalho, toolbar), `graph.css`, `panel.css` (painel lateral e legenda), `kinship.css`, `responsive.css` (mobile ≤ 820px e `prefers-reduced-motion`). Cores e fontes vêm de variáveis em `:root`.

## 10. Como estender

- **Novo personagem ou relação**: edite `scripts/build_dark_genealogy.py` e regenere o JSON. O motor, o grafo e os painéis passam a incluí-lo sem mudar código.
- **Nova visão/mundo**: adicione a `worlds` no JSON e a entrada em `data/views.js`.
- **Nova regra de parentesco**: crie um módulo em `domain/kinship/` e chame-o de `relate.js` ou `analyze.js`; exporte pelo `index.js` só o que a UI precisar.
- **Novo painel ou seção**: um componente por arquivo em `components/panels/` ou `components/kinship/`, e uma linha de composição em `PersonPanel`/`KinshipSection`.