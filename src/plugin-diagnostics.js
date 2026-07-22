import { homedir } from "node:os";
import { basename, extname, join } from "node:path";
import { readdir, stat } from "node:fs/promises";

const PLUGIN_EXTENSIONS = new Map([
  [".vst3", "vst3"],
  [".vst", "vst"],
  [".component", "audio_unit"]
]);

export const DEFAULT_PLUGIN_DIRECTORIES = Object.freeze([
  "/Library/Audio/Plug-Ins/VST3",
  "/Library/Audio/Plug-Ins/Components",
  "~/Library/Audio/Plug-Ins/VST3",
  "~/Library/Audio/Plug-Ins/Components"
]);

export async function diagnosePlugins(bridge, args = {}) {
  const queries = normalizeQueries(args.queries ?? (args.query ? [args.query] : []));
  const directories = normalizeDirectories(args);
  const disk = await scanPluginDirectories(directories);
  const ableton = await readAbletonPluginMatches(bridge, queries);
  const queryDiagnostics = queries.map((query) => diagnoseQuery(query, disk.plugins, ableton.byQuery[query]));

  return {
    ok: true,
    queries,
    scannedDirectories: disk.directories,
    diskPlugins: disk.plugins,
    abletonIndexed: ableton.indexed,
    availableInAbleton: queryDiagnostics.filter((entry) => entry.status === "available_in_ableton"),
    missingFromAbletonIndex: queryDiagnostics.filter((entry) => entry.status === "installed_not_indexed"),
    notInstalled: queryDiagnostics.filter((entry) => entry.status === "not_installed"),
    recommendedActions: recommendedActions(queryDiagnostics, ableton.errors),
    errors: ableton.errors
  };
}

async function scanPluginDirectories(directories) {
  const directoryReports = [];
  const plugins = [];
  for (const directory of directories) {
    const report = {
      path: directory,
      exists: false,
      pluginCount: 0,
      errors: []
    };
    try {
      const directoryStat = await stat(directory);
      report.exists = directoryStat.isDirectory();
      if (report.exists) {
        const found = await scanDirectory(directory, directory);
        plugins.push(...found);
        report.pluginCount = found.length;
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        report.errors.push(error.message);
      }
    }
    directoryReports.push(report);
  }

  return {
    directories: directoryReports,
    plugins: dedupePlugins(plugins).sort((a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path))
  };
}

async function scanDirectory(root, current, depth = 0) {
  if (depth > 4) {
    return [];
  }
  const entries = await readdir(current, { withFileTypes: true });
  const plugins = [];
  for (const entry of entries) {
    const path = join(current, entry.name);
    const extension = extname(entry.name).toLowerCase();
    const format = PLUGIN_EXTENSIONS.get(extension);
    if (format) {
      plugins.push({
        name: basename(entry.name, extension),
        fileName: entry.name,
        format,
        path,
        directory: root,
        scope: pluginScope(root)
      });
      continue;
    }
    if (entry.isDirectory()) {
      plugins.push(...await scanDirectory(root, path, depth + 1));
    }
  }
  return plugins;
}

async function readAbletonPluginMatches(bridge, queries) {
  const byQuery = {};
  const indexed = [];
  const errors = [];
  for (const query of queries) {
    const result = { plugins: [], browserResults: [] };
    try {
      const plugins = await bridge.invoke("list_plugins", { kind: "any", query });
      result.plugins = Array.isArray(plugins.plugins) ? plugins.plugins : [];
      indexed.push(...result.plugins);
    } catch (error) {
      errors.push({ query, source: "plugins", message: error.message });
    }
    try {
      const browser = await bridge.invoke("search_browser", { kind: "plugin", query, limit: 50 });
      result.browserResults = Array.isArray(browser.results) ? browser.results : [];
      indexed.push(...result.browserResults);
    } catch (error) {
      errors.push({ query, source: "browser", message: error.message });
    }
    byQuery[query] = result;
  }
  return {
    byQuery,
    indexed: dedupeByNamePath(indexed)
  };
}

function diagnoseQuery(query, diskPlugins, abletonMatches = { plugins: [], browserResults: [] }) {
  const diskMatches = diskPlugins.filter((plugin) => matchesQuery(plugin, query));
  const indexedMatches = abletonMatches.plugins ?? [];
  const browserMatches = abletonMatches.browserResults ?? [];
  const abletonCount = indexedMatches.length + browserMatches.length;
  const status = abletonCount > 0
    ? "available_in_ableton"
    : diskMatches.length > 0
      ? "installed_not_indexed"
      : "not_installed";
  return {
    query,
    status,
    diskMatches,
    indexedMatches,
    browserMatches
  };
}

function recommendedActions(diagnostics, errors = []) {
  const actions = [];
  if (diagnostics.some((entry) => entry.status === "installed_not_indexed")) {
    actions.push("Open Ableton Preferences > Plug-Ins and enable Use VST3 Plug-In System Folders and/or Audio Units as needed.");
    actions.push("Run Rescan. If the setting was already enabled, toggle it off/on or use Option/Alt + Rescan for a full rescan.");
    actions.push("Run ableton_diagnose_plugins again before attempting to load the plugin.");
  }
  if (diagnostics.some((entry) => entry.status === "not_installed")) {
    actions.push("Install the missing plugin, then run Ableton's plugin rescan before loading it in a set.");
  }
  if (errors.length > 0) {
    actions.push("Ableton plugin index could not be fully queried; verify AbletonMcpBridge is running and rerun doctor.");
  }
  if (actions.length === 0) {
    actions.push("Plugins appear available in Ableton's index; it is reasonable to use load-device tools after normal snapshot/risk checks.");
  }
  return actions;
}

function normalizeQueries(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.map((query) => String(query ?? "").trim()).filter(Boolean))];
}

function normalizeDirectories(args) {
  const custom = Array.isArray(args.pluginDirectories)
    ? args.pluginDirectories.map((directory) => String(directory ?? "").trim()).filter(Boolean)
    : [];
  const defaults = args.includeDefaultDirectories === false ? [] : DEFAULT_PLUGIN_DIRECTORIES;
  return [...new Set([...defaults, ...custom].map(expandHomeDirectory))];
}

function expandHomeDirectory(path) {
  if (path === "~") {
    return homedir();
  }
  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }
  return path;
}

function matchesQuery(plugin, query) {
  const haystack = [plugin.name, plugin.fileName, plugin.format, plugin.path].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function pluginScope(directory) {
  return directory.startsWith(homedir()) ? "user" : "system";
}

function dedupePlugins(plugins) {
  const seen = new Set();
  return plugins.filter((plugin) => {
    const key = `${plugin.format}:${plugin.path}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeByNamePath(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.kind ?? ""}:${item.name ?? ""}:${item.path ?? item.ref ?? ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
