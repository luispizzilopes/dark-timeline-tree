#!/usr/bin/env python3
"""Gera dark-genealogia.json: grafo genealógico dirigido de Dark (Netflix).

As relações são declaradas UMA vez (lista `rels`); os campos parents/children/
partners/siblings de cada personagem e as árvores hierárquicas são DERIVADOS,
o que garante a simetria pai<->filho e a integridade referencial.
Uso: python3 scripts/build_dark_genealogy.py
"""
import json, os, sys, itertools
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "dark-genealogia.json")
IM = json.load(open(os.path.join(HERE, "images.json"), encoding="utf-8"))

# --------------------------------------------------------------------------- mundos
WORLD = {"o": "origin_world", "j": "jonas_world", "m": "martha_world"}
PFX = {v: k for k, v in WORLD.items()}

worlds = [
    {
        "id": "origin_world", "prefix": "o", "name": "Mundo de Origem", "aliases": ["Origin World", "Ursprungswelt", "Original World"],
        "description": "Mundo original, sem laços temporais. Em 8/11/1971 Marek, Sonja e a bebê Charlotte Tannhaus morrem num acidente; H. G. Tannhaus constrói uma máquina do tempo para trazê-los de volta e, ao ativá-la (21/06/1986), divide o mundo em dois.",
        "status": "Sobrevive: após Jonas e Martha impedirem o acidente de 1971, a máquina nunca é construída e este é o único mundo que permanece.",
        "survivesFinalResolution": True, "color": "#f2c94c",
    },
    {
        "id": "jonas_world", "prefix": "j", "name": "Mundo de Jonas", "aliases": ["Adam's World", "Mundo de Adam", "Primeiro mundo"],
        "description": "Realidade onde Jonas Kahnwald nasce e, mais velho, se torna Adam, líder do Sic Mundus. É o mundo mostrado na maior parte da 1ª temporada.",
        "status": "Deixa de existir quando o acidente de 1971 é evitado no Mundo de Origem.",
        "survivesFinalResolution": False, "color": "#2d9cdb",
    },
    {
        "id": "martha_world", "prefix": "m", "name": "Mundo de Martha", "aliases": ["Eva's World", "Mundo de Eva", "Segundo mundo"],
        "description": "Realidade alternativa onde Martha Nielsen se torna Eva, líder do Erit Lux. Jonas não nasce aqui (Michael Kahnwald não existe).",
        "status": "Deixa de existir quando o acidente de 1971 é evitado no Mundo de Origem.",
        "survivesFinalResolution": False, "color": "#bb6bd9",
    },
]

# --------------------------------------------------------------------------- famílias
families = [
    {"id": "kahnwald", "name": "Kahnwald", "note": "Linhagem adotiva (Daniel, Ines, Michael) e biológica pela mãe (Hannah Krüger)."},
    {"id": "nielsen", "name": "Nielsen", "note": "Tronte, Ulrich, Mikkel/Michael e Martha; todos descendem do Unknown."},
    {"id": "doppler", "name": "Doppler", "note": "Bernd, Helge, Peter, Charlotte, Elisabeth, Franziska."},
    {"id": "tiedemann", "name": "Tiedemann", "note": "Egon, Claudia, Regina, Aleksander, Bartosz, Silja."},
    {"id": "tannhaus", "name": "Tannhaus", "note": "Heinrich → Gustav → Leopold → H. G. → Marek → Charlotte."},
    {"id": "albers", "name": "Albers", "note": "Pais de Katharina."},
    {"id": "wöller", "name": "Wöller", "note": "Torben e Bernadette (Benni)."},
    {"id": "kruger", "name": "Krüger", "note": "Sebastian e Hannah."},
]

# --------------------------------------------------------------------------- personagens (modelo)
# worlds: subconjunto de "ojm". ph = títulos de página do Dark Wiki para foto (por mundo ou '*').
P = {}
def person(slug, name, g, worlds, fam, born=None, died=None, occ=None, ph=None, names=None, born_w=None, aliases=None):
    P[slug] = dict(slug=slug, name=name, g=g, worlds=worlds, fam=fam, born=born, died=died, occ=occ,
                   ph=ph or {}, names=names or {}, born_w=born_w or {}, aliases=aliases or [])

# Tannhaus
person("heinrich", "Heinrich Tannhaus", "M", "ojm", ["tannhaus"], "c. 1750 (meados de 1700)", "antes de 1888", "Fundador do Sic Mundus", {"*": ["Heinrich Tannhaus"]})
person("charlotte_sr", "Charlotte Tannhaus (mãe de Gustav)", "F", "ojm", ["tannhaus"], None, "c. 1813", None, {})
person("gustav", "Gustav Tannhaus", "M", "ojm", ["tannhaus"], "1813", "1888 (morto pelo Unknown no Mundo de Jonas)", "Industrial; líder do Sic Mundus em 1888", {"*": ["Gustav Tannhaus"]})
person("leopold", "Leopold Tannhaus", "M", "ojm", ["tannhaus"], None, None, None, {})
person("hg", "Heinrich Georg (H. G.) Tannhaus", "M", "ojm", ["tannhaus"], "1913", "Mundo de Origem pré-resolução: entre 1987 e 2020 (Wiki)", "Relojoeiro, cientista, autor de 'Uma Viagem no Tempo'",
       {"o": ["H.G. Tannhaus/Origin World"], "*": ["H.G. Tannhaus"]}, aliases=["H. G. Tannhaus", "O Relojoeiro"])
person("marek", "Marek Tannhaus", "M", "ojm", ["tannhaus"], "1947-03-20", "1971-11-08 (acidente; evitado no Mundo de Origem)", None, {"*": ["Marek Tannhaus"]})
person("sonja", "Sonja Tannhaus", "F", "ojm", ["tannhaus"], "1949-05-26", "1971-11-08 (acidente; evitada no Mundo de Origem)", None, {"*": ["Sonja Tannhaus"]})
person("charlotte_t", "Charlotte Tannhaus", "F", "ojm", ["tannhaus"], "1971-05-30", "1971-11-08 (acidente; evitado no Mundo de Origem)", "Bebê", {"*": ["Charlotte Tannhaus"]})

# Tiedemann / Doppler
person("egon", "Egon Tiedemann", "M", "ojm", ["tiedemann"], "1922", None, "Inspetor-chefe da polícia de Winden", {"m": ["Egon Tiedemann (Eva's World)"], "*": ["Egon Tiedemann"]})
person("doris", "Doris Tiedemann", "F", "ojm", ["tiedemann"], "1922", None, None, {"*": ["Doris Tiedemann"]})
person("claudia", "Claudia Tiedemann", "F", "ojm", ["tiedemann"], "1942-08-14", None, "Diretora da usina nuclear (no Mundo de Jonas/Martha)", {"m": ["Claudia Tiedemann (Eva's World)"], "*": ["Claudia Tiedemann"]},
       names={"o": "Claudia Doppler (née Tiedemann)"})
person("regina", "Regina Tiedemann", "F", "ojm", ["tiedemann", "doppler"], "1971-08-01", None, "Dona de hotel / filha de Claudia e Bernd",
       {"o": ["Regina Doppler"], "m": ["Regina Tiedemann/Eva's World"], "j": ["Regina Tiedemann"]}, names={"o": "Regina Doppler"})
person("bernd", "Bernd Doppler", "M", "ojm", ["doppler"], "1913", None, "Ex-diretor da usina nuclear", {"*": ["Bernd Doppler"]})
person("greta", "Greta Doppler", "F", "jm", ["doppler"], "1917", None, None, {"*": ["Greta Doppler"]})
person("anatol", "Anatol Veliev", "M", "jm", ["doppler"], None, None, None, {})
person("helge", "Helge Doppler", "M", "ojm", ["doppler"], "1944", None, None, {"m": ["Helge Doppler/Eva's World"], "*": ["Helge Doppler"]})
person("ulla", "Ulla Schmidt", "F", "ojm", ["doppler"], None, None, None, {})
person("peter", "Peter Doppler", "M", "ojm", ["doppler"], "1970", None, None, {"m": ["Peter Doppler/Eva's World"], "*": ["Peter Doppler"]})
person("charlotte_d", "Charlotte Doppler", "F", "jm", ["doppler", "tannhaus"], "2041 (no Nó; criada a partir de 1971)", None, "Chefe da polícia de Winden", {"m": ["Charlotte Doppler/Eva's World"], "*": ["Charlotte Doppler"]})
person("elisabeth", "Elisabeth Doppler", "F", "jm", ["doppler"], "2011 (no Nó)", None, "Líder do culto pós-apocalíptico em 2052", {"*": ["Elisabeth Doppler"]})
person("franziska", "Franziska Doppler", "F", "jm", ["doppler"], "2003", None, None, {"*": ["Franziska Doppler"]})
person("aleksander", "Aleksander Tiedemann", "M", "ojm", ["tiedemann"], "1966-04-23", None, "Diretor da usina nuclear", {"m": ["Aleksander Tiedemann/Eva's World"], "*": ["Aleksander Tiedemann"]},
       aliases=["Boris Niewald", "Aleksander Köhler"], names={"o": "Aleksander Köhler (Boris Niewald)"})
person("bartosz", "Bartosz Tiedemann", "M", "jm", ["tiedemann"], "2003", None, None, {"m": ["Bartosz Tiedemann/Eva's World"], "*": ["Bartosz Tiedemann"]})
person("silja", "Silja Tiedemann", "F", "jm", ["tiedemann"], "1988", None, None, {"*": ["Silja Tiedemann"]})
person("hanno", "Hanno Tauber (Noah)", "M", "jm", ["tiedemann"], "1904", "Mundo de Jonas: 1921, morto por Agnes (Wiki)", "Sacerdote do Sic Mundus", {"m": ["Noah/Eva's World"], "*": ["Noah", "Hanno Tauber"]}, aliases=["Noah", "Hanno Tauber"])
# Nielsen
person("agnes", "Agnes Nielsen", "F", "jm", ["nielsen", "tiedemann"], "1910", None, None, {"*": ["Agnes Nielsen"]})
person("tronte", "Tronte Nielsen", "M", "jm", ["nielsen"], "1941", None, "Funcionário da usina; dono da casa dos Nielsen", {"*": ["Tronte Nielsen"]})
person("jana", "Jana Nielsen", "F", "jm", ["nielsen"], "1942", None, None, {"*": ["Jana Nielsen"]})
person("ulrich", "Ulrich Nielsen", "M", "jm", ["nielsen"], "1971 (no Nó)", None, "Policial", {"m": ["Ulrich Nielsen/Eva's World"], "*": ["Ulrich Nielsen"]}, aliases=["Inspetor"])
person("katharina", "Katharina Nielsen (née Albers)", "F", "ojm", ["albers", "nielsen"], "1970-06-22", None, "Diretora do colégio", {"m": ["Katharina Nielsen/Eva's World"], "*": ["Katharina Nielsen"]},
       names={"o": "Katharina Albers"}, born_w={"o": "1970"})
