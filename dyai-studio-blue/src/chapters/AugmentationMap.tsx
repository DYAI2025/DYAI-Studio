import { useEffect, useLayoutEffect, useRef } from "react";
import { ALL_ROUTES, LAYER_IDS, SCENARIO_IDS, SYSTEMS, routeKey, type LayerId, type ScenarioId } from "@/data/model";
import { gsap, useMediaQuery, useReducedMotion, NARROW_QUERY } from "@/lib/motion";
import { useExperience } from "@/state/experience";
import type { LayerRole } from "@/i18n";
import { Trace } from "@/components/ui";

type Pos = Record<LayerId, { x: number; y: number }>;

function targetPositions(id: ScenarioId): Pos {
  const out = {} as Pos;
  for (const l of LAYER_IDS) out[l] = { x: SYSTEMS[id].nodes[l].x, y: SYSTEMS[id].nodes[l].y };
  return out;
}

function pathFor(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
}

/**
 * Chapter 3 — Interactive Augmentation Map (highest craft budget).
 * Selecting a situation genuinely reconfigures the system: node positions, prominence, visible routes,
 * primary route, roles, control points and evidence question all change. Geometry is interpolated with GSAP
 * (positions tweened, routes recomputed every frame), so the visitor sees one system becoming another —
 * not a new picture replacing the old one.
 * Under 680px the spatial map becomes a sequential eight-layer inspection with the same semantics.
 */
export function AugmentationMap() {
  const { t, state, dispatch } = useExperience();
  const reduced = useReducedMotion();
  const narrow = useMediaQuery(NARROW_QUERY);
  const scenario: ScenarioId = state.scenario ?? "decision";
  const system = SYSTEMS[scenario];
  const selected = state.layer;

  const canvas = useRef<HTMLDivElement>(null);
  const pos = useRef<Pos>(targetPositions(scenario));
  const nodeEls = useRef<Partial<Record<LayerId, HTMLButtonElement>>>({});
  const pathEls = useRef<Record<string, SVGPathElement>>({});

  const apply = () => {
    const p = pos.current;
    for (const l of LAYER_IDS) {
      const el = nodeEls.current[l];
      if (el) { el.style.left = `${p[l].x}%`; el.style.top = `${p[l].y}%`; }
    }
    for (const r of ALL_ROUTES) {
      const el = pathEls.current[routeKey(r)];
      if (el) el.setAttribute("d", pathFor(p[r[0]], p[r[1]]));
    }
  };

  // Geometry interpolation on scenario change.
  useLayoutEffect(() => {
    if (narrow) return;
    const target = targetPositions(scenario);
    if (reduced) { pos.current = target; apply(); return; }
    const tweens: gsap.core.Tween[] = [];
    for (const l of LAYER_IDS) {
      tweens.push(gsap.to(pos.current[l], { x: target[l].x, y: target[l].y, duration: 0.9, ease: "power3.inOut", onUpdate: apply }));
    }
    apply();
    return () => { tweens.forEach((tw) => tw.kill()); };
  }, [scenario, reduced, narrow]);

  // Make sure geometry is applied after (re)mounting the desktop canvas.
  useEffect(() => { if (!narrow) apply(); }, [narrow]);

  const primary = new Set(system.primaryRoute.map(routeKey));
  const secondary = new Set(system.secondaryRoute.map(routeKey));
  const touches = (r: [LayerId, LayerId]) => selected !== null && (r[0] === selected || r[1] === selected);

  const select = (layer: LayerId) => dispatch({ type: "layer", layer: selected === layer ? null : layer });

  return <section className="map-section chapter" id="augmentation-map" aria-labelledby="map-heading">
    <div className="page-shell">
      <Trace state="system" />
      <div className="chapter-heading-row">
        <div><h2 className="chapter-title" id="map-heading">{t.map.title}</h2><p className="chapter-intro">{t.map.body}</p></div>
        <p className="illustrative-label meta"><span aria-hidden="true" />{t.map.illustrative}</p>
      </div>

      <div className="scenario-select">
        <span className="meta scenario-select-label">{t.map.select}</span>
        <div className="scenario-tabs" role="group" aria-label={t.map.select}>
          {SCENARIO_IDS.map((id) => <button key={id} type="button" className={scenario === id ? "is-active" : ""} aria-pressed={scenario === id} onClick={() => dispatch({ type: "scenario", scenario: id })}>
            <span className="scenario-dot" aria-hidden="true" />{t.map.scenarios[id].title}
          </button>)}
        </div>
      </div>

      <p className="map-reconfigured" aria-live="polite"><span className="meta">{t.map.reconfigured}</span> <b>{t.map.scenarios[scenario].title}.</b> {t.map.scenarios[scenario].thesis}</p>

      {!narrow ? <div className="map-workspace">
        <div className="map-stage">
        <div className="map-canvas" ref={canvas} role="group" aria-label={t.map.canvasMeta}>
          <div className="map-canvas-meta meta"><span>{t.map.canvasMeta}</span><span>{system.aiCentral ? t.map.aiFlag.central : t.map.aiFlag.optional}</span></div>
          <svg className="map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {ALL_ROUTES.map((r) => {
              const key = routeKey(r);
              const kind = primary.has(key) ? "primary" : secondary.has(key) ? "secondary" : "hidden";
              return <path key={key} ref={(el) => { if (el) pathEls.current[key] = el; }} className={`map-route map-route--${kind} ${touches(r) && kind !== "hidden" ? "map-route--focus" : ""}`} vectorEffect="non-scaling-stroke" d={pathFor(pos.current[r[0]], pos.current[r[1]])} />;
            })}
          </svg>
          {LAYER_IDS.map((l) => {
            const spec = system.nodes[l];
            const side = spec.x > 60 ? "left" : "right";
            const vert = spec.y > 80 ? "up" : "down";
            return <button key={l} type="button" ref={(el) => { if (el) nodeEls.current[l] = el; }}
              className={`map-node map-node--${spec.prominence} ${selected === l ? "map-node--selected" : ""}`}
              data-side={side} data-vert={vert} aria-pressed={selected === l} onClick={() => select(l)}
              aria-label={`${t.map.layers[l].title} — ${t.map.prominence[spec.prominence]}`}>
              <span className="map-node-dot"><span /></span>
              <span className="map-node-copy"><b>{t.map.layers[l].title}</b><small className="meta">{t.map.prominence[spec.prominence]}</small></span>
            </button>;
          })}
        </div>
        <div className="map-legend meta" aria-hidden="true">
          <span><i className="lg lg-primary" />{t.map.legend.primary}</span><span><i className="lg lg-secondary" />{t.map.legend.secondary}</span><span><i className="lg lg-optional" />{t.map.legend.optional}</span>
          <span><i className="lg lg-route" />{t.map.legend.primaryRoute}</span><span><i className="lg lg-route2" />{t.map.legend.secondaryRoute}</span>
        </div>
        </div>
        <Inspector scenario={scenario} layer={selected} />
      </div> : <MapSequence scenario={scenario} layer={selected} select={select} />}
    </div>
  </section>;
}

