export default function MiniChart({ data }) {
  if (!data || data.length === 0) return <div className="mini-chart" />
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  return (
    <div className="mini-chart">
      {data.map((v, i) => (
        <div
          key={i}
          className={`bar${i === data.length - 1 ? ' hi' : ''}`}
          style={{ height: `${20 + ((v - min) / range) * 70}%` }}
        />
      ))}
    </div>
  )
}
