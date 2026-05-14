import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LangSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border border-border bg-card/60 p-0.5 backdrop-blur ${className}`}>
      <Globe className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
      <Button
        size="sm"
        variant={lang === "fr" ? "default" : "ghost"}
        className="h-7 rounded-full px-3 text-xs"
        onClick={() => setLang("fr")}
      >
        FR
      </Button>
      <Button
        size="sm"
        variant={lang === "wo" ? "default" : "ghost"}
        className="h-7 rounded-full px-3 text-xs"
        onClick={() => setLang("wo")}
      >
        WO
      </Button>
    </div>
  );
}
