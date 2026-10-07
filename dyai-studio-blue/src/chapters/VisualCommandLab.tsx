import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { COMMANDS, LANES, type Lane } from "@/data/model";
import { useExperience } from "@/state/experience";
import { IconArrow, Mark } from "@/components/ui";

type SimState = "idle" | "auth" | "generating" | "result" | "error";

/**
 * The Visual Command Lab — CURRENT EXPERIMENT, not the definition of DYAI.
 * Everything is simulated locally: lane, command, source-image (file name only), auth-required,
 * generating, result, error, reset. No image is generated. No request is made.
 */
export function VisualCommandLab({ compact = false }: { compact?: boolean }) {
  const { t } = useExperience();
  const [lane, setLane] = useState<Lane>("explain");
  const [command, setCommand] = useState("");
  const [sim, setSim] = useState<SimState>("idle");
  const [file, setFile] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0]?.name ?? "");
  const start = () => { setSim("generating"); timer.current = window.setTimeout(() => setSim("result"), 1100); };
  const reset = () => { if (timer.current) window.clearTimeout(timer.current); setSim("idle"); setCommand(""); setFile(""); if (input.current) input.current.value = ""; };

  return <div className={`vcl ${compact ? "vcl--compact" : ""}`}>
    <div className="vcl-head">
      <div><span className="vcl-brand"><Mark />VISUAL COMMAND LAB</span><span className="meta">{t.lab.simulation}</span></div>
      <span className={`meta vcl-state vcl-state--${sim}`}>{t.lab.states[sim]}</span>
    </div>
    <div className="vcl-grid">
      <div className="vcl-controls">
        <span className="meta block-label">{t.lab.lane}</span>
        <div className="vcl-lanes" role="tablist" aria-label={t.lab.lane}>
          {LANES.map((id, i) => <button key={id} type="button" role="tab" aria-selected={lane === id} tabIndex={lane === id ? 0 : -1} className={lane === id ? "is-active" : ""} id={`lane-${id}`}
            onClick={() => { setLane(id); setCommand(""); setSim("idle"); }}
            onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const n = LANES[(i + (e.key === "ArrowRight" ? 1 : LANES.length - 1)) % LANES.length]; setLane(n); setCommand(""); setSim("idle"); document.getElementById(`lane-${n}`)?.focus(); } }}>
            <span className="meta">{String(i + 1).padStart(2, "0")}</span>{t.lab.lanes[id]}
          </button>)}
        </div>
        <div className="vcl-command-head"><span className="meta block-label">{t.lab.choose}</span><span className="meta">{t.lab.commandCount}</span></div>
        <div className="command-list" role="group" aria-label={t.lab.choose}>
          {COMMANDS[lane].map((c) => <button key={c} type="button" className={command === c ? "is-active" : ""} aria-pressed={command === c} onClick={() => { setCommand(c); setSim("idle"); }}>{c}<IconArrow /></button>)}
        </div>
        <label className="upload-control"><span className="upload-icon" aria-hidden="true">+</span><span><b>{t.lab.upload}</b><small>{file || t.lab.noFile}</small></span><input ref={input} type="file" accept="image/*" onChange={onFile} /></label>
        <p className="upload-hint meta">{t.lab.uploadHint}</p>
        <div className="vcl-actions">
          {sim === "idle" && <button className="vcl-run" type="button" disabled={!command} onClick={() => setSim("auth")}>{t.lab.run}<IconArrow /></button>}
          {sim === "auth" && <button className="vcl-run" type="button" onClick={start}>{t.lab.simulate}<IconArrow /></button>}
          {sim === "generating" && <button className="vcl-run" type="button" disabled><span className="spinner" />{t.lab.generating}</button>}
          {sim === "result" && <button className="vcl-run" type="button" onClick={reset}>{t.lab.useAgain}<IconArrow /></button>}
          {sim === "error" && <button className="vcl-run" type="button" onClick={() => setSim("idle")}>{t.lab.retry}<IconArrow /></button>}
          {sim !== "generating" && sim !== "error" && <button className="text-button" type="button" onClick={() => setSim("error")}>{t.lab.error}</button>}
          {(command || file) && <button className="text-button" type="button" onClick={reset}>{t.lab.reset}</button>}
        </div>
      </div>

      <div className={`vcl-output vcl-output--${sim}`} aria-live="polite">
        <div className="vcl-output-meta meta"><span>{command ? `${t.lab.selected} / ${command}` : t.lab.ready}</span><span>{file ? `${t.lab.source} / ${file}` : t.lab.simulation}</span></div>
        {sim === "auth" && <div className="output-message"><span className="output-symbol">↳</span><h4>{t.lab.authTitle}</h4><p>{t.lab.authBody}</p></div>}
        {sim === "generating" && <div className="output-message"><span className="spinner spinner--large" /><h4>{t.lab.generating}</h4><p>{t.lab.simulation}</p></div>}
        {sim === "error" && <div className="output-message output-message--error"><span className="output-symbol">!</span><h4>{t.lab.errorTitle}</h4><p>{t.lab.errorBody}</p></div>}
        {sim === "result" && <div className="output-message"><div className="simulated-frame" aria-hidden="true"><span /><span /><span /><i /><i /><b>{command}</b></div><h4>{t.lab.result}</h4><p>{t.lab.resultNote}</p></div>}
        {sim === "idle" && <div className="output-message output-message--idle"><div className="preview-mark" aria-hidden="true"><b>{command || "/"}</b></div><p>{command ? `${command} — ${t.lab.ready}` : t.lab.ready}</p></div>}
        <div className="vcl-output-foot meta"><span>{t.lab.output}</span><span>{t.lab.simulation}</span></div>
      </div>
    </div>
  </div>;
}
