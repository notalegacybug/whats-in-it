const SHORT: Record<string, string> = { 'Gluten (wheat, rye, barley, oats)': 'gluten' }

// The label's own cross-contact warning, kept apart from the ingredients and from the app's verdicts.
export function MayContain({ groups }: { groups: string[] }) {
  if (groups.length === 0) return null
  const names = groups.map((g) => SHORT[g] ?? g.toLowerCase())
  return (
    <p className="may-contain" data-testid="may-contain">
      <span className="visually-hidden">{`Label says it may contain: ${names.join(', ')}`}</span>
      <span aria-hidden="true">
        Label says it may contain:{' '}
        {names.map((n) => (
          <span key={n}>
            <span className="tag allergen">{n}</span>{' '}
          </span>
        ))}
      </span>
    </p>
  )
}