person("mads", "Mads Nielsen", "M", "jm", ["nielsen"], "1973-12-04", "desaparece em 1986", None, {"*": ["Mads Nielsen"]})
person("magnus", "Magnus Nielsen", "M", "jm", ["nielsen"], "2001", None, None, {"m": ["Magnus Nielsen/Eva's World"], "*": ["Magnus Nielsen"]})
person("martha", "Martha Nielsen", "F", "jm", ["nielsen"], "2003", None, None, {"m": ["Martha Nielsen (Eva's World)"], "*": ["Martha Nielsen"]})
person("mikkel", "Mikkel Nielsen", "M", "jm", ["nielsen"], "2008", None, None, {"m": ["Mikkel Nielsen/Eva's World"], "*": ["Mikkel Nielsen"]},
       names={"j": "Mikkel Nielsen / Michael Kahnwald"}, aliases=[])
# Kahnwald / Krüger / Albers / Wöller
person("hannah", "Hannah Krüger", "F", "ojm", ["kruger"], "1972", None, "Enfermeira / esteticista", {"o": ["Hannah Wöller"], "m": ["Hannah Nielsen"], "j": ["Hannah Kahnwald"]},
       names={"o": "Hannah Wöller (née Krüger)", "j": "Hannah Kahnwald (née Krüger)", "m": "Hannah Nielsen (née Krüger)"})
person("sebastian", "Sebastian Krüger", "M", "ojm", ["kruger"], None, None, None, {"*": ["Sebastian Krüger"]})
person("helene", "Helene Albers", "F", "ojm", ["albers"], "1942", None, None, {"*": ["Helene Albers"]})
person("hermann", "Hermann Albers", "M", "ojm", ["albers"], None, None, None, {"*": ["Hermann Albers"]})
person("ines", "Ines Kahnwald", "F", "j", ["kahnwald"], "1940", None, "Enfermeira", {"*": ["Ines Kahnwald"]})
person("daniel", "Daniel Kahnwald", "M", "j", ["kahnwald"], "1915", None, None, {"*": ["Daniel Kahnwald"]})
person("jonas", "Jonas Kahnwald", "M", "j", ["kahnwald", "nielsen"], "2003 (Wiki; em 2019 tem 16)", None, "Estudante; depois O Estranho e Adam", {"*": ["Jonas Kahnwald"]},
       aliases=["O Estranho (Der Fremde)", "Adam"])
person("unknown", "O Desconhecido (A Origem / The Unknown)", "M", "", ["nielsen", "kahnwald"], "concebido em 2019-11-06", "apagado da existência (Wiki)", "Membro do Erit Lux", {"*": ["Unknown"]}, aliases=["Origin", "Der Unbekannte"])
person("torben", "Torben Wöller", "M", "oj", ["wöller"], "1981", None, None, {"*": ["Torben Wöller"]})
person("bernadette", "Bernadette (Benni) Wöller", "F", "oj", ["wöller"], "1987", None, None, {"*": ["Bernadette Wöller"]}, aliases=["Benni"])

person("unborn_m", "Filho(a) não nascido(a) de Ulrich e Hannah (Mundo de Martha)", None, "m", ["nielsen", "kruger"], "gestação em 2019", None, None, {})
person("jonas_woller", "Jonas Wöller (bebê ainda não nascido)", "M", "o", ["wöller", "kruger"], "gestação em 2019/2020", None, None, {})

# --------------------------------------------------------------------------- nós
def N(slug, w):
    return "cw_unknown" if slug == "unknown" else f"{w}_{slug}"

SHOWN_IN_FINAL = {"regina", "hannah", "torben", "bernadette", "peter", "katharina"}
SAVED_1971 = {"marek", "sonja", "charlotte_t"}

nodes = {}
for slug, p in P.items():
    ws = "mj" if slug == "unknown" else p["worlds"]
    for w in (["x"] if slug == "unknown" else ws):
        wid = "martha_world" if slug == "unknown" else WORLD[w]
        name = p["names"].get(w, p["name"])
        nodes[N(slug, w)] = dict(slug=slug, w=w, id=N(slug, w), name=name, g=p["g"], worldId=wid, p=p)

def pick_photo(slug, w):
    p = P[slug]
    def first(titles):
        for t in titles:
            if IM.get(t, {}).get("thumb"):
                return t
        return None
    own = p["ph"].get(w) or p["ph"].get("*") or []
    t = first(own)
    proxy = False
    if not t:
        for ww in "jmo":
            cand = p["ph"].get(ww) or p["ph"].get("*") or []
            t = first(cand)
            if t:
                proxy = True
                break
    if not t:
        return {"url": None, "kind": "unavailable", "note": "Sem imagem no Dark Wiki (Fandom) para este personagem."}
    d = IM[t]
    if not proxy and slug not in ("heinrich", "gustav", "unknown"):
        tw = {"Hannah Nielsen": "m", "Regina Doppler": "o", "Hannah Wöller": "o"}.get(t) or ("m" if "Eva's World" in t else "o" if ("Origin World" in t or "Original World" in t) else None)
        if tw is None:  # páginas sem sufixo: são do Mundo de Jonas, exceto as que só existem na Origem
            tw = "o" if slug in ("marek", "sonja", "charlotte_t") else "j"
        proxy = tw != w
    return {"url": d["thumb"], "originalUrl": d.get("orig"), "kind": "equivalent_version_proxy" if proxy else "wiki_page_image",
            "sourcePage": "https://dark-netflix.fandom.com/wiki/" + d["page"].replace(" ", "_"), "wikiPageTitle": d["page"],
            "note": "Imagem de outra versão do personagem (a página deste mundo não tem foto)." if proxy else None}

# --------------------------------------------------------------------------- relações
rels = []
def _id(prefix, *parts):
    return "_".join([prefix, *parts])

def _world_of(a, b):
    wa, wb = nodes[a]["worldId"], nodes[b]["worldId"]
    return wa if wa == wb else "cross_world"

def pc(parent, child, kind="biological", worlds="ojm", cert="confirmed", note=None, ev="series"):
    """parent/child em slugs; um registro por mundo em que ambos existem."""
    for w in worlds:
        a, b = N(parent, w), N(child, w)
        if a in nodes and b in nodes:
            rels.append(dict(id=_id("rel_pc", a, b), type="parent_child", kind=kind, parentId=a, childId=b,
                             worldId=_world_of(a, b), certainty=cert, evidence=ev, note=note, derived=False))

def pc_ids(parent, child, kind="biological", cert="confirmed", note=None, ev="series"):
    rels.append(dict(id=_id("rel_pc", parent, child), type="parent_child", kind=kind, parentId=parent, childId=child,
                     worldId=_world_of(parent, child), certainty=cert, evidence=ev, note=note, derived=False))

def sp(a, b, worlds="ojm", status="married", cert="confirmed", note=None, ev="series"):
    for w in worlds:
        x, y = N(a, w), N(b, w)
        if x in nodes and y in nodes:
            rels.append(dict(id=_id("rel_sp", x, y), type="spouse", status=status, memberIds=[x, y], worldId=_world_of(x, y),
                             certainty=cert, evidence=ev, note=note, derived=False))

def pt(a, b, worlds, kind, cert="confirmed", note=None, ev="series"):
    for w in worlds:
        x, y = N(a, w), N(b, w)
        if x in nodes and y in nodes:
            rels.append(dict(id=_id("rel_pt", x, y), type="partner", kind=kind, memberIds=[x, y], worldId=_world_of(x, y),
                             certainty=cert, evidence=ev, note=note, derived=False))

def sib(a, b, worlds, kind, cert="confirmed", note=None, ev="series"):
    for w in worlds:
        x, y = N(a, w), N(b, w)
        if x in nodes and y in nodes:
            rels.append(dict(id=_id("rel_sb", x, y), type="sibling", kind=kind, memberIds=[x, y], worldId=_world_of(x, y),
                             certainty=cert, evidence=ev, note=note, derived=False))

WIKI = "dark_wiki"
# ---- Tannhaus
pc("heinrich", "gustav"); pc("charlotte_sr", "gustav")
pc("gustav", "leopold", cert="high", ev="series+wiki", note="A mãe de Leopold não é identificada.")
pc("leopold", "hg", cert="high", ev="series+wiki", note="A mãe de H. G. não é identificada.")
pc("hg", "marek", cert="high", ev="series+wiki", note="A mãe de Marek não é identificada.")
pc("marek", "charlotte_t"); pc("sonja", "charlotte_t")
pc("hg", "charlotte_d", kind="adoptive", worlds="jm", cert="high", ev="series+wiki",
   note="Na noite de 8/11/1971 as versões idosas de Charlotte e Elisabeth levam o bebê a H. G.; ele a cria como neta após perder a família no acidente.")
sp("heinrich", "charlotte_sr", cert="high", ev="series+wiki"); sp("marek", "sonja")
# ---- Tiedemann / Doppler
pc("egon", "claudia"); pc("doris", "claudia")
pc("claudia", "regina"); pc("bernd", "regina", note="Mundo de Origem: casados. Mundos de Jonas/Martha: fruto de um caso de Claudia com Bernd.")
pc("greta", "helge", worlds="jm", cert="high", ev="series+wiki"); pc("anatol", "helge", worlds="jm", cert="high", ev="series+wiki",
   note="Paternidade biológica de Anatol Veliev (a concepção decorre de violência sexual contra Greta, segundo o enredo).")
pc("bernd", "helge", kind="adoptive", worlds="jm", cert="high", ev="series+wiki", note="Bernd cria Helge como filho; não é o pai biológico.")
pc("bernd", "helge", kind="unknown_nature", worlds="o", cert="medium", ev=WIKI,
   note="O Dark Wiki chama Helge de 'meio-irmão por afinidade' (step-brother) de Regina; a natureza exata do vínculo com Bernd não é mostrada.")