function LayerFields({ role, layer }: { role: LayerRole; layer: LayerId }) {
  const { t } = useExperience();
  const f = t.map.inspector;
  const rows: [string, string | undefined][] = [[f.role, role.role], [f.human, role.human], [f.ai, role.ai], [f.control, role.control], [f.evidence, role.evidence]];
  return <dl className="layer-fields">
    <div><dt className="meta">{f.question}</dt><dd className="layer-question">{t.map.layers[layer].question}</dd></div>
    {rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="meta">{k}</dt><dd>{v}</dd></div>)}
  </dl>;
}

function Inspector({ scenario, layer }: { scenario: ScenarioId; layer: LayerId | null }) {
  const { t } = useExperience();
  const spec = layer ? SYSTEMS[scenario].nodes[layer] : null;
  return <aside className="map-inspector" aria-live="polite">
    <div className="inspector-head meta"><span>{t.map.inspector.selected}</span>{layer && spec && <span className={`prominence-tag prominence-tag--${spec.prominence}`}>{t.map.prominence[spec.prominence]}</span>}</div>
    {layer ? <>
      <h3 key={layer}>{t.map.layers[layer].title}</h3>
      <LayerFields role={t.map.roles[scenario][layer]} layer={layer} />
    </> : <>
      <h3>{t.map.scenarios[scenario].title}</h3>
      <p className="inspector-thesis">{t.map.scenarios[scenario].thesis}</p>
      <p className="inspector-hint">{t.map.inspect}</p>
    </>}
    <div className="inspector-foot meta"><span className="mini-signal mini-signal--on" />{t.map.scenarios[scenario].note}</div>
  </aside>;
}

function MapSequence({ scenario, layer, select }: { scenario: ScenarioId; layer: LayerId | null; select: (l: LayerId) => void }) {
  const { t } = useExperience();
  const system = SYSTEMS[scenario];
  return <div className="map-sequence">
    <p className="meta map-sequence-hint">{t.map.mobileHint} · {system.aiCentral ? t.map.aiFlag.central : t.map.aiFlag.optional}</p>
    <ol>
      {system.sequence.map((l, i) => {
        const spec = system.nodes[l];
        const open = layer === l;
        return <li key={l} className={`map-seq-row map-seq-row--${spec.prominence} ${open ? "is-open" : ""}`}>
          <button type="button" aria-expanded={open} aria-controls={`seq-${l}`} onClick={() => select(l)}>
            <span className="meta map-seq-index">{String(i + 1).padStart(2, "0")}</span>
            <span className="map-seq-title"><b>{t.map.layers[l].title}</b><small className="meta">{t.map.prominence[spec.prominence]}</small></span>
            <i aria-hidden="true">{open ? "−" : "+"}</i>
          </button>
          {open && <div id={`seq-${l}`} className="map-seq-detail"><LayerFields role={t.map.roles[scenario][l]} layer={l} /></div>}
        </li>;
      })}
    </ol>
  </div>;
}
