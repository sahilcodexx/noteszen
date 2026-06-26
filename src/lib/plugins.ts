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
    insert: '<blockquote><p><strong>Info:</strong> </p></blockquote>',
  },
  {
    id: 'callout-warning',
    name: 'Warning Callout',
    description: 'Insert a warning callout block',
    insert: '<blockquote><p><strong>Warning:</strong> </p></blockquote>',
  },
  {
    id: 'mermaid',
    name: 'Mermaid Diagram',
    description: 'Insert a mermaid code block placeholder',
    insert: '<pre><code>```mermaid\ngraph TD\n  A[Start] --> B[End]\n```</code></pre>',
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