pc("helge", "peter", cert="high", ev="series+wiki"); pc("ulla", "peter", cert="high", ev="series+wiki")
pc("peter", "franziska", worlds="jm"); pc("charlotte_d", "franziska", worlds="jm")
pc("peter", "elisabeth", worlds="jm"); pc("charlotte_d", "elisabeth", worlds="jm", note="Elisabeth também é a MÃE de Charlotte (ver paradoxos).")
pc("hanno", "charlotte_d", worlds="jm", note="Charlotte nasce em 2041 de Noah (Hanno) e Elisabeth; é levada ao passado por suas versões idosas.")
pc("elisabeth", "charlotte_d", worlds="jm", note="Fecha o ciclo genealógico Charlotte → Elisabeth → Charlotte.")
pc("regina", "bartosz", worlds="jm"); pc("aleksander", "bartosz", worlds="jm")
pc("hannah", "silja", worlds="jm", note="Silja é fruto da relação de Hannah com Egon (1986-88); Hannah era adolescente.")
pc("egon", "silja", worlds="jm")
pc("bartosz", "hanno", worlds="jm"); pc("silja", "hanno", worlds="jm")
pc("bartosz", "agnes", worlds="jm"); pc("silja", "agnes", worlds="jm")
sp("egon", "doris", worlds="j", status="divorced", cert="high", ev="series+wiki", note="Divorciam-se (influência do Unknown).")
sp("egon", "doris", worlds="m", status="married", cert="medium", ev=WIKI)
sp("egon", "doris", worlds="o", status="married", cert="medium", ev=WIKI, note="Casamento implícito; ambos listados no Mundo de Origem.")
sp("bernd", "greta", worlds="jm", cert="confirmed")
sp("bernd", "claudia", worlds="o", cert="high", ev="series+wiki", note="Claudia é a segunda esposa de Bernd e mãe de Regina.")
pt("bernd", "claudia", "jm", "affair", cert="confirmed")
sp("aleksander", "regina", worlds="jm"); sp("bartosz", "silja", worlds="jm"); sp("hanno", "elisabeth", worlds="jm", cert="high", ev="series+wiki")
sp("peter", "charlotte_d", worlds="jm")
pt("helge", "ulla", "ojm", "lover_uncertain", cert="low", ev=WIKI, note="O Wiki lista Ulla como 'possível esposa/amante' de Helge; é o vínculo pelo qual Peter nasce.")
pt("hannah", "egon", "jm", "affair", cert="confirmed")
pt("tronte", "claudia", "jm", "affair", cert="confirmed")
pt("doris", "agnes", "j", "lover", cert="high", ev="series+wiki")
pt("magnus", "franziska", "jm", "romantic", cert="confirmed")
sib("helge", "regina", "ojm", "step", cert="high", ev="series+wiki", note="Meio-irmãos por afinidade (Bernd é pai de Regina e pai adotivo de Helge; no Mundo de Origem, step-brother segundo o Wiki).")
# ---- Nielsen
pc("tronte", "ulrich", worlds="jm"); pc("jana", "ulrich", worlds="jm"); pc("tronte", "mads", worlds="jm"); pc("jana", "mads", worlds="jm")
pc("agnes", "tronte", worlds="jm")
pc("ulrich", "magnus", worlds="jm"); pc("katharina", "magnus", worlds="jm")
pc("ulrich", "martha", worlds="jm"); pc("katharina", "martha", worlds="jm")
pc("ulrich", "mikkel", worlds="jm"); pc("katharina", "mikkel", worlds="jm")
sp("jana", "tronte", worlds="jm")
sp("ulrich", "katharina", worlds="j", status="married"); sp("ulrich", "katharina", worlds="m", status="divorced", cert="high", ev=WIKI)
sp("ulrich", "hannah", worlds="m", status="married", cert="high", ev="series+wiki", note="Hannah Nielsen é a segunda esposa de Ulrich.")
pt("ulrich", "hannah", "j", "affair", cert="confirmed")
pt("martha", "bartosz", "j", "romantic", cert="confirmed")
# ---- Kahnwald / Krüger / Albers / Wöller
pc("sebastian", "hannah", cert="high", ev="series+wiki", note="A mãe de Hannah não é identificada.")
pc("helene", "katharina", cert="high", ev="series+wiki"); pc("hermann", "katharina", cert="high", ev="series+wiki")
sp("helene", "hermann", status="implied_couple", cert="low", ev=WIKI, note="O Wiki marca a esposa de Hermann como 'supposed' (suposta).")
pc("mikkel", "jonas", worlds="j", note="Michael Kahnwald é o pai biológico de Jonas.")
pc("hannah", "jonas", worlds="j")
sp("mikkel", "hannah", worlds="j", cert="confirmed", note="Michael (Mikkel adulto) casa com Hannah Krüger.")
pc("ines", "mikkel", kind="adoptive", worlds="j", cert="confirmed", note="Ines adota Mikkel em 1986 e o renomeia Michael Kahnwald.")
pc("daniel", "ines", worlds="j", cert="high", ev="series+wiki")
pc("hannah", "jonas_woller", worlds="o", cert="medium", ev=WIKI, note="Hannah está grávida no jantar final; o Wiki dá o nome 'Jonas Wöller' ao bebê.")
pc("torben", "jonas_woller", worlds="o", cert="medium", ev=WIKI)
sp("hannah", "torben", worlds="o", cert="confirmed")
pt("bernadette", "peter", "o", "romantic", cert="confirmed", note="Casal no jantar final do Mundo de Origem.")
pt("bernadette", "peter", "j", "ex_lover", cert="high", ev="series+wiki")
sib("torben", "bernadette", "oj", "unspecified_parents", cert="high", ev="series+wiki", note="Irmãos; os pais não são mostrados.")
pc("hannah", "unborn_m", worlds="m", cert="high", ev="series+wiki", note="Hannah Nielsen está grávida de Ulrich em 2019.")
pc("ulrich", "unborn_m", worlds="m", cert="high", ev="series+wiki")

# ---- Vínculos entre mundos (o Unknown é um único indivíduo que liga os dois mundos)
pc_ids("j_jonas", "cw_unknown", cert="high", ev="series+wiki",
       note="Pai biológico: Jonas do Mundo de Jonas. Concepção em 06/11/2019, no quarto de Martha, no Mundo de Martha.")
pc_ids("m_martha", "cw_unknown", cert="high", ev="series+wiki",
       note="Mãe biológica: Martha do Mundo de Martha (a versão idosa dela é Eva). Ele 'nasce de dois mundos'.")
pc_ids("cw_unknown", "j_tronte", cert="confirmed", ev="series",
       note="Visto em 1954 (Mundo de Jonas): o Unknown adulto entrega a Tronte o bracelete de ouroboros e diz ter lhe dado o nome.")
pc_ids("cw_unknown", "m_tronte", cert="medium", ev=WIKI,
       note="O Dark Wiki lista o Unknown como pai do Tronte também no Mundo de Martha (as páginas de Katharina/Eva's World o citam como bisneto/neto). Não verificado cena a cena.")
for w in "jm":
    rels.append(dict(id=_id("rel_sp", "cw_unknown", f"{w}_agnes"), type="spouse", status="married_or_partner", memberIds=["cw_unknown", f"{w}_agnes"],
                     worldId=WORLD[w], certainty="high" if w == "j" else "medium", evidence="series+wiki", derived=False,
                     note="Agnes e o Unknown geram Tronte. O Wiki o lista como marido de Agnes; a formalização do casamento não é detalhada."))
rels.append(dict(id="rel_pt_j_jonas_j_martha", type="partner", kind="romantic", memberIds=["j_jonas", "j_martha"], worldId="jonas_world",
                 certainty="confirmed", evidence="series", derived=False, note="Relação de Jonas com a Martha do Mundo de Jonas (que é sua tia biológica)."))
rels.append(dict(id="rel_pt_j_jonas_m_martha", type="partner", kind="romantic", memberIds=["j_jonas", "m_martha"], worldId="cross_world",
                 certainty="confirmed", evidence="series", derived=False,
                 note="Novembro de 2019, Mundo de Martha. Dessa relação nasce o Unknown. Martha(m) é a contraparte genética da tia de Jonas."))

# ---- Irmãos derivados (só por pais BIOLÓGICOS declarados)
bio_parents = defaultdict(set)
for r in rels:
    if r["type"] == "parent_child" and r["kind"] == "biological":
        bio_parents[r["childId"]].add(r["parentId"])
have_sib = {frozenset(r["memberIds"]) for r in rels if r["type"] == "sibling"}
for a, b in itertools.combinations(sorted(bio_parents), 2):
    common = bio_parents[a] & bio_parents[b]
    if not common or frozenset((a, b)) in have_sib:
        continue
    if bio_parents[a] == bio_parents[b] and len(bio_parents[a]) == 2:
        kind = "full"
    elif len(bio_parents[a]) == 2 and len(bio_parents[b]) == 2:
        kind = "half"
    else:
        kind = "unspecified"
    rels.append(dict(id=_id("rel_sb", a, b), type="sibling", kind=kind, memberIds=[a, b], worldId=_world_of(a, b),
                     certainty="high", evidence="derived_from_parent_child", derived=True,
                     note="Derivado dos pais biológicos em comum: " + ", ".join(sorted(common))))

# ---- Parentescos derivados notáveis (não são arestas de pai/filho; servem para visualização)
rels += [
    dict(id="kin_j_martha_j_jonas", type="derived_kinship", kind="aunt_nephew", memberIds=["j_martha", "j_jonas"], worldId="jonas_world",
         certainty="confirmed", evidence="series", derived=True,
         note="Martha é irmã de Mikkel/Michael, pai de Jonas: tia biológica de Jonas e, ao mesmo tempo, seu interesse amoroso."),
    dict(id="kin_cw_unknown_j_agnes", type="derived_kinship", kind="half_first_cousins", memberIds=["cw_unknown", "j_agnes"], worldId="jonas_world",
         certainty="high", evidence="derived_from_parent_child", derived=True,
         note="Agnes é filha de Silja, meia-irmã de Jonas (mãe Hannah em comum); o Unknown é filho de Jonas: meio-primos que geram Tronte."),
    dict(id="kin_j_hannah_j_mikkel", type="derived_kinship", kind="ancestor_and_spouse", memberIds=["j_hannah", "j_mikkel"], worldId="jonas_world",
         certainty="high", evidence="derived_from_parent_child", derived=True,
         note="Hannah → Silja → Agnes → Tronte → Ulrich → Mikkel: o marido de Hannah (Michael) é seu descendente 5 gerações abaixo (o Wiki o lista como 'great-great-great-grandson')."),
]

# --------------------------------------------------------------------------- paradoxos
def chain_ids(path):
    return path

