import { ShaderAnimation } from "@/components/ui/shader-lines";

export function AuthAside() {
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <ShaderAnimation />
      <div className="absolute inset-0 flex items-end p-10">
        <p className="pointer-events-none max-w-sm text-lg text-balance text-white">
          Track what each customer owes, record partial payments, and see what
          is still due.
        </p>
      </div>
    </div>
  );
}
