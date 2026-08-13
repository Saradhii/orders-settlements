import { Shader3 } from "@/components/shader3";

export function AuthAside() {
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <Shader3 className="absolute inset-0 h-full max-h-none min-h-0" />
      <div className="pointer-events-none absolute inset-0 flex items-end p-10">
        <p className="max-w-sm text-lg text-balance text-white">
          Track what each customer owes, record partial payments, and see what
          is still due.
        </p>
      </div>
    </div>
  );
}