paradoxes = [
    dict(id="px_gen_unknown_jonas_world", name="Ciclo da Origem — Mundo de Jonas", types=["genealogical_bootstrap"],
         worldIds=["jonas_world", "martha_world"], certainty="high", evidence="series+wiki",
         summary="Jonas é pai do Unknown, que é pai de Tronte, avô de Mikkel/Michael, que é pai de Jonas. Ninguém na cadeia tem uma origem fora do ciclo.",
         cyclePath=["j_jonas", "cw_unknown", "j_tronte", "j_ulrich", "j_mikkel", "j_jonas"],
         mechanism=[
             "6/11/2019: Jonas (Mundo de Jonas) e Martha (Mundo de Martha) concebem o Unknown.",
             "O Unknown, já adulto, tem Tronte com Agnes (cena de 1954).",
             "Tronte e Jana têm Ulrich; Ulrich e Katharina têm Mikkel.",
             "Mikkel é levado a 1986, vira Michael Kahnwald (adotado por Ines) e tem Jonas com Hannah Krüger.",
             "Jonas existe para voltar ao passo 1: cada geração só existe por causa da seguinte."],
         participants=[
             ("j_jonas", "cycle_member", True, "Pai do Unknown; seu pai (Michael) é seu descendente."),
             ("cw_unknown", "cycle_member", True, "A própria 'Origem': filho de Jonas e Martha e ancestral de ambos."),
             ("j_tronte", "cycle_member", True, "Filho do Unknown com Agnes; avô de Mikkel."),
             ("j_ulrich", "cycle_member", True, "Filho de Tronte; pai de Mikkel."),
             ("j_mikkel", "cycle_member", True, "Vira Michael Kahnwald e pai de Jonas: fecha o ciclo."),
             ("j_mads", "dependent_off_cycle", True, "Irmão de Ulrich: existe porque Tronte existe, mas não está no caminho do ciclo."),
             ("j_magnus", "dependent_off_cycle", True, "Irmão de Mikkel; depende de Ulrich/Tronte."),
             ("j_martha", "dependent_off_cycle", True, "Irmã de Mikkel; depende de Ulrich/Tronte."),
             ("j_agnes", "supporting_relation", False, "Mãe de Tronte; seus pais (Bartosz e Silja) são independentes do ciclo. É meio-prima do Unknown."),
             ("j_hannah", "supporting_relation", False, "Mãe de Jonas e avó do Unknown; também é ancestral de Tronte (via Silja e Agnes) e esposa de seu próprio descendente (Michael)."),
             ("j_silja", "supporting_relation", False, "Meia-irmã de Jonas e mãe de Agnes: liga a linhagem Tiedemann ao ciclo."),
             ("j_ines", "supporting_relation", False, "Adota Mikkel em 1986, permitindo que ele se torne Michael."),
             ("m_martha", "supporting_relation", False, "Mãe do Unknown (Mundo de Martha); fecha o outro ciclo (px_gen_unknown_martha_world)."),
         ],
         supportingKinshipIds=["kin_cw_unknown_j_agnes", "kin_j_hannah_j_mikkel", "kin_j_martha_j_jonas"],
         brokenByResolution=dict(value=True, how="Jonas e Martha impedem o acidente de 8/11/1971 no Mundo de Origem; a máquina nunca é construída, o Nó nunca se forma e o Unknown e todos os seus descendentes são apagados.")),
    dict(id="px_gen_unknown_martha_world", name="Ciclo da Origem — Mundo de Martha", types=["genealogical_bootstrap"],
         worldIds=["martha_world"], certainty="medium", evidence="dark_wiki+series",
         summary="Martha (Mundo de Martha) é mãe do Unknown, que é pai de Tronte, avô de Ulrich... que é pai de Martha. O Unknown é o nó comum aos dois mundos.",
         cyclePath=["m_martha", "cw_unknown", "m_tronte", "m_ulrich", "m_martha"],
         mechanism=[
             "Martha (versão adolescente) concebe o Unknown com Jonas em 2019.",
             "O Unknown é o pai de Tronte (também no Mundo de Martha, segundo o Wiki).",
             "Tronte → Ulrich → Martha: Martha descende do filho que ela mesma tem."],
         participants=[
             ("m_martha", "cycle_member", True, "Mãe e descendente (tataraneta) do Unknown; sua versão idosa é Eva."),
             ("cw_unknown", "cycle_member", True, "Nó compartilhado entre os dois ciclos."),
             ("m_tronte", "cycle_member", True, "Filho do Unknown no Mundo de Martha (certeza média)."),
             ("m_ulrich", "cycle_member", True, "Pai de Martha."),
             ("m_mikkel", "dependent_off_cycle", True, "Irmão de Martha."),
             ("m_magnus", "dependent_off_cycle", True, "Irmão de Martha."),
             ("m_mads", "dependent_off_cycle", True, "Irmão de Ulrich."),
             ("m_unborn_m", "dependent_off_cycle", True, "Filho(a) não nascido(a) de Ulrich e Hannah: depende de Ulrich."),
             ("m_agnes", "supporting_relation", False, "Mãe de Tronte; pais independentes."),
             ("m_hannah", "supporting_relation", False, "Ancestral de Tronte via Silja e Agnes; segunda esposa de Ulrich."),
         ],
         supportingKinshipIds=[],
         brokenByResolution=dict(value=True, how="Mesma resolução: com o Nó desfeito, o Mundo de Martha deixa de existir e o Unknown é apagado.")),
    dict(id="px_gen_doppler_jonas_world", name="Charlotte é sua própria avó — Mundo de Jonas", types=["genealogical_bootstrap"],
         worldIds=["jonas_world"], certainty="high", evidence="series+wiki",
         summary="Charlotte Doppler é mãe de Elisabeth e, ao mesmo tempo, filha dela: Elisabeth dá à luz Charlotte em 2041 e as versões idosas as levam a 1971.",
         cyclePath=["j_charlotte_d", "j_elisabeth", "j_charlotte_d"],
         mechanism=[
             "Charlotte (criada desde 1971) casa com Peter e tem Franziska (2003) e Elisabeth (2011).",
             "Elisabeth, adulta, tem Charlotte com Noah (Hanno) em 2041, no pós-apocalipse.",
             "As versões idosas de Charlotte e Elisabeth levam o bebê a 1971 e o entregam a H. G. Tannhaus, que a cria.",
             "A bebê cresce e é Charlotte do passo 1."],
         participants=[
             ("j_charlotte_d", "cycle_member", True, "Filha e mãe de Elisabeth; 'avó de si mesma'."),
             ("j_elisabeth", "cycle_member", True, "Filha e mãe de Charlotte."),
             ("j_franziska", "dependent_off_cycle", True, "Filha de Charlotte; depende dela."),
             ("j_peter", "supporting_relation", False, "Marido de Charlotte e avô/pai de Elisabeth; origem independente do ciclo."),
             ("j_hanno", "supporting_relation", False, "Pai de Charlotte e marido de Elisabeth; seus pais (Bartosz e Silja) são independentes do ciclo."),
             ("j_hg", "supporting_relation", False, "Avô adotivo que cria o bebê em 1971 (não é parente biológico)."),
         ],
         supportingKinshipIds=[],
         brokenByResolution=dict(value=True, how="Sem o Nó, a Charlotte do Mundo de Jonas deixa de existir; no Mundo de Origem a única Charlotte é Charlotte Tannhaus, salva em 1971.")),
    dict(id="px_gen_doppler_martha_world", name="Charlotte é sua própria avó — Mundo de Martha", types=["genealogical_bootstrap"],
         worldIds=["martha_world"], certainty="medium", evidence="dark_wiki",
         summary="Estrutura equivalente à do Mundo de Jonas, conforme o Dark Wiki (Charlotte/Eva's World lista 'Herself' como avó).",
         cyclePath=["m_charlotte_d", "m_elisabeth", "m_charlotte_d"],
         mechanism=["Mesma mecânica do ciclo Doppler do Mundo de Jonas, replicada no Mundo de Martha."],
         participants=[
             ("m_charlotte_d", "cycle_member", True, "Filha e mãe de Elisabeth."),
             ("m_elisabeth", "cycle_member", True, "Filha e mãe de Charlotte."),
             ("m_franziska", "dependent_off_cycle", True, "Filha de Charlotte (morre neste mundo)."),
             ("m_peter", "supporting_relation", False, "Marido de Charlotte."),
             ("m_hanno", "supporting_relation", False, "Pai de Charlotte (Noah)."),
             ("m_hg", "supporting_relation", False, "Avô adotivo de Charlotte."),
         ],
         supportingKinshipIds=[],
         brokenByResolution=dict(value=True, how="O Mundo de Martha deixa de existir com o Nó.")),
    dict(id="px_info_time_machine_blueprints", name="As plantas da máquina do tempo portátil", types=["information_object_bootstrap"],
         worldIds=["jonas_world", "martha_world"], certainty="medium", evidence="dark_wiki+series",
         summary="As plantas que permitem construir a máquina de H. G. Tannhaus são roubadas do Sic Mundus, passam por Eva e Claudia e voltam a H. G., sem um autor original identificável.",
         cyclePath=None,
         transferChain=[
             dict(step=1, year=1987, fromId="cw_unknown", toId="m_martha", object="plantas da máquina portátil", note="O Unknown (em suas três idades) rouba as plantas do QG do Sic Mundus (Mundo de Jonas) e as devolve à mãe, Eva."),
             dict(step=2, year=2040, fromId="m_martha", toId="j_claudia", object="plantas da máquina portátil", note="Eva entrega a Claudia as plantas para que sejam levadas a H. G. 'para garantir que tudo aconteça de novo'."),
             dict(step=3, year=1953, fromId="j_claudia", toId="j_hg", object="plantas da máquina portátil", note="Claudia idosa viaja a 1953 e entrega as plantas ao relojoeiro."),
             dict(step=4, year=1986, fromId="j_hg", toId="cw_unknown", object="máquina construída a partir das plantas", note="H. G. conclui a máquina em 1986; o Sic Mundus a refina e mantém as plantas no QG, de onde o passo 1 as rouba."),
         ],
         mechanism=["Roubo (1987) → Eva → Claudia (2040) → H. G. (1953) → máquina (1986) → plantas no QG do Sic Mundus → roubo (1987)."],
         participants=[
             ("cw_unknown", "object_carrier", False, "Rouba e entrega as plantas a Eva."),
             ("m_martha", "object_carrier", False, "Como Eva, recebe as plantas e as repassa a Claudia."),
             ("j_claudia", "object_carrier", False, "Leva as plantas a 1953; no relato do Wiki, assumiu a identidade da Claudia do Mundo de Martha."),
             ("j_hg", "object_carrier", False, "Recebe as plantas e constrói a máquina sem saber quem as desenhou."),
         ],
         supportingKinshipIds=[],
         brokenByResolution=dict(value=True, how="No Mundo de Origem H. G. constrói a máquina sozinho (para salvar a família); com o acidente evitado, a máquina nunca existe e o ciclo de plantas some com os dois mundos.")),
    dict(id="px_causal_origin_machine", name="A máquina que cria (e desfaz) os mundos", types=["temporal_causal_loop"],
         worldIds=["origin_world", "jonas_world", "martha_world"], certainty="high", evidence="series+wiki",
         summary="A morte da família Tannhaus leva H. G. a construir a máquina; a máquina divide o mundo; de dentro dos mundos divididos Jonas e Martha voltam a 1971 e evitam a morte que motivou a máquina.",
         cyclePath=None,
         mechanism=[
             "8/11/1971 (Origem): Marek, Sonja e Charlotte morrem num acidente.",
             "1974–1986: H. G. constrói a máquina; em 21/6/1986 ela cria o Mundo de Jonas e o Mundo de Martha.",
             "Claudia (Mundo de Jonas) descobre a Origem e o emaranhamento quântico durante o Apocalipse.",
             "Adam leva o Jonas jovem a Martha; os dois viajam a 8/11/1971 e convencem Marek e Sonja a voltar (ponte fechada).",
             "Sem acidente, não há máquina e não há mundos divididos."],
         participants=[
             ("o_hg", "causal_agent", False, "Constrói a máquina por causa da perda da família."),
             ("o_marek", "causal_motive", False, "Sua morte (e a de Sonja e Charlotte) motiva a máquina; é salvo em 1971."),
             ("o_sonja", "causal_motive", False, "Idem."),
             ("o_charlotte_t", "causal_motive", False, "Idem."),
             ("j_jonas", "causal_agent", True, "Viaja ao Mundo de Origem e impede o acidente; existe só por causa do Nó que ajuda a desfazer."),
             ("m_martha", "causal_agent", True, "Idem."),
             ("j_claudia", "causal_agent", True, "Revela a Origem a Adam."),
         ],
         supportingKinshipIds=[],
         brokenByResolution=dict(value=True, how="O ciclo se desfaz por 'auto-eliminação': evitar o acidente remove a causa da máquina.")),
    dict(id="px_causal_michael_jonas", name="Michael, Mikkel e a jornada de Jonas", types=["temporal_causal_loop"],
         worldIds=["jonas_world"], certainty="high", evidence="series+wiki",
         summary="A ida de Mikkel a 1986 produz Michael, cuja morte inicia a jornada de Jonas, que por sua vez leva Mikkel ao passado.",
         cyclePath=None,
         mechanism=[
             "Mikkel desaparece em 2019 ao ser levado à passagem da caverna por uma versão viajante de Jonas.",
             "Em 1986 vira Michael Kahnwald, casa com Hannah e tem Jonas.",
             "Michael se mata após encontrar um Jonas vindo do futuro; esse Jonas torna-se o catalisador da tragédia.",
             "A busca de Jonas pelo passado do pai conduz a todos os eventos que levam Mikkel a 1986."],
         participants=[
             ("j_jonas", "causal_agent", True, "Agente e consequência dos eventos."),
             ("j_mikkel", "causal_agent", True, "Mikkel/Michael: levado ao passado e pai de Jonas."),
             ("j_ines", "supporting_relation", False, "Adota Mikkel."),
         ],
         supportingKinshipIds=[],
         brokenByResolution=dict(value=True, how="Com o Mundo de Jonas apagado, nem Mikkel nem Michael existem no Mundo de Origem.")),
    dict(id="px_causal_adam_jonas", name="Jonas se torna Adam e envia a si mesmo", types=["temporal_causal_loop"],
         worldIds=["jonas_world"], certainty="medium", evidence="dark_wiki",
         summary="Adam (Jonas mais velho) orienta o Jonas jovem pelos mesmos eventos que o transformarão em Adam.",
         cyclePath=None,
         mechanism=["Adam envia sua versão jovem a 2019 'porque ele já havia vivido esses eventos'.",
                    "Os eventos vividos pelo Jonas jovem são os que o moldam como Adam."],
         participants=[("j_jonas", "causal_agent", False, "Identidades: Jonas, O Estranho, Adam.")],
         supportingKinshipIds=[],
         brokenByResolution=dict(value=True, how="Adam salva o Jonas jovem para atravessar ao Mundo de Martha e, com Martha, desfazer o Nó.")),
]

