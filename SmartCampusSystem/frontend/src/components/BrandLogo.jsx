import smartCampusLogo from "../img/smart-campus-logo.png";

/**
 * Shared Smart Campus System brand mark (replaces the old food emoji).
 */
const BrandLogo = ({ className = "", alt = "Smart Campus System", size }) => {
  const style = size
    ? { width: size, height: size, objectFit: "contain" }
    : undefined;

  return (
    <img
      src={smartCampusLogo}
      alt={alt}
      className={className}
      style={style}
      draggable={false}
    />
  );
};

export default BrandLogo;
