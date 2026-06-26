export function markdownToHtml(md: string): string {
  if (!md) return ''
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<span class="wikilink wikilink-exists">[[$1]]</span>')
  html = html.replace(/^- \[x\] (.+)$/gm, '<li data-type="taskItem" data-checked="true">$1</li>')
  html = html.replace(/^- \[ \] (.+)$/gm, '<li data-type="taskItem" data-checked="false">$1</li>')
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
  html = html.replace(/^(?!<[hulo]|<blockquote)(.+)$/gm, '<p>$1</p>')

  return html
}