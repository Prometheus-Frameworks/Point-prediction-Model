export function DiagnosticTagList({ tags }: { tags: string[] }) {
  if (!tags.length) {
    return <span className="muted">No active flags</span>;
  }

  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <span key={tag} className="tag">
          {tag.replace(/_/g, ' ')}
        </span>
      ))}
    </div>
  );
}
