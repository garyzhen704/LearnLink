import { Link } from 'react-router-dom';

export default function GeneratedFromBadges({
  item,
  className = '',
}) {
  const materialName = item?.sourceMaterialName?.trim();
  const sourceClassName = item?.sourceClassName?.trim();
  const sourceClassColor = item?.sourceClassColor?.trim() || '#3b82f6';
  const isGenerated = Boolean(item?.sourceMaterial || materialName || sourceClassName);

  if (!isGenerated) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="tag">AI generated</span>
      {sourceClassName ? (
        <span className="tag">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: sourceClassColor }}
            aria-hidden="true"
          />
          <span>{sourceClassName}</span>
        </span>
      ) : null}
      {materialName ? (
        <Link
          to="/materials"
          className="tag max-w-full hover:bg-neutral-200"
          title={materialName}
        >
          <span className="truncate">From {materialName}</span>
        </Link>
      ) : item?.sourceMaterial ? (
        <Link to="/materials" className="tag hover:bg-neutral-200">
          Source material
        </Link>
      ) : null}
    </div>
  );
}
