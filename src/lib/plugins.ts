export interface SlashPlugin {
  id: string
  name: string
  description: string
  insert: string
}

const builtinPlugins: SlashPlugin[] = [
  {
    id: 'callout-info',
    name: 'Info Callout',
    description: 'Insert an info callout block',
    insert: '<div data-type="callout" class="callout callout-info"><p><strong>Info:</strong> </p></div>',
  },
  {
    id: 'callout-warning',
    name: 'Warning Callout',
    description: 'Insert a warning callout block',
    insert: '<div data-type="callout" class="callout callout-warning"><p><strong>Warning:</strong> </p></div>',
  },
  {
    id: 'callout-tip',
    name: 'Tip Callout',
    description: 'Insert a tip callout block',
    insert: '<div data-type="callout" class="callout callout-tip"><p><strong>Tip:</strong> </p></div>',
  },
  {
    id: 'mermaid',
    name: 'Mermaid Diagram',
    description: 'Insert a mermaid diagram block',
    insert: '<pre data-language="mermaid"><code>graph TD\n  A[Start] --> B[End]</code></pre>',
  },
  {
    id: 'table',
    name: 'Table',
    description: 'Insert a 2x2 table',
    insert: '<table><tr><th>Header 1</th><th>Header 2</th></tr><tr><td>Cell</td><td>Cell</td></tr></table>',
  },
]

const customPlugins: SlashPlugin[] = []

export function getSlashPlugins(): SlashPlugin[] {
  return [...builtinPlugins, ...customPlugins]
}

export function registerSlashPlugin(plugin: SlashPlugin) {
  if (!customPlugins.find((p) => p.id === plugin.id)) {
    customPlugins.push(plugin)
  }
}