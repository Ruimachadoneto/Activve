import Link from "next/link";
import { Home, Dumbbell, User, MoreHorizontal, type LucideIcon } from "lucide-react";

export type Tab = "hoje" | "treino" | "corpo" | "mais";

const ITEMS: { id: Tab; label: string; Icon: LucideIcon; href?: string }[] = [
  { id: "hoje", label: "Hoje", Icon: Home, href: "/" },
  { id: "treino", label: "Treino", Icon: Dumbbell, href: "/treino" },
  { id: "corpo", label: "Corpo", Icon: User, href: "/corpo" },
  { id: "mais", label: "Mais", Icon: MoreHorizontal, href: "/mais" },
];

/**
 * Nav flutuante (direção v3): pílula fixa com blur sobre o conteúdo, em vez da barra
 * colada no fim da página. O espaçador interno reserva a altura no fluxo — as telas não
 * precisam saber que o nav flutua, e nenhuma teve que mudar padding.
 */
export function BottomNav({ active }: { active: Tab }) {
  return (
    <>
      <div className="h-24" aria-hidden />
      <nav
        className="elev-float fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-40px)] max-w-[400px] -translate-x-1/2 items-center justify-around rounded-full border border-line bg-surface/80 px-2 py-2 backdrop-blur-xl"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {ITEMS.map(({ id, label, Icon, href }) => {
          const isActive = id === active;
          const cls = [
            "flex min-w-[64px] flex-col items-center gap-0.5 rounded-full px-3 py-1.5 transition-colors",
            isActive ? "bg-accent/15 text-accent" : "text-faint hover:text-muted",
          ].join(" ");
          const inner = (
            <>
              <Icon size={20} aria-hidden />
              <span className="text-[10px] font-medium">{label}</span>
            </>
          );
          return href ? (
            <Link key={id} href={href} className={cls} aria-current={isActive ? "page" : undefined}>
              {inner}
            </Link>
          ) : (
            <span key={id} className={`${cls} opacity-50`} aria-disabled title="Em breve">
              {inner}
            </span>
          );
        })}
      </nav>
    </>
  );
}