# --------------------------------------------------------------------------- identidades
identities = [
    dict(id="idn_jonas_stranger_adam", characterId="j_jonas", kind="alias_chain", certainty="high", evidence="series+wiki",
         names=[dict(label="Jonas Kahnwald", context="nome de nascimento; adolescente em 2019"),
                dict(label="O Estranho (Der Fremde)", context="versão adulta que aparece em Winden em 2019/2020"),
                dict(label="Adam", context="líder do Sic Mundus; versão idosa e marcada por cicatrizes")],
         note="O Wiki mantém páginas separadas para 'Adam', 'Jonas/Quantum Entanglement' e 'Jonas/Third Reality'. Aqui são tratados como o MESMO indivíduo genealógico (mesmos pais) em momentos/ramos diferentes; a divisão exata entre ramos é ambígua."),
    dict(id="idn_mikkel_michael", characterId="j_mikkel", kind="alias_chain", certainty="confirmed", evidence="series",
         names=[dict(label="Mikkel Nielsen", context="nome de nascimento (2008)"),
                dict(label="Michael Kahnwald", context="nome legal após a adoção por Ines Kahnwald (1986)")]),
    dict(id="idn_martha_eva", characterId="m_martha", kind="alias_chain", certainty="confirmed", evidence="series",
         names=[dict(label="Martha Nielsen", context="adolescente, Mundo de Martha"),
                dict(label="Eva", context="versão idosa; líder do Erit Lux")]),
    dict(id="idn_hanno_noah_j", characterId="j_hanno", kind="alias_chain", certainty="high", evidence="series+wiki",
         names=[dict(label="Hanno Tauber", context="nome de nascimento"), dict(label="Noah", context="nome com que atua no Sic Mundus")]),
    dict(id="idn_hanno_noah_m", characterId="m_hanno", kind="alias_chain", certainty="medium", evidence=WIKI,
         names=[dict(label="Hanno Tauber", context="nome de nascimento"), dict(label="Noah", context="Noah/Eva's World")]),
    dict(id="idn_aleksander_j", characterId="j_aleksander", kind="alias_chain", certainty="medium", evidence="series+wiki",
         names=[dict(label="Boris Niewald", context="nome de nascimento, segundo o Wiki/guia"),
                dict(label="Aleksander Köhler", context="identidade usada antes do casamento"),
                dict(label="Aleksander Tiedemann", context="nome após casar com Regina")],
         note="A ordem exata das identidades é confirmada apenas parcialmente; no Mundo de Origem 'Boris Niewald' existe mas não se casa com Regina."),
    dict(id="idn_aleksander_m", characterId="m_aleksander", kind="alias_chain", certainty="medium", evidence=WIKI,
         names=[dict(label="Boris Niewald", context="nome de nascimento"), dict(label="Aleksander Tiedemann", context="nome de casado")]),
    dict(id="idn_claudia_assumed", characterId="j_claudia", kind="assumed_identity", certainty="medium", evidence=WIKI, crossWorldTargetId="m_claudia",
         names=[dict(label="Claudia Tiedemann (Mundo de Jonas)", context="identidade própria"),
                dict(label="Claudia Tiedemann (Mundo de Martha)", context="em 2040 a Claudia do Mundo de Jonas mata sua contraparte e assume sua identidade, segundo o Wiki")],
         note="Identidade assumida NÃO implica parentesco ou duplicação: são duas pessoas (dois nós)."),
    dict(id="idn_unknown_versions", characterId="cw_unknown", kind="simultaneous_versions", certainty="confirmed", evidence="series",
         names=[dict(label="O Desconhecido"), dict(label="A Origem (Origin)")],
         note="Aparece sempre em três versões simultâneas (criança, adulto e idoso); são o mesmo indivíduo."),
    dict(id="idn_hannah_names", characterId="j_hannah", kind="married_name_by_world", certainty="confirmed", evidence="series",
         names=[dict(label="Hannah Krüger", context="nome de solteira (todos os mundos)"), dict(label="Hannah Kahnwald", context="Mundo de Jonas"),
                dict(label="Hannah Nielsen", context="Mundo de Martha (counterpart m_hannah)"), dict(label="Hannah Wöller", context="Mundo de Origem (counterpart o_hannah)")]),
    dict(id="idn_regina_claudia_o", characterId="o_regina", kind="married_name_by_world", certainty="high", evidence="series+wiki",
         names=[dict(label="Regina Doppler", context="Mundo de Origem; filha de Claudia e Bernd")]),
]

# --------------------------------------------------------------------------- versões temporais (mesmo indivíduo, idades diferentes)
def tv(label, years=None, age=None, note=None, cert="medium"):
    return dict(label=label, years=years, ageApprox=age, note=note, certainty=cert)

TV = {
    "j_jonas": [tv("Jonas adolescente", "2019", "16"), tv("Jonas jovem viajante", "2019–2020", "16–17", "Viaja a 1986, 2052, 1921 e ao Mundo de Martha."),
                tv("O Estranho / Adam adulto", "2019–2053", None, "Versão adulta (Der Fremde)."), tv("Adam idoso", "até 2053", None, "Líder do Sic Mundus."),
                tv("Jonas 'Terceira Realidade'", "8/11/2019 → 8/11/1971", None, "Versão que, com Martha, impede o acidente no Mundo de Origem.", "low")],
    "j_mikkel": [tv("Mikkel criança", "2019", "11"), tv("Michael criança/adolescente", "1986–", None, "Vive com Ines."), tv("Michael adulto", "2019", None, "Pai de Jonas; morre por suicídio.")],
    "m_martha": [tv("Martha adolescente", "2019", "16"), tv("Martha adulta (conselheira)", "2052", None, "Aparece a Jonas e Martha no deserto de 2052.", "medium"), tv("Eva", "idosa", None, "Líder do Erit Lux.")],
    "j_ulrich": [tv("Ulrich jovem", "1986", None), tv("Ulrich adulto", "2019", "48"), tv("Ulrich idoso", "1987 (visto)", "~82", "Versão vinda do futuro.")],
    "j_claudia": [tv("Claudia jovem", "1986", "44"), tv("Claudia idosa", "2019–2053", None, "Viaja a 1953 e a 2040.")],
    "j_helge": [tv("Helge criança", "1953", "9"), tv("Helge adulto", "1986", "42"), tv("Helge idoso", "2019", "75")],
    "j_charlotte_d": [tv("Bebê", "2041 → 1971"), tv("Charlotte adolescente", "1986–87"), tv("Charlotte adulta", "2019", None, "Chefe de polícia."), tv("Charlotte idosa", "2041", None, "Leva a bebê a 1971.")],
    "j_elisabeth": [tv("Elisabeth criança", "2019", "8"), tv("Elisabeth adulta", "2041", None, "Dá à luz Charlotte."), tv("Elisabeth idosa", "1971 (visita)", None, "Leva a bebê Charlotte a H. G.")],
    "j_hanno": [tv("Noah jovem", None, None, "Datas inconsistentes entre Wiki e série (nasc. 1904; morte em 1921).", "low"), tv("Noah adulto", None, None, None, "low")],
    "cw_unknown": [tv("Unknown criança", None, None, None, "confirmed"), tv("Unknown adulto", None, None, "Jakob Diehl", "confirmed"), tv("Unknown idoso", None, None, "Hans Diehl", "confirmed")],
    "j_hg": [tv("H. G. adulto", "1953–1974", None), tv("H. G. idoso", "1986–87", None, "Cabelos brancos.")],
    "j_hannah": [tv("Hannah adolescente", "1986", "14"), tv("Hannah adulta", "2019", "47")],
    "j_katharina": [tv("Katharina jovem", "1986–87", None), tv("Katharina adulta", "2019", "49")],
    "j_tronte": [tv("Tronte adulto", "1986", "45"), tv("Tronte idoso", "2019", "78")],
}

# --------------------------------------------------------------------------- viagem no tempo (None = não estabelecido nas fontes consultadas)
def tt(is_t, role=None, notes=None, cert="medium"):
    return dict(isTimeTraveler=is_t, role=role, notes=notes, certainty=cert)

TT = {
    "j_jonas": tt(True, "traveler", "1986, 1921, 2052, 1888 (via Sic Mundus), Mundo de Martha e Mundo de Origem (1971).", "confirmed"),
    "j_mikkel": tt(True, "traveler", "Levado a 1986 em 2019; permanece lá e vira Michael.", "confirmed"),
    "m_martha": tt(True, "traveler", "Viaja ao Mundo de Jonas, a 2052 e ao Mundo de Origem (1971).", "confirmed"),
    "j_martha": tt(False, "none", "Não é mostrada viajando; é morta no Apocalipse.", "medium"),
    "j_ulrich": tt(True, "traveler", "1953, 1986 e 1987.", "confirmed"),
    "j_claudia": tt(True, "traveler", "1953, 1986, 2040 e 2053; também entre mundos.", "high"),
    "j_helge": tt(True, "traveler", "1953 e 1986.", "confirmed"),
    "j_hanno": tt(True, "traveler", "Sic Mundus; atua em várias épocas.", "high"),
    "j_elisabeth": tt(True, "traveler", "Versão idosa leva a bebê Charlotte a 1971.", "confirmed"),
    "j_charlotte_d": tt(True, "later_life_traveler", "Só a versão idosa viaja; em 2019 'não é conhecida por viajar'.", "high"),
    "j_bartosz": tt(True, "traveler", "1888/1904 e outras épocas.", "high"),
    "j_silja": tt(True, "traveler", "Guia Jonas ao passado através da Partícula de Deus.", "high"),
    "j_franziska": tt(True, "traveler", "1888 com o grupo de Adam.", "high"),
    "j_magnus": tt(True, "traveler", "1888 com o grupo de Adam.", "high"),
    "j_katharina": tt(True, "traveler", "2020 → 1987 pela passagem.", "high"),
    "cw_unknown": tt(True, "traveler", "1888, 1954, 1987 e outras épocas, sempre em três idades.", "confirmed"),
    "j_hg": tt(False, "none", "Constrói máquinas, mas não é mostrado viajando.", "medium"),
    "o_hg": tt(False, "none", "Sua máquina divide o mundo, mas ele não é mostrado viajando.", "medium"),
}

