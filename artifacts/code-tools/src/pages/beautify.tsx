import * as React from "react";
import js_beautify from "js-beautify";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import {
  Wand2, Minimize2, Copy, Trash2, ArrowUpFromLine,
  ChevronDown, ChevronUp, Settings2, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = ["JavaScript", "TypeScript", "HTML", "CSS", "JSON"];

const LANG_PRISM_MAP: Record<string, string> = {
  JavaScript: "javascript",
  TypeScript: "typescript",
  HTML: "markup",
  CSS: "css",
  JSON: "json",
};

const EXT_MAP: Record<string, string> = {
  JavaScript: "js",
  TypeScript: "ts",
  HTML: "html",
  CSS: "css",
  JSON: "json",
};

function highlight(code: string, language: string): string {
  const lang = LANG_PRISM_MAP[language] || "javascript";
  if (Prism.languages[lang]) {
    return Prism.highlight(code, Prism.languages[lang], lang);
  }
  return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getStats(text: string) {
  return { chars: text.length, lines: text ? text.split("\n").length : 0 };
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface BoolOpt {
  key: string;
  label: string;
  langs?: string[]; // undefined = all
  description?: string;
}

const BOOL_OPTIONS: BoolOpt[] = [
  { key: "end_with_newline",        label: "End script/style with newline" },
  { key: "preserve_newlines",       label: "Preserve inline braces/code blocks" },
  { key: "indent_empty_lines",      label: "Keep indentation on empty lines" },
  { key: "e4x",                     label: "Support E4X / JSX syntax",         langs: ["JavaScript","TypeScript"] },
  { key: "comma_first",             label: "Use comma-first list style",        langs: ["JavaScript","TypeScript"] },
  { key: "keep_array_indentation",  label: "Keep array indentation",            langs: ["JavaScript","TypeScript"] },
  { key: "break_chained_methods",   label: "Break lines on chained methods",    langs: ["JavaScript","TypeScript"] },
  { key: "space_before_conditional",label: 'Space before conditional: "if (x)"',langs: ["JavaScript","TypeScript"] },
  { key: "unescape_strings",        label: "Unescape \\xNN or \\uNNNN chars",   langs: ["JavaScript","TypeScript"] },
  { key: "jslint_happy",            label: "Use JSLint-happy formatting tweaks", langs: ["JavaScript","TypeScript"] },
  { key: "detect_packers",          label: "Detect packers & obfuscators (unsafe)", langs: ["JavaScript","TypeScript"] },
  { key: "indent_inner_html",       label: "Indent <head> and <body> sections", langs: ["HTML"] },
];

type BoolFlags = Record<string, boolean>;

const DEFAULT_FLAGS: BoolFlags = {
  end_with_newline: false,
  preserve_newlines: true,
  indent_empty_lines: false,
  e4x: false,
  comma_first: false,
  keep_array_indentation: false,
  break_chained_methods: false,
  space_before_conditional: true,
  unescape_strings: false,
  jslint_happy: false,
  detect_packers: false,
  indent_inner_html: false,
};

export default function BeautifyPage() {
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [language, setLanguage] = React.useState("JavaScript");
  const [optionsOpen, setOptionsOpen] = React.useState(false);

  const [indentSize, setIndentSize] = React.useState("2");
  const [useTabs, setUseTabs] = React.useState(false);
  const [wrapLength, setWrapLength] = React.useState("0");
  const [braceStyle, setBraceStyle] = React.useState("collapse");
  const [flags, setFlags] = React.useState<BoolFlags>(DEFAULT_FLAGS);

  const { toast } = useToast();

  const toggleFlag = (key: string) =>
    setFlags((f) => ({ ...f, [key]: !f[key] }));

  const inputStats = getStats(input);
  const outputStats = getStats(output);

  const highlightedOutput = React.useMemo(
    () => (output ? highlight(output, language) : ""),
    [output, language]
  );

  const buildOpts = () => ({
    indent_size: parseInt(indentSize),
    indent_with_tabs: useTabs,
    wrap_line_length: parseInt(wrapLength) || 0,
    brace_style: (flags.preserve_newlines ? "preserve-inline" : braceStyle) as any,
    end_with_newline: flags.end_with_newline,
    preserve_newlines: flags.preserve_newlines,
    indent_empty_lines: flags.indent_empty_lines,
    e4x: flags.e4x,
    comma_first: flags.comma_first,
    keep_array_indentation: flags.keep_array_indentation,
    break_chained_methods: flags.break_chained_methods,
    space_before_conditional: flags.space_before_conditional,
    unescape_strings: flags.unescape_strings,
    jslint_happy: flags.jslint_happy,
    indent_inner_html: flags.indent_inner_html,
  });

  const handleBeautify = () => {
    if (!input.trim()) return;
    try {
      const opts = buildOpts();
      let result = "";
      if (language === "JSON") {
        result = JSON.stringify(JSON.parse(input), null, useTabs ? "\t" : parseInt(indentSize));
      } else if (language === "HTML") {
        result = js_beautify.html_beautify(input, opts);
      } else if (language === "CSS") {
        result = js_beautify.css_beautify(input, opts);
      } else {
        result = js_beautify.js_beautify(input, opts);
      }
      if (flags.detect_packers && /eval\s*\(function\(p,a,c,k,e/.test(input)) {
        toast({
          title: "Packer/obfuscator detected",
          description: "The input appears to use a packer (e.g. p,a,c,k,e,r). Output may be incomplete.",
          variant: "destructive",
        });
      }
      setOutput(result);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error formatting code",
        description: err instanceof Error ? err.message : "Invalid syntax",
      });
    }
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    try {
      let result = "";
      if (language === "JSON") {
        result = JSON.stringify(JSON.parse(input));
      } else if (language === "CSS") {
        result = input
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\s+/g, " ")
          .replace(/\s*([\{\}\:\;\,])\s*/g, "$1")
          .replace(/;\}/g, "}")
          .trim();
      } else if (language === "HTML") {
        result = input
          .replace(/<!--[\s\S]*?-->/g, "")
          .replace(/\>\s+\</g, "><")
          .trim();
      } else {
        result = input
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/.*/g, "")
          .replace(/\s+/g, " ")
          .replace(/\s*([\{\}\(\)\[\]\:\;\,\.\=\+\-\*\/\%\!\&\<>\?\|])\s*/g, "$1")
          .trim();
      }
      setOutput(result);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error minifying code",
        description: err instanceof Error ? err.message : "Invalid syntax",
      });
    }
  };

  const handleClear = () => { setInput(""); setOutput(""); };
  const handleSwap = () => { if (output) { setInput(output); setOutput(""); } };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied", description: "Output copied to clipboard." });
  };

  const handleDownload = () => {
    if (!output) return;
    const ext = EXT_MAP[language] || "txt";
    downloadText(output, `compactify-output.${ext}`);
    toast({ title: "Downloaded", description: `Saved as compactify-output.${ext}` });
  };

  const visibleFlags = BOOL_OPTIONS.filter(
    (o) => !o.langs || o.langs.includes(language)
  );

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 3.5rem)" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0 bg-card gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={setLanguage} data-testid="select-language">
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <Button data-testid="button-beautify" variant="default" size="sm" onClick={handleBeautify}>
              <Wand2 className="w-4 h-4 mr-2" /> Beautify
            </Button>
            <Button data-testid="button-minify" variant="secondary" size="sm" onClick={handleMinify}>
              <Minimize2 className="w-4 h-4 mr-2" /> Minify
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button data-testid="button-clear" variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="w-4 h-4 mr-2" /> Clear
          </Button>
        </div>
      </div>

      {/* Options Panel */}
      <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen} className="border-b border-border bg-muted/10 shrink-0">
        <CollapsibleTrigger asChild>
          <button
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            data-testid="button-options-toggle"
          >
            <span className="flex items-center gap-2">
              <Settings2 className="w-3.5 h-3.5" />
              <span className="font-medium uppercase tracking-wider">Options</span>
            </span>
            {optionsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 bg-card border-t border-border">
            {/* Base formatting row */}
            <div className="flex flex-wrap gap-6 items-center pb-3 mb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Indent size</Label>
                <Select value={indentSize} onValueChange={setIndentSize}>
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 spaces</SelectItem>
                    <SelectItem value="4">4 spaces</SelectItem>
                    <SelectItem value="8">8 spaces</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch id="use-tabs" checked={useTabs} onCheckedChange={setUseTabs} className="scale-75" />
                <Label htmlFor="use-tabs" className="text-xs text-muted-foreground cursor-pointer">Use tabs</Label>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Line wrap at</Label>
                <Select value={wrapLength} onValueChange={setWrapLength}>
                  <SelectTrigger className="w-24 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Off</SelectItem>
                    <SelectItem value="80">80 chars</SelectItem>
                    <SelectItem value="100">100 chars</SelectItem>
                    <SelectItem value="120">120 chars</SelectItem>
                    <SelectItem value="160">160 chars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(language === "JavaScript" || language === "TypeScript") && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Brace style</Label>
                  <Select value={braceStyle} onValueChange={setBraceStyle}>
                    <SelectTrigger className="w-32 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collapse">Collapse</SelectItem>
                      <SelectItem value="expand">Expand</SelectItem>
                      <SelectItem value="end-expand">End-expand</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Checkbox options grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
              {visibleFlags.map((opt) => (
                <div key={opt.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`opt-${opt.key}`}
                    checked={!!flags[opt.key]}
                    onCheckedChange={() => toggleFlag(opt.key)}
                    className="h-3.5 w-3.5"
                    data-testid={`checkbox-${opt.key}`}
                  />
                  <Label
                    htmlFor={`opt-${opt.key}`}
                    className="text-xs text-muted-foreground cursor-pointer leading-tight"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Panels */}
      <div className="flex-1 flex min-h-0 flex-col md:flex-row">
        {/* Input */}
        <div className="flex-1 min-h-0 flex flex-col border-b md:border-b-0 md:border-r border-border">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Input</span>
            <span className="text-xs text-muted-foreground font-mono">{inputStats.lines} lines · {inputStats.chars} chars</span>
          </div>
          <textarea
            data-testid="input-code"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 min-h-0 w-full p-4 font-mono text-sm bg-background border-none resize-none focus:outline-none text-foreground leading-relaxed"
            placeholder={`Paste ${language} code here...`}
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex-1 min-h-0 flex flex-col" style={{ background: "var(--code-bg)" }}>
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Output</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">{outputStats.lines} lines · {outputStats.chars} chars</span>
              <div className="flex items-center gap-0.5 border-l border-border pl-2">
                <Button
                  data-testid="button-swap"
                  variant="ghost" size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={handleSwap} title="Use as input"
                  disabled={!output}
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                </Button>
                <Button
                  data-testid="button-copy"
                  variant="ghost" size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={handleCopy} title="Copy output"
                  disabled={!output}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button
                  data-testid="button-download"
                  variant="ghost" size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={handleDownload} title="Download output"
                  disabled={!output}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            {output ? (
              <pre className="p-4 font-mono text-sm leading-relaxed m-0 min-h-full">
                <code
                  className={`language-${LANG_PRISM_MAP[language] || "javascript"}`}
                  dangerouslySetInnerHTML={{ __html: highlightedOutput }}
                />
              </pre>
            ) : (
              <div className="p-4 font-mono text-sm text-muted-foreground/40 select-none">
                Result will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
