import { useLanguage, languageLabels, Language } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

const LanguageSelector = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <select
        value={language}
        onChange={e => setLanguage(e.target.value as Language)}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
      >
        {(Object.keys(languageLabels) as Language[]).map(lang => (
          <option key={lang} value={lang}>{languageLabels[lang]}</option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