# --------------------------------------------------------------------------- dependência do nó temporal
KD = {  # slug -> (valor, motivo); None = não estabelecido
    "unknown": (True, "Apagado explicitamente quando o Nó é desfeito."),
    "jonas": (True, "Pai (Michael) só existe por causa da viagem de Mikkel a 1986."),
    "mikkel": (True, "É descendente do Unknown; o Wiki afirma que todos os descendentes de Agnes/do Unknown deixam de existir."),
    "tronte": (True, "Filho do Unknown."), "ulrich": (True, "Neto do Unknown."), "mads": (True, "Neto do Unknown."),
    "magnus": (True, "Bisneto do Unknown."), "martha": (True, "Bisneta do Unknown (e mãe dele no Mundo de Martha)."),
    "agnes": (True, "Filha de Bartosz e Silja, que só se unem por viagens no tempo; no Mundo de Origem Regina e Aleksander não se casam."),
    "bartosz": (True, "No Mundo de Origem Regina e Aleksander (Boris) não se casam, logo Bartosz não nasce."),
    "hanno": (True, "Filho de Bartosz e Silja."), "charlotte_d": (True, "Depende do ciclo Doppler e de Hanno."),
    "elisabeth": (True, "Depende do ciclo Doppler."), "franziska": (True, "Filha de Charlotte."), "unborn_m": (True, "Filho(a) de Ulrich."),
    "silja": (None, "Filha de Hannah e Egon (ambos existem na Origem), mas a relação não é mostrada lá."),
    "jana": (None, "Sem contraparte mostrada na Origem; não há ciclo que a condicione."),
    "ines": (None, "Sem contraparte mostrada na Origem."), "daniel": (None, "Sem contraparte mostrada na Origem."),
    "greta": (None, "Sem contraparte mostrada na Origem."), "anatol": (None, "Sem contraparte mostrada na Origem."),
}

def knot_dependence(slug, w):
    if w == "o":
        return dict(dependsOnKnot=False, reason="Mundo de Origem: existe sem o Nó.", certainty="high")
    if slug in KD:
        v, why = KD[slug]
        return dict(dependsOnKnot=v, reason=why, certainty="high" if v is True and slug in ("unknown", "jonas", "mikkel", "tronte", "ulrich", "martha", "agnes", "charlotte_d", "elisabeth") else "medium")
    if "o" in P[slug]["worlds"]:
        return dict(dependsOnKnot=False, reason="Possui contraparte no Mundo de Origem; a pessoa sobrevive, os vínculos específicos deste mundo não.", certainty="medium")
    return dict(dependsOnKnot=None, reason="Não estabelecido.", certainty="low")

# --------------------------------------------------------------------------- existência após a resolução
HISTORICAL = {"heinrich", "charlotte_sr", "gustav", "leopold"}
def exists_after(slug, w, cid):
    if w == "o":
        if slug in SHOWN_IN_FINAL:
            return dict(value=True, status="exists", evidence="shown_on_screen", certainty="confirmed", notes="Aparece no jantar final de 2019/2020 no Mundo de Origem.")
        if slug in SAVED_1971:
            return dict(value=True, status="exists", evidence="shown_on_screen", certainty="confirmed", notes="Salvo(a) por Jonas e Martha em 8/11/1971.")
        if slug == "jonas_woller":
            return dict(value=True, status="unborn_at_end", evidence="wiki", certainty="medium", notes="Bebê ainda não nascido no final.")
        if slug in HISTORICAL:
            return dict(value=True, status="historical_deceased", evidence="implied", certainty="high", notes="Ancestral histórico, anterior ao acidente de 1971.")
        if slug == "claudia":
            return dict(value=True, status="exists", evidence="wiki", certainty="high", notes="'Restaurada à existência' segundo o Wiki; vive com Bernd e Regina.")
        if slug == "hg":
            return dict(value=True, status="exists_in_restored_timeline", evidence="wiki", certainty="medium", notes="Nascido em 1913; estado em 2019 não é mostrado.")
        return dict(value=True, status="implied_by_family_listing", evidence="wiki", certainty="medium" if slug in ("egon", "doris", "bernd", "aleksander") else "low",
                    notes="Listado(a) como personagem/familiar do Mundo de Origem; não aparece no final.")
    if slug == "unknown":
        return dict(value=False, status="erased_explicitly", evidence="series+wiki", certainty="confirmed", survivesAs=None,
                    notes="Apagado junto com todo o Nó.")
    cp = f"o_{slug}" if "o" in P[slug]["worlds"] else None
    return dict(value=False, status="world_erased", evidence="series+wiki", certainty="confirmed" if slug in ("jonas", "martha", "mikkel", "ulrich") else "high",
                survivesAs=cp, notes="Este mundo deixa de existir." + (" A pessoa permanece como a contraparte do Mundo de Origem." if cp else " Não há contraparte mostrada no Mundo de Origem."))

# --------------------------------------------------------------------------- adjacências derivadas das relações
KIND_KEY = {"biological": "biological", "adoptive": "adoptive", "step": "step", "unknown_nature": "unknownNature"}
parents = defaultdict(lambda: defaultdict(list))
children = defaultdict(lambda: defaultdict(list))
partners = defaultdict(list)
siblings = defaultdict(lambda: defaultdict(list))
for r in rels:
    if r["type"] == "parent_child":
        k = KIND_KEY[r["kind"]]
        parents[r["childId"]][k].append(r["parentId"])
        children[r["parentId"]][k].append(r["childId"])
    elif r["type"] in ("spouse", "partner"):
        a, b = r["memberIds"]
        for x, y in ((a, b), (b, a)):
            partners[x].append(dict(personId=y, relationshipId=r["id"], type=r["type"], kind=r.get("kind"), status=r.get("status"), certainty=r["certainty"]))
    elif r["type"] == "sibling":
        a, b = r["memberIds"]
        k = {"full": "full", "half": "half", "step": "step"}.get(r["kind"], "unspecified")
        siblings[a][k].append(b); siblings[b][k].append(a)

# --------------------------------------------------------------------------- paradoxos -> estruturas finais
for px in paradoxes:
    px["participants"] = [dict(characterId=c, role=role, isExistenceDependent=dep, explanation=expl) for c, role, dep, expl in px["participants"]]
    path = px.get("cyclePath")
    px["relationshipIds"] = []
    if path:
        for a, b in zip(path, path[1:]):
            for r in rels:
                if r["type"] == "parent_child" and r["parentId"] == a and r["childId"] == b and r["kind"] == "biological":
                    r.setdefault("paradoxIds", []).append(px["id"])
                    px["relationshipIds"].append(r["id"])
    px["classification"] = {"genealogical_bootstrap": "Paradoxo de bootstrap genealógico: a existência depende de uma cadeia de ancestralidade circular.",
                            "information_object_bootstrap": "Paradoxo de bootstrap de informação/objeto: algo circula sem origem causal identificável.",
                            "temporal_causal_loop": "Ciclo causal temporal: eventos se causam mutuamente, sem exigir ancestralidade circular."}[px["types"][0]]

by_char = defaultdict(list)
for px in paradoxes:
    for pa in px["participants"]:
        by_char[pa["characterId"]].append((px, pa))

def bootstrap_block(cid):
    items = by_char.get(cid, [])
    if not items:
        return dict(isInvolved=False, isExistenceDependent=False, types=[], paradoxIds=[], roles=[], explanation=None, brokenByResolution=None)
    types = sorted({t for px, _ in items for t in px["types"]})
    dep = any(pa["isExistenceDependent"] for _, pa in items)
    return dict(isInvolved=True, isExistenceDependent=dep, types=types, paradoxIds=[px["id"] for px, _ in items],
                roles=[dict(paradoxId=px["id"], role=pa["role"], isExistenceDependent=pa["isExistenceDependent"]) for px, pa in items],
                explanation=" | ".join(f"[{px['id']}] {pa['explanation']}" for px, pa in items),
                brokenByResolution=all(px["brokenByResolution"]["value"] for px, _ in items))

# --------------------------------------------------------------------------- grupos de contrapartes (versões equivalentes entre mundos)
groups = {}
for slug in P:
    ids = {n["worldId"]: n["id"] for n in nodes.values() if n["slug"] == slug}
    if slug != "unknown" and len(ids) > 1:
        groups[slug] = dict(id=f"cg_{slug}", slug=slug, name=P[slug]["name"], relation="equivalent_versions", members=ids,
                            note="Versões equivalentes em mundos distintos; NÃO são o mesmo indivíduo nascido em vários mundos.")

APPEARS = {"j_jonas": ["jonas_world", "martha_world", "origin_world"], "m_martha": ["martha_world", "jonas_world", "origin_world"],
           "cw_unknown": ["martha_world", "jonas_world"], "j_claudia": ["jonas_world", "martha_world"]}
NOTES = {
    "cw_unknown": "Indivíduo único que liga os dois mundos: concebido no Mundo de Martha, pai de Tronte no Mundo de Jonas (certo) e no Mundo de Martha (Wiki). worldId aponta o mundo de concepção.",
    "j_jonas": "Nasce no Mundo de Jonas. Viajar ao Mundo de Martha ou de Origem não cria cópias dele; o Unknown é filho dele com a Martha do Mundo de Martha.",
    "m_martha": "Nasce no Mundo de Martha; é mãe do Unknown. Sua versão idosa é Eva.",
    "j_mikkel": "Mikkel Nielsen/Michael Kahnwald: mesma pessoa em duas identidades; pai biológico de Jonas.",
    "m_mikkel": "No Mundo de Martha, Mikkel não vira Michael nem tem filhos.",
    "j_hannah": "Mãe de Jonas e Silja; esposa de Michael, que é seu descendente de 5ª geração.",
    "m_hannah": "Hannah Nielsen: segunda esposa de Ulrich e mãe de Silja; Jonas não existe neste mundo.",
    "o_hannah": "Hannah Wöller (née Krüger): grávida; sonha com os mundos que desaparecem e olha uma capa amarela como a de Jonas.",
    "o_charlotte_t": "Bebê salva em 1971. No Mundo de Origem não existe Charlotte Doppler.",
    "j_charlotte_d": "Criada por H. G. Tannhaus desde 1971 (avô adotivo); NÃO é Tannhaus biológica.",
}

