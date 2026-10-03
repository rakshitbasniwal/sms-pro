export default function Spinner({ size = '' }) {
  return (
    <div className="loading-wrap">
      <div className={`spinner ${size}`} />
      <span>Loading...</span>
    </div>
  );
}
