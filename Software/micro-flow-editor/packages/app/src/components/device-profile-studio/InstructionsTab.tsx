import type { Instruction } from "@spaghettilab/device-profile-authoring-model";
import { InstructionSection } from "./InstructionSection.js";

const NOT_MODELED = "Non ancora modellato: struct spaghetti_device_profile ha solo init_ops/sample_ops/safe_stop_ops — nessun array per questa sezione esiste nel modello reale (gap dichiarato in @spaghettilab/device-profile-authoring-model).";

export function InstructionsTab({ initOps, sampleOps, safeStopOps, onInitOps, onSampleOps, onSafeStopOps }: { readonly initOps: readonly Instruction[]; readonly sampleOps: readonly Instruction[]; readonly safeStopOps: readonly Instruction[]; readonly onInitOps: (v: readonly Instruction[]) => void; readonly onSampleOps: (v: readonly Instruction[]) => void; readonly onSafeStopOps: (v: readonly Instruction[]) => void }) {
  return (
    <div className="flex flex-col gap-2 p-6">
      <InstructionSection title="Identity probe" disabledNote={NOT_MODELED} />
      <InstructionSection title="Init" steps={initOps} onChange={onInitOps} />
      <InstructionSection title="Sample" steps={sampleOps} onChange={onSampleOps} />
      <InstructionSection title="Event" disabledNote={NOT_MODELED} />
      <InstructionSection title="Command" disabledNote={NOT_MODELED} />
      <InstructionSection title="Safe-stop" steps={safeStopOps} onChange={onSafeStopOps} />
    </div>
  );
}