# --------------------------------------------------------------------------- montagem dos personagens
ORDER_W = {"o": 0, "j": 1, "m": 2, "x": 3}
pidx = {s: i for i, s in enumerate(P)}
characters = []
for n in sorted(nodes.values(), key=lambda n: (ORDER_W[n["w"]], pidx[n["slug"]])):
    cid, slug, w, p = n["id"], n["slug"], n["w"], n["p"]
    ids_for_char = [i["id"] for i in identities if i["characterId"] == cid]
    famlist = p["fam"]
    char = dict(
        id=cid, name=n["name"], canonicalSlug=slug, gender={"M": "male", "F": "female", None: "unknown"}[p["g"]],
        worldId=n["worldId"], originWorldId=n["worldId"], appearsInWorlds=APPEARS.get(cid, [n["worldId"]]),
        families=famlist, aliases=p["aliases"],
        birth=p["born_w"].get(w, p["born"]), death=p["died"], occupation=p["occ"],
        photo=pick_photo(slug, "m" if w == "x" else w),
        parents={k: parents[cid].get(k, []) for k in ("biological", "adoptive", "step", "unknownNature")},
        children={k: children[cid].get(k, []) for k in ("biological", "adoptive", "step", "unknownNature")},
        partners=partners.get(cid, []),
        siblings={k: siblings[cid].get(k, []) for k in ("full", "half", "step", "unspecified")},
        counterparts={wid: i for wid, i in groups.get(slug, {}).get("members", {}).items() if i != cid},
        identities=ids_for_char, temporalVersions=TV.get(cid, []),
        timeTravel=TT.get(cid, dict(isTimeTraveler=None, role=None, notes=None, certainty="not_established")),
        bootstrapParadox=bootstrap_block(cid),
        knotDependence=knot_dependence(slug, "m" if w == "x" else w) if slug != "unknown" else dict(dependsOnKnot=True, reason=KD["unknown"][1], certainty="confirmed"),
        existsAfterFinalResolution=exists_after(slug, "m" if w == "x" else w, cid),
        notes=NOTES.get(cid),
    )
    characters.append(char)
CH = {c["id"]: c for c in characters}

# --------------------------------------------------------------------------- árvores hierárquicas (visões derivadas do grafo)
import re
def year_key(s):
    m = re.search(r"\d{4}", s or "")
    return int(m.group(0)) if m else 9999

def build_tree(member_ids, label):
    pcs = [r for r in rels if r["type"] == "parent_child" and r["kind"] in ("biological", "adoptive") and r["parentId"] in member_ids and r["childId"] in member_ids]
    kids = defaultdict(list); has_parent = set()
    for r in pcs:
        kids[r["parentId"]].append((r["childId"], r["kind"])); has_parent.add(r["childId"])
    sort_key = lambda i: (year_key(CH[i]["birth"]), i)
    visited = set()
    def ext(i):
        ep = [r["parentId"] for r in rels if r["type"] == "parent_child" and r["childId"] == i and r["parentId"] not in member_ids]
        ec = [r["childId"] for r in rels if r["type"] == "parent_child" and r["parentId"] == i and r["childId"] not in member_ids]
        return ep, ec
    def expand(i, kind=None, depth=0):
        if i in visited:
            return dict(id=i, ref=True, kindFromParent=kind)
        visited.add(i)
        ep, ec = ext(i)
        node = dict(id=i, name=CH[i]["name"], kindFromParent=kind, depth=depth,
                    spouses=[p["personId"] for p in CH[i]["partners"] if p["type"] == "spouse" and p["personId"] in member_ids],
                    crossWorldParentIds=ep, crossWorldChildIds=ec, inBootstrapCycle=bool(CH[i]["bootstrapParadox"]["roles"] and any(r["role"] == "cycle_member" for r in CH[i]["bootstrapParadox"]["roles"])),
                    dependsOnKnot=CH[i]["knotDependence"]["dependsOnKnot"], survivesInOrigin=CH[i]["existsAfterFinalResolution"]["value"] if CH[i]["worldId"] == "origin_world" else bool(CH[i]["existsAfterFinalResolution"].get("survivesAs")),
                    children=[expand(c, k, depth + 1) for c, k in sorted(kids[i], key=lambda t: sort_key(t[0]))])
        return node
    roots = sorted([i for i in member_ids if i not in has_parent], key=sort_key)
    tree = [expand(r) for r in roots]
    cyc_roots = []
    for i in sorted(member_ids, key=sort_key):
        if i not in visited:
            cyc_roots.append(i); tree.append(dict(expand(i), cycleEntryPoint=True))
    return dict(description=label, rootIds=roots, cycleEntryPointIds=cyc_roots, tree=tree, expandedNodeCount=len(visited))

def members_of(wid):
    return {c["id"] for c in characters if c["worldId"] == wid} | {"cw_unknown"}

familyTrees = {
    "viewNote": "Visões derivadas do grafo (relationships). Cada pessoa é expandida uma única vez (sob o primeiro pai encontrado); as demais ocorrências são {ref:true}. Ciclos nunca causam recursão: o fechamento aparece como referência. Use 'relationships' como fonte de verdade.",
    "origin_world": build_tree(members_of("origin_world") - {"cw_unknown"}, "Árvore do Mundo de Origem (inclui quem sobrevive ao final)."),
    "jonas_world": build_tree(members_of("jonas_world"), "Árvore do Mundo de Jonas (inclui o Unknown, nó compartilhado)."),
    "martha_world": build_tree(members_of("martha_world"), "Árvore do Mundo de Martha (inclui o Unknown, nó compartilhado)."),
}

# --- consolidada: grafo de grupos de contrapartes (um nó = pessoa em todos os mundos em que existe)
gid = lambda s: f"cg_{s}"
gnodes = {}
for slug in P:
    mem = {n["worldId"]: n["id"] for n in nodes.values() if n["slug"] == slug}
    gnodes[gid(slug)] = dict(id=gid(slug), slug=slug, name=P[slug]["name"].split(" (")[0] if slug not in ("unknown",) else P[slug]["name"],
                             worldsPresent=sorted(mem) if slug != "unknown" else ["jonas_world", "martha_world"], memberIds=mem if slug != "unknown" else {"cross_world": "cw_unknown"})
gedges = {}
for r in rels:
    if r["type"] != "parent_child" or r["kind"] not in ("biological", "adoptive"):
        continue
    a, b = CH[r["parentId"]]["canonicalSlug"], CH[r["childId"]]["canonicalSlug"]
    key = (a, b, r["kind"])
    e = gedges.setdefault(key, dict(parentGroupId=gid(a), childGroupId=gid(b), kind=r["kind"], worlds=[], relationshipIds=[], paradoxIds=set()))
    e["worlds"].append(r["worldId"]); e["relationshipIds"].append(r["id"]); e["paradoxIds"].update(r.get("paradoxIds", []))
gedge_list = []
for e in gedges.values():
    e["worlds"] = sorted(set(e["worlds"])); e["paradoxIds"] = sorted(e["paradoxIds"])
    pw, cw_ = set(gnodes[e["parentGroupId"]]["worldsPresent"]), set(gnodes[e["childGroupId"]]["worldsPresent"])
    e["presentInAllSharedWorlds"] = set(w for w in e["worlds"] if w != "cross_world") >= (pw & cw_) if "cross_world" not in e["worlds"] else True
    gedge_list.append(e)
gkids = defaultdict(list); gparent = set()
for e in gedge_list:
    gkids[e["parentGroupId"]].append((e["childGroupId"], e["kind"])); gparent.add(e["childGroupId"])
gvis = set()
def gexpand(i, kind=None, depth=0):
    if i in gvis:
        return dict(id=i, ref=True, kindFromParent=kind)
    gvis.add(i)
    return dict(id=i, name=gnodes[i]["name"], kindFromParent=kind, depth=depth, worldsPresent=gnodes[i]["worldsPresent"],
                children=[gexpand(c, k, depth + 1) for c, k in sorted(gkids[i], key=lambda t: t[0])])
groots = sorted([i for i in gnodes if i not in gparent])
gtree = [gexpand(r) for r in groots]
gcycle = [i for i in sorted(gnodes) if i not in gvis]
gtree += [dict(gexpand(i), cycleEntryPoint=True) for i in gcycle if i not in gvis]
familyTrees["consolidated"] = dict(
    description="Árvore consolidada: cada nó é um grupo de contrapartes (pessoa em todos os mundos). Arestas indicam em quais mundos o vínculo existe; o Unknown liga o Mundo de Jonas e o Mundo de Martha.",
    nodes=list(gnodes.values()), edges=gedge_list, rootGroupIds=groots, cycleEntryPointGroupIds=gcycle, tree=gtree,
    overlays=dict(
        bootstrapParadoxCyclePaths={px["id"]: px["cyclePath"] for px in paradoxes if px.get("cyclePath")},
        knotDependentCharacterIds=[c["id"] for c in characters if c["knotDependence"]["dependsOnKnot"] is True],
        knotIndependentOrUnknownCharacterIds=[c["id"] for c in characters if c["knotDependence"]["dependsOnKnot"] is not True and c["worldId"] != "origin_world"],
        survivingInOriginWorldIds=[c["id"] for c in characters if c["worldId"] == "origin_world" and c["existsAfterFinalResolution"]["value"]],
        shownAliveInFinalSceneIds=[c["id"] for c in characters if c["worldId"] == "origin_world" and c["existsAfterFinalResolution"].get("evidence") == "shown_on_screen"]))

# --------------------------------------------------------------------------- conexões entre mundos
crossWorldConnections = dict(
    counterpartGroups=list(groups.values()),
    crossWorldRelationshipIds=[r["id"] for r in rels if r.get("worldId") == "cross_world"],
    events=[
        dict(id="cw_unknown_conception", type="parentage", fromIds=["j_jonas", "m_martha"], toId="cw_unknown", date="2019-11-06", certainty="high",
             description="Jonas (Mundo de Jonas) e Martha (Mundo de Martha) concebem o Unknown no Mundo de Martha."),
        dict(id="cw_jonas_rescued_to_martha_world", type="travel", fromIds=["m_martha"], toId="j_jonas", certainty="high",
             description="Uma Martha do Mundo de Martha salva Jonas no Apocalipse do Mundo de Jonas e o leva ao seu mundo."),
        dict(id="cw_origin_prevention", type="travel", fromIds=["j_jonas", "m_martha"], toIds=["o_marek", "o_sonja", "o_charlotte_t"], date="1971-11-08", certainty="confirmed",
             description="Jonas e Martha chegam ao Mundo de Origem e impedem o acidente; os dois mundos deixam de existir."),
        dict(id="cw_god_particle_piece", type="object_transfer", fromIds=["m_martha"], toIds=["j_jonas"], date="1888", certainty="high",
             description="Em 1888 uma Martha do Mundo de Martha entrega ao grupo de Adam um pedaço da Partícula de Deus, base da viagem no tempo do Sic Mundus."),
        dict(id="cw_claudia_identity", type="identity_assumption", fromIds=["j_claudia"], toIds=["m_claudia"], date="2040", certainty="medium", description="Segundo o Wiki, a Claudia do Mundo de Jonas mata sua contraparte e assume a identidade dela."),
        dict(id="cw_blueprints", type="information_transfer", fromIds=["cw_unknown", "m_martha", "j_claudia"], toIds=["j_hg"], certainty="medium", paradoxId="px_info_time_machine_blueprints",
             description="Cadeia das plantas da máquina entre os dois mundos."),
        dict(id="cw_origin_echo", type="echo", fromIds=["o_hannah"], toIds=["j_jonas"], certainty="confirmed",
             description="Hannah Wöller (Origem) sonha com dois mundos desaparecendo e olha uma capa amarela como a de Jonas: ecos, sem laço genético."),
    ],
    note="Personagens com mesmo nome em mundos diferentes são versões equivalentes (counterpartGroups), não indivíduos únicos nascidos em vários mundos.")

# --------------------------------------------------------------------------- validação
checks = []
def check(name, ok, detail=None):
    checks.append(dict(check=name, passed=bool(ok), detail=detail))
ids = [c["id"] for c in characters]
idset = set(ids)
check("ids de personagens são únicos", len(ids) == len(idset), len(ids))
rel_ids = [r["id"] for r in rels]
check("ids de relações são únicos", len(rel_ids) == len(set(rel_ids)), len(rel_ids))
bad = [(r["id"], x) for r in rels for x in ([r["parentId"], r["childId"]] if r["type"] == "parent_child" else r["memberIds"]) if x not in idset]
check("toda relação referencia ids existentes", not bad, bad[:5])
sym_bad = []
for c in characters:
    for k in ("biological", "adoptive", "step", "unknownNature"):
        for p in c["parents"][k]:
            if c["id"] not in CH[p]["children"][k]: sym_bad.append((c["id"], p, k))
        for ch in c["children"][k]:
            if c["id"] not in CH[ch]["parents"][k]: sym_bad.append((ch, c["id"], k))
check("pai↔filho consistente nas duas direções (por tipo de vínculo)", not sym_bad, sym_bad[:5])
psym = [(c["id"], p["personId"]) for c in characters for p in c["partners"] if not any(q["personId"] == c["id"] for q in CH[p["personId"]]["partners"])]
check("cônjuges/parceiros simétricos", not psym, psym[:5])
ssym = [(c["id"], s) for c in characters for k, v in c["siblings"].items() for s in v if c["id"] not in CH[s]["siblings"][k]]
check("irmãos simétricos", not ssym, ssym[:5])
check("prefixo do id bate com worldId", all((c["id"].split("_")[0] == "cw" and c["id"] == "cw_unknown") or PFX[c["worldId"]] == c["id"].split("_")[0] for c in characters))
check("nenhum personagem é pai de si mesmo", all(r["parentId"] != r["childId"] for r in rels if r["type"] == "parent_child"))
check("no máximo 2 pais biológicos por personagem", all(len(c["parents"]["biological"]) <= 2 for c in characters), [c["id"] for c in characters if len(c["parents"]["biological"]) > 2])
# caminhos de ciclo reais
cyc_bad = []
for px in paradoxes:
    path = px.get("cyclePath")
    if path:
        if path[0] != path[-1]: cyc_bad.append((px["id"], "não fecha"))
        for a, b in zip(path, path[1:]):
            if b not in CH[a]["children"]["biological"]: cyc_bad.append((px["id"], a, b))
check("cada cyclePath fecha e usa apenas arestas biológicas pai→filho existentes", not cyc_bad, cyc_bad)
pbad = [(px["id"], pa["characterId"]) for px in paradoxes for pa in px["participants"] if pa["characterId"] not in idset]
check("participantes dos paradoxos existem", not pbad, pbad)
# SCCs do grafo biológico
adj = defaultdict(list)
for r in rels:
    if r["type"] == "parent_child" and r["kind"] == "biological": adj[r["parentId"]].append(r["childId"])
idx, low, onst, st, sccs, cnt = {}, {}, set(), [], [], [0]
sys.setrecursionlimit(10000)
def strong(v):
    idx[v] = low[v] = cnt[0]; cnt[0] += 1; st.append(v); onst.add(v)
    for w in adj[v]:
        if w not in idx: strong(w); low[v] = min(low[v], low[w])
        elif w in onst: low[v] = min(low[v], idx[w])
    if low[v] == idx[v]:
        comp = []
        while True:
            w = st.pop(); onst.discard(w); comp.append(w)
            if w == v: break
        if len(comp) > 1: sccs.append(sorted(comp))
for v in sorted(idset):
    if v not in idx: strong(v)
declared = [set(sum([px["cyclePath"][:-1] for px in paradoxes if px["types"] == ["genealogical_bootstrap"] and px["id"] in grp], [])) for grp in
            ({"px_gen_unknown_jonas_world", "px_gen_unknown_martha_world"}, {"px_gen_doppler_jonas_world"}, {"px_gen_doppler_martha_world"})]
check("os ciclos genealógicos reais do grafo (componentes fortemente conexos) coincidem exatamente com os paradoxos genealógicos declarados",
      sorted(map(sorted, declared)) == sorted(sccs), dict(sccs=sccs))
# paradoxos: só participantes com papel de ciclo/dependência têm flag
check("isExistenceDependent=True só em personagens ligados a algum paradoxo", all((not c["bootstrapParadox"]["isExistenceDependent"]) or c["bootstrapParadox"]["isInvolved"] for c in characters))
check("viajantes do tempo sem paradoxo existem (não se classifica todo viajante como bootstrap)",
      any(c["timeTravel"]["isTimeTraveler"] is True and not c["bootstrapParadox"]["isInvolved"] for c in characters),
      [c["id"] for c in characters if c["timeTravel"]["isTimeTraveler"] is True and not c["bootstrapParadox"]["isInvolved"]])
# árvores
tree_bad = []
def collect(nodes_, acc, refs):
    for n in nodes_:
        (refs if n.get("ref") else acc).append(n["id"])
        if not n.get("ref"): collect(n["children"], acc, refs)
for wid in ("origin_world", "jonas_world", "martha_world"):
    acc, refs = [], []; collect(familyTrees[wid]["tree"], acc, refs)
    mem = members_of(wid) - ({"cw_unknown"} if wid == "origin_world" else set())
    if sorted(acc) != sorted(mem) or len(acc) != len(set(acc)): tree_bad.append(wid)
    if any(r not in mem for r in refs): tree_bad.append(wid + ":ref")
check("cada árvore expande cada pessoa do mundo exatamente uma vez (refs só apontam para membros)", not tree_bad, tree_bad)
cm = [g["id"] for g in groups.values() if len(set(g["members"].values())) != len(g["members"])]
check("contrapartes: um id por mundo", not cm)
for w_ in WORLD.values():
    check(f"mundo {w_} possui personagens", any(c["worldId"] == w_ for c in characters))
check("todas as árvores de personagens do Mundo de Origem sobrevivem (existsAfterFinalResolution.value=true)", all(c["existsAfterFinalResolution"]["value"] for c in characters if c["worldId"] == "origin_world"))
check("todo personagem de Jonas/Martha deixa de existir (value=false)", all(c["existsAfterFinalResolution"]["value"] is False for c in characters if c["worldId"] != "origin_world"))
n_ph = sum(1 for c in characters if c["photo"]["url"]); n_px = sum(1 for c in characters if c["photo"]["kind"] == "equivalent_version_proxy")
check("fotos: URLs https do Dark Wiki quando existem", all((c["photo"]["url"] is None) or c["photo"]["url"].startswith("https://static.wikia.nocookie.net/dark-netflix/") for c in characters), dict(withUrl=n_ph, proxy=n_px, without=len(characters) - n_ph))

doc = dict(
    meta=dict(
        title="Dark — grafo genealógico dirigido (3 mundos)", version="1.0.0", generatedAt="2026-10-11", language="pt-BR",
        counts=dict(characters=len(characters), relationships=len(rels), paradoxes=len(paradoxes), identities=len(identities),
                    byWorld={w_: sum(1 for c in characters if c["worldId"] == w_) for w_ in WORLD.values()}),
        modelNotes=[
            "Fonte de verdade: 'relationships'. parents/children/partners/siblings e familyTrees são derivados e consistentes por construção.",
            "Cada nó é uma pessoa em UM mundo (prefixos o_, j_, m_). O Unknown (cw_unknown) é o único indivíduo que liga dois mundos.",
            "Idades diferentes da mesma pessoa = temporalVersions (não são nós). Nomes/papéis = identities. Contrapartes entre mundos = counterparts/counterpartGroups.",
            "Ciclos genealógicos são arestas normais pai→filho; as árvores hierárquicas usam {ref:true} no fechamento do ciclo.",
            "null em campos booleanos significa 'não estabelecido nas fontes consultadas', não 'falso'."],
        enums=dict(
            certainty=["confirmed (dito/mostrado na série)", "high (série + Wiki coerentes ou dedução direta)", "medium (Wiki; não conferido cena a cena)", "low (suposição do Wiki ou ambígua)"],
            parentChildKind=["biological", "adoptive", "step", "unknown_nature"],
            relationshipTypes=["parent_child", "spouse", "partner", "sibling", "derived_kinship"],
            paradoxTypes=["genealogical_bootstrap", "information_object_bootstrap", "temporal_causal_loop"],
            paradoxRoles=["cycle_member", "dependent_off_cycle", "supporting_relation", "object_carrier", "causal_agent", "causal_motive"],
            existenceStatus=["exists", "exists_in_restored_timeline", "implied_by_family_listing", "historical_deceased", "unborn_at_end", "world_erased", "erased_explicitly"],
            photoKind=["wiki_page_image", "equivalent_version_proxy", "unavailable"]),
        sources=[
            dict(name="Dark Wiki (Fandom)", url="https://dark-netflix.fandom.com", use="Infoboxes de família, biografias e imagens (via MediaWiki API)."),
            dict(name="Série Dark (Netflix), temporadas 1–3", use="Fonte principal para eventos e para o desfecho de 'O Paraíso' (T3E8)."),
            dict(name="Guia interativo oficial da Netflix (dark.netflix.io)", use="Não consultado diretamente: é um app JavaScript sem dados acessíveis por requisição simples; só foi usado indiretamente por citações do Wiki.", verified=False)],
        excludedCharacters="Personagens sem laço familiar com as linhagens Kahnwald, Nielsen, Doppler, Tiedemann e Tannhaus (ex.: Obendorf, Clausen, Selma Ahrens, Jasmin Trewen, Yasin Friese, Dr. Reimann) foram deixados de fora de propósito.",
        validation=checks),
    worlds=worlds, families=families, characters=characters, relationships=rels, identities=identities, paradoxes=paradoxes,
    familyTrees=familyTrees, crossWorldConnections=crossWorldConnections)

failed = [c for c in checks if not c["passed"]]
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)
json.load(open(OUT, encoding="utf-8"))  # sintaxe
print(f"{len(characters)} personagens | {len(rels)} relações | {len(paradoxes)} paradoxos | fotos: {n_ph} ({n_px} proxy)")
for c in checks:
    print(("OK   " if c["passed"] else "FAIL ") + c["check"] + ("" if c["passed"] else f"  -> {c['detail']}"))
sys.exit(1 if failed else 0)
